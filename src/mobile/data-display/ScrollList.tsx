/**
 * ScrollList：移动端「列表 + 下拉刷新 + 上拉加载更多」组合。
 * 内层为 {@link ../../shared/data-display/List.tsx}，外包 {@link ../feedback/PullRefresh.tsx}；
 * 底部通过 `IntersectionObserver` 监听占位节点进入滚动可视区域触发 `onLoadMore`。
 */

import { createEffect, createMemo, onCleanup } from "@dreamer/view";
import type { JSXRenderable } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import {
  type ControlledOpenInput,
  readControlledOpenInput,
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
   * 未传时视为 `true`。
   */
  hasMore?: boolean;
  /** 滚动到底部附近时触发；由父级拉取分页并更新 `items` */
  onLoadMore?: () => void | Promise<void>;
  /** 禁用下拉刷新 */
  disabledPull?: boolean;
  /** 无更多数据时底部提示文案 */
  noMoreText?: string;
  /** 交叉观察 `rootMargin`（如提前 80px 触发），默认 `80px 0px` */
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
 * 在滚动根与占位节点就绪时挂载 `IntersectionObserver`，卸载时断开。
 * 服务端无 API 时返回空清理函数，水合后在浏览器端再连接。
 *
 * @param root - `PullRefresh` 内层滚动容器
 * @param sentinel - 列表底部占位（进入视口即尝试加载）
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
  return () => {
    io.disconnect();
  };
}

/**
 * 移动端可滚动列表：下拉刷新 + 底部自动加载更多。
 *
 * @param props - 列表数据、刷新/加载回调与透传配置
 */
export function ScrollList(props: ScrollListProps): JSXRenderable {
  const {
    class: className,
    listClass,
    refreshLoading,
    onRefresh,
    loadMoreLoading,
    disabledPull = false,
    noMoreText = "没有更多了",
    pullRefreshTexts,
    items,
    renderItem,
    header,
    footer,
    size,
    split,
    bordered,
    itemClass,
    grid,
  } = props;

  /** 订阅父级 `loadMoreLoading`（Signal / getter），供底部触发去重 */
  const loadingMore = createMemo(() =>
    readControlledOpenInput(loadMoreLoading)
  );

  /** 滚动容器与底部占位 DOM，由 ref 写入 */
  const rootHolder: { el: HTMLDivElement | null } = { el: null };
  const sentinelHolder: { el: HTMLDivElement | null } = { el: null };

  /** 当前观察器清理函数（每实例独立，避免多列表互相覆盖） */
  let disconnectIo: (() => void) | null = null;

  /**
   * 满足条件时触发一次加载；在观察器回调中调用，重复请求由父级 `loadMoreLoading` 防抖。
   * 每次调用读取最新 `props.onLoadMore`，避免依赖函数引用参与 effect 导致无意义重连。
   */
  const tryEmitLoadMore = () => {
    const fn = props.onLoadMore;
    if (!fn) return;
    if (props.hasMore === false) return;
    if (loadingMore()) return;
    fn();
  };

  /**
   * 断开旧观察器并在根节点与占位就绪时重新挂载，保证回调与 `rootMargin` 最新。
   */
  const reconnectObserver = () => {
    disconnectIo?.();
    disconnectIo = null;
    const root = rootHolder.el;
    const sentinel = sentinelHolder.el;
    if (!root || !sentinel || !props.onLoadMore) return;
    const margin = props.loadMoreRootMargin ?? "80px 0px";
    disconnectIo = bindLoadMoreObserver(root, sentinel, {
      rootMargin: margin,
      onNeedLoad: tryEmitLoadMore,
    });
  };

  onCleanup(() => {
    disconnectIo?.();
    disconnectIo = null;
  });

  /**
   * 加载结束或 `hasMore` / `loadMoreRootMargin` 变化时重连观察器，
   * 以便在底部仍可见时继续触发下一页（仅靠 IO 不总会在 loading→idle 时再回调）。
   */
  createEffect(() => {
    void loadingMore();
    void props.hasMore;
    void props.loadMoreRootMargin;
    /** 仅关心「是否提供回调」而非函数引用，避免父级每次渲染内联函数导致反复重连 */
    void (props.onLoadMore != null);
    queueMicrotask(() => reconnectObserver());
  });

  /**
   * 将 `PullRefresh` 内层滚动根与本地 holder 同步并重建观察器。
   *
   * @param el - 滚动容器或卸载时的 null
   */
  const setScrollRoot = (el: HTMLDivElement | null) => {
    rootHolder.el = el;
    reconnectObserver();
  };

  /**
   * 列表底部占位 ref：进入可视区域即尝试 `onLoadMore`。
   *
   * @param el - 占位节点或 null
   */
  const setSentinel = (el: HTMLDivElement | null) => {
    sentinelHolder.el = el;
    reconnectObserver();
  };

  const loadMoreSlot = (
    <div class="flex flex-col gap-2">
      {loadingMore() && (
        <div class="text-center text-sm text-slate-500 dark:text-slate-400 py-2">
          加载中…
        </div>
      )}
      {props.hasMore === false && (
        <div class="text-center text-sm text-slate-400 dark:text-slate-500 py-2">
          {noMoreText}
        </div>
      )}
      <div
        ref={setSentinel}
        class="h-2 w-full shrink-0"
        aria-hidden="true"
        data-ui-scroll-list-sentinel=""
      />
    </div>
  );

  return (
    <PullRefresh
      {...pullRefreshTexts}
      class={twMerge("flex min-h-0 flex-1 flex-col", className)}
      loading={refreshLoading}
      onRefresh={onRefresh}
      disabled={disabledPull}
      scrollContainerRef={setScrollRoot}
    >
      <List
        items={items as ListItemProps[] | unknown[]}
        renderItem={renderItem}
        header={header}
        footer={footer}
        size={size}
        split={split}
        bordered={bordered}
        itemClass={itemClass}
        grid={grid}
        class={twMerge("min-h-0", listClass)}
        loadMore={loadMoreSlot}
      />
    </PullRefresh>
  );
}
