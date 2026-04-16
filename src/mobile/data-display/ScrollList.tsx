/**
 * ScrollList：移动端「列表 + 下拉刷新 + 上拉加载更多」组合。
 * 内层为 {@link ../../shared/data-display/List.tsx}，外包 {@link ../feedback/PullRefresh.tsx}；
 * 底部加载区通过 `List` 的 `loadMore` 插在列表体之后，再经 `IntersectionObserver` 监听占位触发 `onLoadMore`。
 *
 * **滚动回顶**：除布局重算外，须保证 `PullRefresh` 滚动根与底部哨兵的 **`ref` 回调引用跨渲染稳定**；
 * 且 `rootHolder`、门闩等须挂在 **Owner→Runtime 单例** 上，避免组件函数每重跑一次就丢 `rootHolder.el`、IO 永远不连。
 * 子树变高时仍用「加载前快照」、`createEffect`+微任务、`MutationObserver` 与多相位 `rAF`/`setTimeout` 纠偏。
 *
 * **加载更多**：默认可滚时须在滚动根上产生过 `scroll` 才允许触发；若 **`scrollHeight` 不超出视口**
 * （用户无法产生 `scroll`），则视为「已在底部」，在 IO 就绪与每次 `loadMoreLoading` 结束后再放宽门闩。
 * `IntersectionObserver` 默认 **`rootMargin` 为 0**；`scroll` 仅在**近底**时顺带 `tryEmit` 且仅近底时解锁 `consumed`。
 * 分页纠偏写 `scrollTop` 后会强制 `consumed` 并延长抑制，避免纠偏触发的 `scroll` 与加载结束 effect 叠成连刷。
 */

import {
  createEffect,
  createMemo,
  getOwner,
  onCleanup,
  untrack,
} from "@dreamer/view";
import type { JSXRenderable, Owner } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import {
  type ControlledOpenInput,
  type HasMoreInput,
  readControlledOpenInput,
  readHasMoreInput,
} from "../../shared/feedback/controlled-open.ts";
import {
  List,
  type ListItemProps,
  type ListProps,
} from "../../shared/data-display/List.tsx";
import {
  PullRefresh,
  type PullRefreshProps,
} from "../feedback/PullRefresh.tsx";

/** 从 {@link ListProps} 透传的列表展示相关字段 */
export type ScrollListListProps = Pick<
  ListProps,
  | "items"
  | "renderItem"
  | "header"
  | "footer"
  | "size"
  | "split"
  | "bordered"
  | "itemClass"
  | "grid"
>;

export interface ScrollListProps extends ScrollListListProps {
  /** 最外层容器 class（PullRefresh 根节点） */
  class?: string;
  /** 传给 {@link List} 根节点的 class */
  listClass?: string;
  /** 下拉刷新中；推荐 `createSignal` 返回值，勿只传 `sig.value` */
  refreshLoading?: ControlledOpenInput;
  /** 下拉松手后的刷新逻辑 */
  onRefresh?: PullRefreshProps["onRefresh"];
  /** 上拉加载中；为 true 时不会重复触发 `onLoadMore` */
  loadMoreLoading?: ControlledOpenInput;
  /**
   * 是否仍有下一页；为 `false` 时不再调用 `onLoadMore`。
   * 未传时视为 `true`。推荐传 `createSignal` 或 `() => sig.value`，勿只传 `hasMore={sig.value}` 快照。
   */
  hasMore?: HasMoreInput;
  /** 滚动到底部附近时触发；由父级拉取分页并更新 `items` */
  onLoadMore?: () => void | Promise<void>;
  /** 禁用下拉刷新 */
  disabledPull?: boolean;
  /** 无更多数据时底部提示文案 */
  noMoreText?: string;
  /**
   * 交叉观察 `rootMargin`（扩根盒以提前/延后判定相交）。
   * 默认 **`0px 0px 0px 0px`**：须滚到列表底部哨兵**实际进入**滚动根可视区才触发；若需略提前可传如 `0px 0px 48px 0px`（仅扩底边）。
   */
  loadMoreRootMargin?: string;
  /**
   * 透传 PullRefresh 文案等（不含 children / class / loading / onRefresh / disabled /
   * scrollContainerRef）。
   */
  pullRefreshTexts?: Pick<
    PullRefreshProps,
    | "pullingText"
    | "loosingText"
    | "loadingText"
    | "successText"
    | "successDuration"
    | "headHeight"
    | "pullDistance"
  >;
}

/**
 * 当前运行时是否具备 `IntersectionObserver`（Hybrid/SSR 的 Deno 侧通常没有）。
 *
 * @returns 可用则为 true；与 {@link ../../../shared/navigation/Affix.tsx} 一致，用 `typeof` 避免未定义全局
 */
function hasIntersectionObserver(): boolean {
  return typeof IntersectionObserver !== "undefined" &&
    typeof IntersectionObserver === "function";
}

/**
 * `ScrollList` 在 `items` 等 signal 更新时会**再次执行整段组件函数**；若每次新建 `rootHolder` 与 `let` 门闩，
 * 在 `PullRefresh` 的 `ref` 已稳定、不再二次触发时，`rootHolder.el` 会一直是 `null`，IO 永远不连、上拉无反应。
 * 故把须跨本次执行保留的字段挂在 **Owner → 单例 Runtime** 上（与 {@link ../feedback/PullRefresh.tsx} 的 DOM 桥同理）。
 */
type ScrollListRuntime = {
  rootHolder: { el: HTMLDivElement | null };
  sentinelHolder: { el: HTMLDivElement | null };
  sentinelSt: { run: (el: HTMLDivElement | null) => void };
  /**
   * 与 {@link sentinelSt} 同理：`PullRefresh` 的 `scrollContainerRef` 须**恒为同一函数引用**，
   * 否则部分环境下 `ref` 反复解绑/重绑，`data-pull-refresh-content` 像整块重渲、IO 与 `scroll` 监听丢失。
   */
  scrollRootSt: { run: (el: HTMLDivElement | null) => void };
  /** 透传给 `PullRefresh.scrollContainerRef` 的稳定桥梁 */
  scrollRootRefBridge: (el: HTMLDivElement | null) => void;
  /** 哨兵 `ref`：引用须在实例生命周期内恒定 */
  sentinelRefFn: (el: HTMLDivElement | null) => void;
  disconnectIo: (() => void) | null;
  loadMoreArmedByScroll: boolean;
  loadMoreConsumedUntilScroll: boolean;
  suppressClearConsumedUntilMs: number;
  scrollMetrics: { lastTop: number; lastH: number; lastCh: number };
  detachScrollListener: (() => void) | null;
  lastSeenItemCount: number;
  restoreGuardUntil: number;
  restoreBaseline: { top: number; h: number; ch: number } | null;
  disconnectMutationObserver: (() => void) | null;
  loadMoreLayoutSnapshot: { top: number; h: number; ch: number } | null;
  wasLoadMoreLoading: boolean;
  /** `onLoadMore` 尚未结束时为 true，防 IO/scroll/raf 同帧重入 */
  loadMoreEmitBusy: boolean;
  /**
   * 上一拍 `loadingMore` 快照，供「加载结束补偿」区分首屏与 true→false（避免首屏挂载闪动）。
   */
  prevLoadMoreLoadingForIdle: boolean | null;
  /** 本次 `onLoadMore` 前滚动根 `scrollHeight`，用于加载结束后检测 DOM 是否增高（防死循环） */
  scrollHeightAtEmit: number;
};

const scrollListRuntimeByOwner = new WeakMap<Owner, ScrollListRuntime>();

/**
 * 取得或创建当前 `ScrollList` Owner 对应的运行时单例。
 *
 * @param owner - 当前组件 Owner
 */
function acquireScrollListRuntime(owner: Owner): ScrollListRuntime {
  const existing = scrollListRuntimeByOwner.get(owner);
  if (existing) return existing;

  const sentinelHolder: ScrollListRuntime["sentinelHolder"] = { el: null };
  const sentinelSt: ScrollListRuntime["sentinelSt"] = {
    run: (_el: HTMLDivElement | null) => {},
  };
  const scrollRootSt: ScrollListRuntime["scrollRootSt"] = {
    run: (_el: HTMLDivElement | null) => {},
  };
  const sentinelRefFn = (el: HTMLDivElement | null) => {
    sentinelSt.run(el);
  };
  const instance: ScrollListRuntime = {
    rootHolder: { el: null },
    sentinelHolder,
    sentinelSt,
    scrollRootSt,
    scrollRootRefBridge: (el: HTMLDivElement | null) => {
      scrollRootSt.run(el);
    },
    sentinelRefFn,
    disconnectIo: null,
    loadMoreArmedByScroll: false,
    loadMoreConsumedUntilScroll: true,
    suppressClearConsumedUntilMs: 0,
    scrollMetrics: { lastTop: 0, lastH: 0, lastCh: 0 },
    detachScrollListener: null,
    lastSeenItemCount: 0,
    restoreGuardUntil: 0,
    restoreBaseline: null,
    disconnectMutationObserver: null,
    loadMoreLayoutSnapshot: null,
    wasLoadMoreLoading: false,
    loadMoreEmitBusy: false,
    prevLoadMoreLoadingForIdle: null,
    scrollHeightAtEmit: 0,
  };
  scrollListRuntimeByOwner.set(owner, instance);
  onCleanup(() => {
    scrollListRuntimeByOwner.delete(owner);
  });
  return instance;
}

/**
 * 解析 `items` 行数（与 {@link ../../shared/data-display/List.tsx} 解包规则一致）。
 *
 * @param raw - `ScrollList` 收到的 `items`
 */
function readScrollListItemsLength(
  raw: ListProps["items"] | undefined,
): number {
  if (raw == null) return 0;
  if (typeof raw === "function") {
    const fn = raw as () => unknown;
    if (fn.length !== 0) return 0;
    const out = fn();
    return Array.isArray(out) ? out.length : 0;
  }
  return Array.isArray(raw) ? raw.length : 0;
}

/**
 * 判断滚动容器是否还有可滚动的纵向余量（略大于 `clientHeight` 才视为可滚，避免亚像素抖动）。
 *
 * @param root - `PullRefresh` 内层滚动根
 * @param slop - 允许的像素裕量
 */
function rootHasVerticalScrollRoom(
  root: HTMLDivElement,
  slop = 6,
): boolean {
  return root.scrollHeight > root.clientHeight + slop;
}

/**
 * 判断滚动条是否已接近**最大**位置（距底 `px` 以内视为「在底部附近」）。
 * 用于 `scroll` 回调：仅在近底时顺带调用 `tryEmitLoadMore`，避免轻微滚动就配合 IO 连发分页。
 *
 * @param root - 内层滚动根
 * @param px - 距 `scrollHeight - clientHeight` 的像素容差
 */
function rootScrollNearBottom(root: HTMLDivElement, px = 56): boolean {
  const maxT = Math.max(0, root.scrollHeight - root.clientHeight);
  if (maxT <= 0) return true;
  return root.scrollTop >= maxT - px;
}

/**
 * 当列表总高度不超过视口时，用户**无法**派发有意义的 `scroll`，`loadMoreArmedByScroll` 会一直为假；
 * 此时放宽门闩，让底部 `IntersectionObserver` 仍能驱动分页（并在 `loadMoreLoading` 结束后继续连加载短列表多页）。
 *
 * @param rt - 列表运行时
 * @param props - 当前 `ScrollList` props
 */
function relaxLoadMoreLatchIfNoScroll(
  rt: ScrollListRuntime,
  props: ScrollListProps,
): void {
  const root = rt.rootHolder.el;
  if (!root || props.onLoadMore == null) return;
  if (!readHasMoreInput(props.hasMore)) return;
  if (rootHasVerticalScrollRoom(root)) return;
  if (readControlledOpenInput(props.loadMoreLoading)) return;
  if (Date.now() <= rt.suppressClearConsumedUntilMs) return;
  rt.loadMoreArmedByScroll = true;
  rt.loadMoreConsumedUntilScroll = false;
}

/**
 * 一次加载结束后：若当前已在近底，清除 `loadMoreConsumedUntilScroll`。
 * 贴底追加时可能无新的 `scroll` 事件；不检查 `suppressClearConsumedUntilMs`（见 ui-preact 同名函数注释）。
 *
 * @param rt - 列表运行时
 * @param props - 当前 `ScrollList` props
 */
function clearConsumedLatchIfNearBottomIdle(
  rt: ScrollListRuntime,
  props: ScrollListProps,
): void {
  const root = rt.rootHolder.el;
  if (!root) return;
  if (readControlledOpenInput(props.loadMoreLoading)) return;
  if (!rootHasVerticalScrollRoom(root)) return;
  if (!rootScrollNearBottom(root)) return;
  rt.loadMoreConsumedUntilScroll = false;
}

/**
 * 在滚动根与占位节点就绪时挂载 `IntersectionObserver`，卸载时断开。
 * 服务端无 API 时返回空清理函数，水合后在浏览器端再连接。
 *
 * @param root - `PullRefresh` 内层滚动容器
 * @param sentinel - 列表底部占位（进入可视区域即尝试加载）
 * @param opts - 触发条件与回调
 * @returns 断开观察的清理函数
 */
function bindLoadMoreObserver(
  root: HTMLDivElement,
  sentinel: HTMLDivElement,
  opts: {
    rootMargin: string;
    onNeedLoad: () => void;
  },
): () => void {
  if (!hasIntersectionObserver()) {
    return () => {};
  }
  const io = new IntersectionObserver(
    (entries) => {
      const hit = entries.some((e) => e.isIntersecting);
      if (hit) opts.onNeedLoad();
    },
    { root, rootMargin: opts.rootMargin, threshold: 0 },
  );
  io.observe(sentinel);
  /**
   * 不在此处**同步**调用 `takeRecords`：与 `loadingMore` false 后同一节拍内的 `scroll`/布局重排竞态时，
   * 会在尾哨仍相交处连续触发多页 `onLoadMore`（文档演示里曾出现「两次拉满」）。
   * 延后到微任务再 `takeRecords` 一次，既尽量兼容「observe 后不立即派发」的环境，又避免与当前栈上的状态打架。
   */
  queueMicrotask(() => {
    if (typeof io.takeRecords !== "function") return;
    for (const e of io.takeRecords()) {
      if (e.isIntersecting) {
        opts.onNeedLoad();
        break;
      }
    }
  });
  return () => {
    io.disconnect();
  };
}

/**
 * 列表变高（分页尾部追加）后计算应恢复的 `scrollTop`。
 * **策略**：始终沿用加载前记录的 `scrollTop`，仅夹到新的合法区间 `[0, maxScrollTop]`。
 * 不在「贴底触发加载」时改用「保距底」把视口推到新 `max`：那样会把刚追加的整页顶进视口（例如首屏与每页均为 10 条时底行会跳到新页最后一条），
 * 且新 `scrollTop === max` 会让尾哨仍与根相交，叠 `takeRecords` / `scroll` 易连刷到 `hasMore` 结束。
 *
 * @param el - 当前滚动容器
 * @param prevTop - 变高前的 `scrollTop`
 * @param prevH - 变高前的 `scrollHeight`（用于把 `prevTop` 规范到旧 max 内，防脏值）
 * @param prevCh - 变高前的 `clientHeight`
 * @returns 目标 `scrollTop`（已夹在合法范围内）
 */
function computeRestoreScrollTop(
  el: HTMLDivElement,
  prevTop: number,
  prevH: number,
  prevCh: number,
): number {
  const nh = el.scrollHeight;
  const ch = el.clientHeight;
  const maxT = Math.max(0, nh - ch);
  const prevTopClamped = Math.max(0, prevTop);
  if (prevH <= 0 || prevCh <= 0) {
    return Math.min(prevTopClamped, maxT);
  }
  const maxTOld = Math.max(0, prevH - prevCh);
  const prevTopInRange = Math.min(prevTopClamped, maxTOld);
  /** 追加在下方：保持原滚动偏移（不超过新内容高度带来的新 max） */
  return Math.max(0, Math.min(prevTopInRange, maxT));
}

/**
 * Hybrid SSR（Deno 等）下可能无 `requestAnimationFrame`；有则下一帧执行，否则降级为 `queueMicrotask`。
 *
 * @param cb - 回调
 */
function scheduleAnimationFrame(cb: () => void): void {
  const g = globalThis as typeof globalThis & {
    requestAnimationFrame?: (callback: () => void) => void;
  };
  const raf = g.requestAnimationFrame;
  if (typeof raf === "function") {
    raf.call(g, cb);
  } else {
    queueMicrotask(cb);
  }
}

/**
 * 移动端可滚动列表：下拉刷新 + 底部自动加载更多。
 *
 * @param props - 列表数据、刷新/加载回调与透传配置
 */
export function ScrollList(props: ScrollListProps): JSXRenderable {
  const scrollListOwner = getOwner();
  if (scrollListOwner == null) {
    throw new Error("[ScrollList] 须在 View Owner 下使用（getOwner() 为空）");
  }

  const {
    class: className,
    listClass,
    refreshLoading,
    onRefresh,
    disabledPull = false,
    noMoreText = "没有更多了",
    pullRefreshTexts,
    renderItem,
    header,
    footer,
    size,
    split,
    bordered,
    itemClass,
    grid,
  } = props;

  /**
   * 订阅父级加载更多中状态；必须读 `props.loadMoreLoading`，勿用解构出来的引用，
   * 以便与 `ControlledOpenInput`（含 Signal）在父级重绘时保持一致。
   */
  const loadingMore = createMemo(() =>
    readControlledOpenInput(props.loadMoreLoading)
  );

  /** 订阅是否仍有下一页（支持 Signal / getter），供 IO 回调与底部文案一致 */
  const hasMoreLive = createMemo(() => readHasMoreInput(props.hasMore));

  /** 订阅行数，供分页后纠正异常 `scrollTop` */
  const itemCount = createMemo(() => readScrollListItemsLength(props.items));

  /** 跨 `ScrollList` 多次函数执行的滚动根、哨兵、IO 与门闩状态（见 {@link ScrollListRuntime}） */
  const rt = acquireScrollListRuntime(scrollListOwner);

  /**
   * 满足条件时触发一次加载；在观察器回调中调用，重复请求由父级 `loadMoreLoading` 防抖。
   * 每次调用读取最新 `props.onLoadMore`，避免依赖函数引用参与 effect 导致无意义重连。
   */
  const tryEmitLoadMore = () => {
    const fn = props.onLoadMore;
    if (!fn) return;
    if (rt.loadMoreEmitBusy) return;
    if (!readHasMoreInput(props.hasMore)) return;
    if (readControlledOpenInput(props.loadMoreLoading)) return;
    const root = rt.rootHolder.el;
    if (!root) return;
    const scrollable = rootHasVerticalScrollRoom(root);
    /** 可滚列表：须真实 `scroll` 过且上一发后须再次滚动解锁；不可滚短列表由 {@link relaxLoadMoreLatchIfNoScroll} 放宽 */
    if (rt.loadMoreConsumedUntilScroll) return;
    if (!rt.loadMoreArmedByScroll && scrollable) return;
    rt.loadMoreLayoutSnapshot = {
      top: root.scrollTop,
      h: root.scrollHeight,
      ch: root.clientHeight,
    };
    /** 须盖住 {@link beginAppendScrollRestore} 的纠偏窗口（约 720ms），避免程序化 scroll 反复解锁闩导致连载 */
    rt.suppressClearConsumedUntilMs = Date.now() + 760;
    rt.loadMoreConsumedUntilScroll = true;
    rt.scrollHeightAtEmit = root.scrollHeight;
    rt.loadMoreEmitBusy = true;
    try {
      const ret = fn();
      if (
        ret != null && typeof (ret as PromiseLike<void>).then === "function"
      ) {
        (ret as PromiseLike<void>).then(
          () => {
            rt.loadMoreEmitBusy = false;
          },
          () => {
            rt.loadMoreEmitBusy = false;
          },
        );
      } else {
        rt.loadMoreEmitBusy = false;
      }
    } catch (e) {
      rt.loadMoreEmitBusy = false;
      throw e;
    }
  };

  /**
   * 断开旧观察器并在根节点与占位就绪时重新挂载，保证回调与 `rootMargin` 最新。
   */
  const reconnectObserver = () => {
    rt.disconnectIo?.();
    rt.disconnectIo = null;
    const root = rt.rootHolder.el;
    const sentinel = rt.sentinelHolder.el;
    if (!root || !sentinel || !props.onLoadMore) return;
    /** 默认 0：须哨兵真进视口才相交；大 margin 易「拉一点就加载」 */
    const margin = props.loadMoreRootMargin ?? "0px 0px 0px 0px";
    rt.disconnectIo = bindLoadMoreObserver(root, sentinel, {
      rootMargin: margin,
      onNeedLoad: tryEmitLoadMore,
    });
  };

  onCleanup(() => {
    rt.disconnectIo?.();
    rt.disconnectIo = null;
    rt.detachScrollListener?.();
    rt.detachScrollListener = null;
    rt.disconnectMutationObserver?.();
    rt.disconnectMutationObserver = null;
  });

  /**
   * `hasMore` / `loadMoreRootMargin` / `onLoadMore` 变化时重连观察器。
   * 勿订阅 `loadingMore`：否则每次加载态翻转都 disconnect + `takeRecords`，易与 idle 补偿叠刷。
   */
  createEffect(() => {
    void hasMoreLive();
    void props.loadMoreRootMargin;
    /** 仅关心「是否提供回调」而非函数引用，避免父级每次渲染内联函数导致反复重连 */
    void (props.onLoadMore != null);
    queueMicrotask(() => reconnectObserver());
  });

  /**
   * `loadMoreLoading` 刚变为 true 时拍快照：此时用户多在底部，异步请求返回前 `scroll` 可能不再更新。
   *
   * @returns `void`
   */
  createEffect(() => {
    const lm = loadingMore();
    const root = rt.rootHolder.el;
    if (lm && !rt.wasLoadMoreLoading && root) {
      rt.loadMoreLayoutSnapshot = {
        top: root.scrollTop,
        h: root.scrollHeight,
        ch: root.clientHeight,
      };
    }
    rt.wasLoadMoreLoading = lm;
  });

  /**
   * 加载结束后：短列表放宽门闩并尝试；可滚列表若在贴底无新 `scroll`，补清 `consumedUntilScroll` 后再尝试（下一帧再判布局）。
   * 首屏 `loadingMore===false` 时不跑补偿，避免与 IO 抢触发导致底部「加载中」闪动。
   *
   * @returns `void`
   */
  createEffect(() => {
    const lm = loadingMore();
    const prev = rt.prevLoadMoreLoadingForIdle;
    rt.prevLoadMoreLoadingForIdle = lm;
    if (lm) return;
    if (prev === null) return;
    if (prev !== true) return;
    queueMicrotask(() => {
      if (readControlledOpenInput(props.loadMoreLoading)) return;
      const root = rt.rootHolder.el;
      if (
        root != null &&
        rt.scrollHeightAtEmit > 0 &&
        root.scrollHeight <= rt.scrollHeightAtEmit + 2
      ) {
        rt.scrollHeightAtEmit = 0;
        return;
      }
      rt.scrollHeightAtEmit = 0;
      relaxLoadMoreLatchIfNoScroll(rt, props);
      clearConsumedLatchIfNearBottomIdle(rt, props);
      /**
       * 可滚列表在加载结束后**不要**在此无条件 `tryEmit`：`reconnect` 的 `takeRecords` 与纠偏 `scroll`
       * 已会触发；此处再调会与「仍贴在底部」叠成连发。仅**无纵向溢出**的短列表保留一次尝试。
       */
      if (root != null && !rootHasVerticalScrollRoom(root)) {
        tryEmitLoadMore();
      }
      const g = globalThis as typeof globalThis & {
        requestAnimationFrame?: (cb: () => void) => number;
      };
      if (typeof g.requestAnimationFrame !== "function") return;
      g.requestAnimationFrame(() => {
        if (readControlledOpenInput(props.loadMoreLoading)) return;
        clearConsumedLatchIfNearBottomIdle(rt, props);
        tryEmitLoadMore();
      });
    });
  });

  /**
   * 按 {@link restoreBaseline} 与当前 DOM 尺寸写回 `scrollTop`（在守卫窗口内可多次调用）。
   *
   * @returns `void`
   */
  const tryScrollRepairAfterAppend = () => {
    const el = rt.rootHolder.el;
    const base = rt.restoreBaseline;
    if (!el || !base || base.top < 8 || base.h <= 0 || base.ch <= 0) return;
    if (rt.restoreGuardUntil > 0 && Date.now() > rt.restoreGuardUntil) {
      rt.restoreBaseline = null;
      rt.restoreGuardUntil = 0;
      return;
    }
    const target = computeRestoreScrollTop(el, base.top, base.h, base.ch);
    const st = el.scrollTop;
    const ch = el.clientHeight;
    if (
      st < 6 ||
      (base.top > 24 && Math.abs(st - target) > Math.max(20, ch * 0.15))
    ) {
      el.scrollTop = target;
      /**
       * 纠偏写入的 `scrollTop` 会派发 `scroll`，若此时把 `loadMoreConsumedUntilScroll` 清掉，
       * 用户仍贴在底部 + `reconnect` 的 `takeRecords` 会立刻再发一页，出现「第二次随便拉一点就刷完」。
       * 故在程序化滚动后强制「须再次满足近底意图」并延长抑制窗口。
       */
      rt.loadMoreConsumedUntilScroll = true;
      rt.suppressClearConsumedUntilMs = Math.max(
        rt.suppressClearConsumedUntilMs,
        Date.now() + 1100,
      );
      rt.scrollMetrics.lastTop = el.scrollTop;
      rt.scrollMetrics.lastH = el.scrollHeight;
      rt.scrollMetrics.lastCh = el.clientHeight;
    }
  };

  /**
   * 条数刚增加时：写入恢复基线并多相位调度 {@link tryScrollRepairAfterAppend}（微任务 / rAF / setTimeout）。
   *
   * @returns `void`
   */
  const beginAppendScrollRestore = () => {
    const snap = rt.loadMoreLayoutSnapshot;
    const prevTopRaw = Math.max(rt.scrollMetrics.lastTop, snap?.top ?? 0);
    const prevH = snap != null && snap.h > 0 ? snap.h : rt.scrollMetrics.lastH;
    const prevCh = snap != null && snap.ch > 0
      ? snap.ch
      : rt.scrollMetrics.lastCh;
    if (prevH <= 0 || prevCh <= 0) return;
    /**
     * 任意行数增加都可走纠偏：目标仅为「保持加载前 `scrollTop`」（见 {@link computeRestoreScrollTop}），
     * 不再要求「必须先近底」才建基线，否则首屏中段追加时无法从异常 `scrollTop` 拉回。
     */
    rt.restoreBaseline = { top: prevTopRaw, h: prevH, ch: prevCh };
    rt.restoreGuardUntil = Date.now() + 720;
    /**
     * 多次尝试：子列表 `For` 插入可能晚于本轮任务，仅靠一次 `queueMicrotask` 不够。
     *
     * @returns `void`
     */
    const run = () => tryScrollRepairAfterAppend();
    queueMicrotask(() => {
      run();
      scheduleAnimationFrame(run);
      scheduleAnimationFrame(() => scheduleAnimationFrame(run));
      const to =
        (globalThis as typeof globalThis & { setTimeout?: typeof setTimeout })
          .setTimeout;
      if (typeof to === "function") {
        to.call(globalThis, run, 0);
        to.call(globalThis, run, 48);
      }
    });
  };

  /**
   * 条数在浏览器侧变多：`createEffect` + `queueMicrotask` 晚于本轮同步布局，再叠 MO 防后续插入打回顶。
   *
   * @returns `void`
   */
  createEffect(() => {
    void itemCount();
    void loadingMore();
    queueMicrotask(() => {
      const el = rt.rootHolder.el;
      const now = itemCount();
      const prev = rt.lastSeenItemCount;
      if (!el) {
        rt.lastSeenItemCount = now;
        return;
      }
      if (now > prev && prev > 0) {
        beginAppendScrollRestore();
      }
      rt.lastSeenItemCount = now;
    });
  });

  /**
   * 在滚动根上监听子树变更：仅在 {@link restoreGuardUntil} 窗口内触发 {@link tryScrollRepairAfterAppend}。
   *
   * @param el - 内层滚动容器
   * @returns 断开观察的函数
   */
  const attachAppendMutationGuard = (el: HTMLDivElement): () => void => {
    if (typeof MutationObserver === "undefined") {
      return () => {};
    }
    let rafPending = false;
    const mo = new MutationObserver(() => {
      if (rt.restoreGuardUntil <= 0 || Date.now() > rt.restoreGuardUntil) {
        return;
      }
      if (rafPending) return;
      rafPending = true;
      scheduleAnimationFrame(() => {
        rafPending = false;
        tryScrollRepairAfterAppend();
      });
    });
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
    };
  };

  /**
   * 将 `PullRefresh` 内层滚动根与本地 holder 同步并重建观察器；经 {@link ScrollListRuntime.scrollRootRefBridge} 挂到 `PullRefresh`。
   *
   * @param el - 滚动容器或卸载时的 null
   */
  rt.scrollRootSt.run = (el: HTMLDivElement | null) => {
    rt.detachScrollListener?.();
    rt.detachScrollListener = null;
    rt.disconnectMutationObserver?.();
    rt.disconnectMutationObserver = null;
    const prevScrollRoot = rt.rootHolder.el;
    rt.rootHolder.el = el;

    if (!el) {
      rt.loadMoreArmedByScroll = false;
      rt.loadMoreConsumedUntilScroll = true;
      rt.suppressClearConsumedUntilMs = 0;
    } else if (el !== prevScrollRoot) {
      /** 滚动根换成新节点时才重置门闩，避免同一 DOM 上 ref 重复触发把「已上拉」状态清掉 */
      rt.loadMoreArmedByScroll = false;
      rt.loadMoreConsumedUntilScroll = true;
      rt.suppressClearConsumedUntilMs = 0;
    }

    if (el) {
      /**
       * 持续记录滚动位置；分页后若框架/浏览器把 `scrollTop` 清 0，仍可依此处恢复。
       * 同时维护「加载更多」门闩：仅在实际滚动后允许触发，并在每次派发后闩住直至再次滚动，
       * 避免 IO 重连时 `takeRecords` 连载。
       *
       * @returns `void`
       */
      const onScroll = () => {
        const st = el.scrollTop;
        rt.scrollMetrics.lastH = el.scrollHeight;
        rt.scrollMetrics.lastCh = el.clientHeight;
        rt.loadMoreArmedByScroll = true;
        /** 高频 `scroll`：勿在仍挂 observer 时订阅 `loadMoreLoading`，避免误绑外层模板 effect（同 {@link PullRefresh} 触摸路径） */
        const loadingNow = untrack(() =>
          readControlledOpenInput(props.loadMoreLoading)
        );
        /**
         * 仅在**近底**时解锁「上一发后须再滚动」：中段轻滑不应解锁，否则纠偏后的 `scroll` 会把
         * `consumed` 清掉并立刻 `tryEmit`，与 IO 叠加连刷多页。
         */
        if (
          !loadingNow &&
          Date.now() > rt.suppressClearConsumedUntilMs &&
          rootScrollNearBottom(el)
        ) {
          rt.loadMoreConsumedUntilScroll = false;
        }
        // 异常回顶时浏览器仍会派发 scroll 且 scrollTop===0；若此处覆盖 lastTop，分页纠偏会失效
        if (st > 0) {
          rt.scrollMetrics.lastTop = st;
        }
        /**
         * 仅在**近底**时由 `scroll` 顺带触发：轻微滚动不应解锁 `loadMoreConsumedUntilScroll` 后立即连发
         * （`rootMargin` 较大或布局抖动时易一次滑完多页）。
         *
         * @returns `void`
         */
        queueMicrotask(() => {
          if (rootScrollNearBottom(el)) tryEmitLoadMore();
        });
      };
      el.addEventListener("scroll", onScroll, { passive: true });
      rt.detachScrollListener = () => {
        el.removeEventListener("scroll", onScroll);
      };

      /**
       * `ref` 晚挂载：若已回顶且快照/缓存可用，写入基线并走与分页相同的修复路径。
       *
       * @returns `void`
       */
      const tryFixLateMountedRoot = () => {
        const inner = rt.rootHolder.el;
        if (!inner || inner.scrollTop >= 8) return;
        const snap = rt.loadMoreLayoutSnapshot;
        const pt = Math.max(rt.scrollMetrics.lastTop, snap?.top ?? 0);
        const ph = snap != null && snap.h > 0 ? snap.h : rt.scrollMetrics.lastH;
        const pc = snap != null && snap.ch > 0
          ? snap.ch
          : rt.scrollMetrics.lastCh;
        if (pt < 8 || ph <= 0 || pc <= 0) return;
        rt.restoreBaseline = { top: pt, h: ph, ch: pc };
        rt.restoreGuardUntil = Date.now() + 720;
        tryScrollRepairAfterAppend();
      };
      queueMicrotask(() => {
        scheduleAnimationFrame(() => {
          scheduleAnimationFrame(tryFixLateMountedRoot);
        });
      });

      rt.disconnectMutationObserver = attachAppendMutationGuard(el);
    }

    reconnectObserver();
    if (el) {
      /**
       * 等 `bindLoadMoreObserver` 内 `takeRecords` 的微任务跑完后再放宽短列表门闩，避免与首帧防抖竞态。
       *
       * @returns `void`
       */
      queueMicrotask(() => {
        relaxLoadMoreLatchIfNoScroll(rt, props);
        if (el != null && !rootHasVerticalScrollRoom(el)) {
          tryEmitLoadMore();
        }
      });
    }
  };

  rt.sentinelSt.run = (el: HTMLDivElement | null) => {
    rt.sentinelHolder.el = el;
    reconnectObserver();
  };

  // `items` 不从 props 解构：整对象透传 List，便于 List 内 `createMemo` 读 `props.items`（含 `() => rows` 访问器）以订阅分页。

  /**
   * `loadMore` 须为**零参 thunk** 返回 JSX，勿在 `ScrollList` 函数体顶层先算好一整段 VNode：
   * 顶层若同步读 `loadingMore()` / `hasMoreLive()`（createMemo），`track(memo)` 会把外层「模板克隆」insert effect
   * 误挂为下游，`loadMoreLoading` 一变整段 PullRefresh/List 外壳重挂（与 {@link PullRefresh} 内误读 `isLoading` 同理）。
   */
  const loadMoreThunk = props.onLoadMore != null
    ? () => (
      <div class="flex flex-col gap-2">
        {loadingMore() && (
          <div class="text-center text-sm text-slate-500 dark:text-slate-400 py-2">
            加载中…
          </div>
        )}
        {!hasMoreLive() && (
          <div class="text-center text-sm text-slate-400 dark:text-slate-500 py-2">
            {noMoreText}
          </div>
        )}
        <div
          ref={rt.sentinelRefFn}
          class="h-2 w-full shrink-0"
          aria-hidden="true"
          data-ui-scroll-list-sentinel=""
        />
      </div>
    )
    : undefined;

  return (
    <PullRefresh
      {...pullRefreshTexts}
      class={twMerge(
        "flex min-h-0 flex-1 flex-col isolate",
        className,
      )}
      loading={refreshLoading}
      onRefresh={onRefresh}
      disabled={disabledPull}
      scrollContainerRef={rt.scrollRootRefBridge}
    >
      {/* 底部经 List.loadMore 挂在 For 之后，避免与 For 数组协调时插入行间 */}
      <List
        items={props.items as ListItemProps[] | unknown[] | undefined}
        renderItem={renderItem}
        header={header}
        footer={footer}
        size={size}
        split={split}
        bordered={bordered}
        itemClass={itemClass}
        grid={grid}
        /**
         * 勿加 `flex-1`：在 PullRefresh 的 flex 链里会把列表块压成视口高，内容无法撑高滚动根，
         * 表现为上下滑不动、下拉刷新也失效（`scrollTop` 恒为 0 时 touch 逻辑异常）。
         */
        class={twMerge("min-h-0", listClass)}
        loadMore={loadMoreThunk}
      />
    </PullRefresh>
  );
}
