/**
 * PullRefresh 下拉刷新（View）。
 *
 * **交互说明**（须列表已在顶部 `scrollTop≈0`）：
 * 1. 向下拖：头部显示「下拉刷新」类文案，指示条随下拉距离增长；
 * 2. 超过 `pullDistance`：切换为「松开刷新」类文案，提示松手即可触发；
 * 3. 松手：若已超过阈值则调用 `onRefresh`，父级将 `loading` 置 true 时显示加载中文案与转圈。
 *
 * `loading` 支持 `Signal` / 零参 getter，勿仅传 `sig.value`（Hybrid 下可能不更新）。
 * 手势：**鼠标/笔**走 **Pointer Events** + `setPointerCapture`；**触摸**另挂 **非 passive 的 `touchmove`**。
 * 原因：多数移动浏览器（尤其 WebKit）会把 `touch-pan-y` 下的纵向拖动交给**原生滚动与 overscroll 回弹**，
 * 仅在 `touchmove` 上 `preventDefault` 才能稳定从「橡皮筋」里抢到手势。
 *
 * **DOM 须为双层**：最外层 `overflow-hidden` 不滚动；**仅**列表内层 `overflow-y-auto`（`data-pull-refresh-content`）。
 * 手势：**最外层 `shell`（`pull-refresh` 根）捕获** `pointer*` / `touchstart`，保证先于子树内滚动消费；
 * **`touchmove` / `touchend` / `touchcancel` 挂在 `document` 捕获**：下拉时触点常移到外层 `main`，仅绑在子节点上会收不到 `touchmove`，无法 `preventDefault`，体感只剩浏览器/外层滚动条回弹。
 * `setPointerCapture` 仍落在内层 `data-pull-refresh-content` 上。`bindScrollRootRef` 只维护滚动根引用，**不再**负责挂/拆全局监听。
 *
 * 参考：Chrome 开发者文档 [Take control of your scroll](https://developer.chrome.com/blog/overscroll-behavior)
 * （`overscroll-behavior` / 与滚动链相关）；自定义下拉仍依赖 **`touchmove` + `{ passive: false }` 下条件 `preventDefault`**。
 *
 * **Mac 触控板 + Chrome**：触控板会合成 **Pointer + Touch**；`pointercancel` 日志多为壳上转发，**触摸主线**仍看 `touchmove`/`touchcancel`。
 * 文档页 **外层 `main` 也是 `overflow-y-auto`**，列表在顶部下拉时易与**整页滚动链**抢手势；内层用 **`overscroll-behavior-y: none`** 关掉该滚动根的橡皮筋，
 * 并在顶部武装后 **`touchmove` 首帧 `delta===0` 也 `preventDefault`**（仍仅 `delta>=0`，不挡向上滑浏览）。系统「三指拖移」仍可能打断序列；**鼠标左键拖**最稳。
 */

import {
  createMemo,
  createSignal,
  flushPendingSync,
  getOwner,
  onCleanup,
  runWithOwner,
  untrack,
} from "@dreamer/view";
import type { JSXRenderable, Owner, Signal } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import {
  type ControlledOpenInput,
  readControlledOpenInput,
} from "../../shared/feedback/controlled-open.ts";

export type PullRefreshStatus =
  | "idle"
  | "pulling"
  | "loosing"
  | "loading"
  | "success";

export interface PullRefreshProps {
  /** 是否处于加载中；推荐 `loading={sig}`，勿 `loading={sig.value}` */
  loading?: ControlledOpenInput;
  /** 下拉释放后触发的刷新回调；父级应在回调内拉取数据并随后将 loading 设为 false */
  onRefresh?: () => void | Promise<void>;
  /** 下拉过程提示文案 */
  pullingText?: string;
  /** 释放过程提示文案 */
  loosingText?: string;
  /** 加载过程提示文案 */
  loadingText?: string;
  /** 刷新成功提示文案；传空则不显示成功态 */
  successText?: string | null;
  /** 成功提示展示时长（ms），默认 500 */
  successDuration?: number;
  /** 头部区域高度（px），默认 50 */
  headHeight?: number;
  /** 触发刷新的下拉距离（px），默认与 headHeight 一致 */
  pullDistance?: number;
  /** 是否禁用下拉刷新 */
  disabled?: boolean;
  /** 子内容（通常为可滚动列表） */
  children?: unknown;
  /** 额外 class（作用于最外层） */
  class?: string;
  /**
   * 内层可滚动容器（`data-pull-refresh-content`）挂载/卸载时回调；
   * 供 {@link ../data-display/ScrollList.tsx} 等组合组件挂 `IntersectionObserver` 或 `scroll` 做上拉加载。
   */
  scrollContainerRef?: (el: HTMLDivElement | null) => void;
}

/**
 * 判定「在列表顶部」的 scrollTop 上限（px）。
 * 过小会导致亚像素/回弹后 `scrollTop` 略大于 0 即永远无法 `touchstart` 武装，表现为「一点也拉不动」。
 */
const PULL_REFRESH_TOP_SLOP_PX = 8;

/** 未超过 `pullDistance`：提示继续下拉（与常见客户端文案一致） */
const DEFAULT_PULLING = "下拉即可刷新...";
/** 已超过 `pullDistance`：提示松手将调用 {@link PullRefreshProps.onRefresh} */
const DEFAULT_LOOSING = "释放即可刷新...";
/** 父级已将 `loading` 置为 true、正在请求数据 */
const DEFAULT_LOADING = "加载中...";

/**
 * 每个组件 Owner 对应一套**固定函数引用**的 ref 桥与触摸用 DOM 指针。
 * 勿用「每次组件体执行都调用的 `createMemo`」存桥：`@dreamer/view` 的 `createMemo` 每次调用都会新建 Memo，
 * 会得到新的 `bindScrollRootRef`，`ref` 回调变化会整节点重绑，`data-pull-refresh-content` 像被整块换掉。
 */
/** 由 {@link PullRefresh} 每轮渲染写入最新闭包，供滚动根上**直连**监听器转发 */
type PullRefreshGestureRef = {
  pointerDown?: (e: PointerEvent) => void;
  pointerMove?: (e: PointerEvent) => void;
  pointerUp?: (e: PointerEvent) => void;
  /** 触摸：须 `{ passive: false }` 的 `touchmove` 才能可靠 `preventDefault`，与 Pointer 分离避免双线重复累计位移 */
  touchStart?: (e: TouchEvent) => void;
  touchMove?: (e: TouchEvent) => void;
  touchEnd?: (e: TouchEvent) => void;
};

type PullRefreshDomBridge = {
  refs: {
    head: HTMLDivElement | null;
    /** 最外层 `pull-refresh` 壳：挂手势捕获，包住头+列表 */
    shellEl: HTMLDivElement | null;
    /** 内层 `overflow-y-auto` 列表区：读 `scrollTop`、`scrollContainerRef` 透出；手势在 {@link bindGestureShellRef} */
    scrollEl: HTMLDivElement | null;
    startY: number;
    startScrollTop: number;
    currentY: number;
    /** `setPointerCapture` 后仅处理该 id 的 `pointermove`/`pointerup`（不含触摸，触摸见 `activeTouchIdentifier`） */
    activePointerId: number | null;
    /** `touchstart` 记录的 `Touch.identifier`，与 Pointer 手势互斥 */
    activeTouchIdentifier: number | null;
  };
  /** `cb` 透传滚动根；其余字段可选，仅占位扩展 */
  st: {
    cb?: NonNullable<PullRefreshProps["scrollContainerRef"]>;
  };
  /** 当前帧手势实现（直连监听器只读此对象上的函数引用） */
  gestureRef: PullRefreshGestureRef;
  /** `shell` + `document` 上手势监听的摘除（换根 / 卸载须调用，避免泄漏） */
  detachGesture: (() => void) | null;
  /**
   * 当前下拉位移（px），驱动头部「下拉 / 释放」文案与进度条。
   * **必须挂在 Bridge 上**：`PullRefresh` 函数体在父级重绘时会反复执行，若在组件内 `createSignal(0)` 会每次新建源，
   * 原生 `touchmove` 仍写入旧 Signal，界面读新 Signal 恒为 0，表现为文案永远不切换。
   */
  pullDragPx: Signal<number>;
  /** 最外层壳 ref：挂/拆手势（须与 {@link bindScrollRootRef} 分离，避免 scroll ref 抖动误拆监听） */
  bindGestureShellRef: (el: unknown) => void;
  bindScrollRootRef: (el: unknown) => void;
  setHeadRef: (el: unknown) => void;
};

const pullRefreshDomBridgeByOwner = new WeakMap<Owner, PullRefreshDomBridge>();

/**
 * 是否为 Pointer Events 形态的事件对象。
 * SES/Lockdown 或 iframe 等跨 realm 场景下 `ev instanceof PointerEvent` 可能恒为 false；
 * 不要求 `pointerType`（部分环境对触摸合成的 Pointer 省略该字段）。
 *
 * @param ev - 任意 DOM Event
 * @returns 是否具备 pointerId / clientY
 */
function isPointerEventLike(ev: Event): ev is PointerEvent {
  return (
    typeof (ev as PointerEvent).pointerId === "number" && "clientY" in ev
  );
}

/**
 * 是否为 Touch Events 形态的事件对象；说明见 {@link isPointerEventLike}。
 *
 * @param ev - 任意 DOM Event
 * @returns 是否具备 touches / changedTouches
 */
function isTouchEventLike(ev: Event): ev is TouchEvent {
  return "touches" in ev && "changedTouches" in ev;
}

/**
 * 取得或创建当前 Owner 下唯一的 DOM 桥（含稳定 ref 回调）。
 *
 * @param owner - 当前 `PullRefresh` 实例所属 Owner
 */
function acquirePullRefreshDomBridge(owner: Owner): PullRefreshDomBridge {
  const existing = pullRefreshDomBridgeByOwner.get(owner);
  if (existing != null) {
    return existing;
  }

  const refs: PullRefreshDomBridge["refs"] = {
    head: null,
    shellEl: null,
    scrollEl: null,
    startY: 0,
    startScrollTop: 0,
    currentY: 0,
    activePointerId: null,
    activeTouchIdentifier: null,
  };
  const st: PullRefreshDomBridge["st"] = {};
  const gestureRef: PullRefreshGestureRef = {};
  const setHeadRef = (el: unknown) => {
    refs.head = el as HTMLDivElement | null;
  };

  /**
   * 包装器引用**恒定**，挂在 `scrollEl`（`data-pull-refresh-content`）上；内部转发到 `gestureRef`。
   * `pointermove` / `touchmove` 使用 `{ passive: false }` 以便在顶部下拉时 `preventDefault` 生效。
   */
  const forwardPointerDown = (e: Event) => {
    gestureRef.pointerDown?.(e as PointerEvent);
  };
  const forwardPointerMove = (e: Event) => {
    gestureRef.pointerMove?.(e as PointerEvent);
  };
  const forwardPointerUp = (e: Event) => {
    gestureRef.pointerUp?.(e as PointerEvent);
  };
  const forwardTouchStart = (e: Event) => {
    gestureRef.touchStart?.(e as TouchEvent);
  };
  const forwardTouchMove = (e: Event) => {
    gestureRef.touchMove?.(e as TouchEvent);
  };
  const forwardTouchEnd = (e: Event) => {
    gestureRef.touchEnd?.(e as TouchEvent);
  };

  /**
   * 判断事件路径是否经过当前滚动根（`composedPath` 可穿透 Shadow；无则回退 `contains`）。
   *
   * @param ev - 原生事件
   * @param scrollEl - `data-pull-refresh-content` 节点
   */
  const eventPathIncludesScroll = (
    ev: Event,
    scrollEl: HTMLDivElement,
  ): boolean => {
    const anyEv = ev as Event & { composedPath?: () => EventTarget[] };
    if (typeof anyEv.composedPath === "function") {
      try {
        const path = anyEv.composedPath();
        /** 部分阶段 `composedPath` 可能为空，须回退 `contains`，否则会误判为「未命中滚动子树」 */
        if (path.length > 0) {
          return path.includes(scrollEl);
        }
      } catch {
        /* composedPath 在个别环境不可用 */
      }
    }
    const t = ev.target;
    return t instanceof Node && scrollEl.contains(t);
  };

  /** 与 Owner 绑定、仅创建一次，供整段 `PullRefresh` 生命周期内读写 */
  const pullDragPx = runWithOwner(owner, () => createSignal(0)) as Signal<
    number
  >;

  const bridge: PullRefreshDomBridge = {
    refs,
    st,
    gestureRef,
    detachGesture: null,
    pullDragPx,
    bindGestureShellRef(el: unknown) {
      if (el == null) {
        /**
         * 与 `bindScrollRootRef` 相同：`ref(null)` 时节点仍 `isConnected` 则视为调度瞬态，勿拆监听。
         */
        const prevShell = refs.shellEl;
        if (prevShell != null && prevShell.isConnected) {
          return;
        }
        bridge.detachGesture?.();
        bridge.detachGesture = null;
        refs.shellEl = null;
        refs.activePointerId = null;
        refs.activeTouchIdentifier = null;
        return;
      }
      const nextShell = el as HTMLDivElement;
      /**
       * `pullDragPx()` 更新会触发子树重绘；若手势根与读 `pullDragPx()` 的 JSX 在同一 insert 域，整根 DOM 可能被替换，
       * `ref(el)` 对新节点再跑一遍 → 此处 `detachGesture` 摘掉监听 → `pointercancel`。根壳已拆到 {@link PullRefreshGestureShell}，此处多为保险。
       */
      if (refs.shellEl === nextShell && nextShell.isConnected) {
        return;
      }
      bridge.detachGesture?.();
      refs.shellEl = nextShell;
      const shell = refs.shellEl;
      const doc: Document | null = shell.ownerDocument ??
        (typeof globalThis.document !== "undefined"
          ? globalThis.document
          : null);

      const ptrMoveOpts: AddEventListenerOptions = {
        capture: true,
        passive: false,
      };
      const touchStartOpts: AddEventListenerOptions = {
        capture: true,
        passive: true,
      };
      const touchMoveOpts: AddEventListenerOptions = {
        capture: true,
        passive: false,
      };
      const touchEndOpts: AddEventListenerOptions = {
        capture: true,
        passive: true,
      };

      /**
       * 取列表滚动根：`scroll` ref 已到则用 ref；否则从壳内 `querySelector`（首帧 ref 顺序或换根时 healing）。
       *
       * @returns `data-pull-refresh-content` 节点或 `null`
       */
      const resolveScrollFromShell = (): HTMLDivElement | null => {
        const s = refs.scrollEl;
        if (s != null && s.isConnected) return s;
        const inner = shell.querySelector("[data-pull-refresh-content]");
        if (inner instanceof HTMLDivElement) {
          refs.scrollEl = inner;
          st.cb?.(inner);
          return inner;
        }
        return null;
      };

      /**
       * 触摸/指针是否从「列表滚动层」发起（头区折叠为 `pointer-events-none` 时事件会落在列表上）。
       *
       * @param ev - 原生事件
       */
      const hitContent = (ev: Event): boolean => {
        const t = ev.target;
        const s = resolveScrollFromShell();
        if (!(t instanceof Node) || s == null) return false;
        return s === t || s.contains(t);
      };

      const shellPointerDown = (ev: Event) => {
        const t = ev.target;
        const inShell = t instanceof Node && shell.contains(t);
        if (!shell.isConnected) return;
        if (!(t instanceof Node) || !inShell) return;
        if (!hitContent(ev)) {
          return;
        }
        const s = resolveScrollFromShell();
        if (!s || !isPointerEventLike(ev)) {
          return;
        }
        /** 已在 `hitContent` 判定触点于 `s` 内，不再用 `composedPath` 二次过滤（部分环境 path 与预期不一致会误杀）。 */
        forwardPointerDown(ev);
      };
      const shellPointerMove = (ev: Event) => {
        if (!shell.isConnected) return;
        const s = resolveScrollFromShell();
        if (!s || !isPointerEventLike(ev)) return;
        const tracking = refs.activePointerId != null &&
          refs.activePointerId === (ev as PointerEvent).pointerId;
        if (!tracking && !eventPathIncludesScroll(ev, s)) return;
        forwardPointerMove(ev);
      };
      const shellPointerUp = (ev: Event) => {
        const s = resolveScrollFromShell();
        if (!s || !isPointerEventLike(ev)) return;
        const tracking = refs.activePointerId != null &&
          refs.activePointerId === (ev as PointerEvent).pointerId;
        if (!tracking && !eventPathIncludesScroll(ev, s)) return;
        forwardPointerUp(ev);
      };
      const shellTouchStart = (ev: Event) => {
        const t = ev.target;
        const inShell = t instanceof Node && shell.contains(t);
        if (!shell.isConnected) return;
        if (!(t instanceof Node) || !inShell) return;
        if (!hitContent(ev)) {
          return;
        }
        const s = resolveScrollFromShell();
        if (!s || !isTouchEventLike(ev)) {
          return;
        }
        /** 同 {@link shellPointerDown}：避免 `composedPath` 误杀。 */
        forwardTouchStart(ev);
      };

      /**
       * `touchmove` 挂在 document：下拉时触点常滑到外层 `main`，仅在 shell 上监听会收不到 move，无法 `preventDefault`，表现为整页橡皮筋。
       *
       * @param ev - `touchmove`
       */
      const docTouchMove = (ev: Event) => {
        if (!isTouchEventLike(ev)) return;
        const s = resolveScrollFromShell();
        if (!s) return;
        const tid = refs.activeTouchIdentifier;
        const tracking = tid != null &&
          Array.from(ev.touches).some((touch) => touch.identifier === tid);
        if (!tracking && !eventPathIncludesScroll(ev, s)) return;
        forwardTouchMove(ev);
      };
      const docTouchEnd = (ev: Event) => {
        if (!isTouchEventLike(ev)) return;
        const s = resolveScrollFromShell();
        if (!s) return;
        const tid = refs.activeTouchIdentifier;
        const ourEnd = tid != null &&
          Array.from(ev.changedTouches).some((touch) =>
            touch.identifier === tid
          );
        if (ourEnd) {
          forwardTouchEnd(ev);
          return;
        }
        if (tid === null && eventPathIncludesScroll(ev, s)) {
          forwardTouchEnd(ev);
        }
      };

      /** `touchmove`/`touchend` 优先挂 `document`，无 document 时退回 `shell`（SSR 等） */
      let touchMoveEndHost: "doc" | "shell" = "shell";
      if (typeof shell.addEventListener === "function") {
        shell.addEventListener("pointerdown", shellPointerDown, true);
        shell.addEventListener("pointermove", shellPointerMove, ptrMoveOpts);
        shell.addEventListener("pointerup", shellPointerUp, true);
        shell.addEventListener("pointercancel", shellPointerUp, true);
        shell.addEventListener("lostpointercapture", shellPointerUp, true);
        shell.addEventListener("touchstart", shellTouchStart, touchStartOpts);
      }
      if (
        doc != null &&
        typeof doc.addEventListener === "function"
      ) {
        doc.addEventListener("touchmove", docTouchMove, touchMoveOpts);
        doc.addEventListener("touchend", docTouchEnd, touchEndOpts);
        doc.addEventListener("touchcancel", docTouchEnd, touchEndOpts);
        touchMoveEndHost = "doc";
      } else {
        shell.addEventListener("touchmove", docTouchMove, touchMoveOpts);
        shell.addEventListener("touchend", docTouchEnd, touchEndOpts);
        shell.addEventListener("touchcancel", docTouchEnd, touchEndOpts);
      }

      bridge.detachGesture = () => {
        if (typeof shell.removeEventListener === "function") {
          shell.removeEventListener("pointerdown", shellPointerDown, true);
          shell.removeEventListener(
            "pointermove",
            shellPointerMove,
            ptrMoveOpts,
          );
          shell.removeEventListener("pointerup", shellPointerUp, true);
          shell.removeEventListener("pointercancel", shellPointerUp, true);
          shell.removeEventListener("lostpointercapture", shellPointerUp, true);
          shell.removeEventListener(
            "touchstart",
            shellTouchStart,
            touchStartOpts,
          );
          if (touchMoveEndHost === "shell") {
            shell.removeEventListener("touchmove", docTouchMove, touchMoveOpts);
            shell.removeEventListener("touchend", docTouchEnd, touchEndOpts);
            shell.removeEventListener(
              "touchcancel",
              docTouchEnd,
              touchEndOpts,
            );
          }
        }
        if (
          touchMoveEndHost === "doc" &&
          doc != null &&
          typeof doc.removeEventListener === "function"
        ) {
          doc.removeEventListener("touchmove", docTouchMove, touchMoveOpts);
          doc.removeEventListener("touchend", docTouchEnd, touchEndOpts);
          doc.removeEventListener("touchcancel", docTouchEnd, touchEndOpts);
        }
      };
    },
    bindScrollRootRef(el: unknown) {
      if (el == null) {
        /**
         * `@dreamer/view` 在 effect 重跑等路径上可能先 `ref(null)` 再挂回同一 DOM；
         * 勿在此处 `detachGesture`：手势挂在 `shell` 上，拆 scroll ref 不应摘掉整壳监听。
         */
        const prevScroll = refs.scrollEl;
        if (prevScroll != null && prevScroll.isConnected) {
          return;
        }
        refs.activePointerId = null;
        refs.activeTouchIdentifier = null;
        refs.scrollEl = null;
        st.cb?.(null);
        return;
      }
      const nextScroll = el as HTMLDivElement;
      /** 同 `bindGestureShellRef`：避免重绘时对同一滚动层重复 `st.cb`。 */
      if (refs.scrollEl === nextScroll && nextScroll.isConnected) {
        return;
      }
      refs.scrollEl = nextScroll;
      const scroll = refs.scrollEl;
      st.cb?.(scroll);
    },
    setHeadRef,
  };
  pullRefreshDomBridgeByOwner.set(owner, bridge);
  onCleanup(() => {
    bridge.detachGesture?.();
    bridge.detachGesture = null;
    pullRefreshDomBridgeByOwner.delete(owner);
  });
  return bridge;
}

/**
 * 仅最外层「手势壳」：`ref` 与 class 在此固定，**绝不**读取 `pullDragPx` / `loading`。
 * 若与头区共用同一组件 JSX 读 `pullDragPx()`，`@dreamer/view` 会在信号更新时整段根树替换，
 * `bindGestureShellRef` 先 `null` 再挂新节点 → `detachGesture` → 浏览器 `pointercancel`，下拉整段作废。
 */
type PullRefreshGestureShellProps = {
  /** 与 {@link PullRefreshDomBridge.bindGestureShellRef} 一致 */
  bindGestureShellRef: (el: unknown) => void;
  /** 透传 {@link PullRefreshProps.class} */
  class?: string;
  children?: unknown;
};

/**
 * 渲染 `pull-refresh` 根节点（无业务信号订阅）。
 *
 * @param props - 壳层 props
 */
function PullRefreshGestureShell(
  props: PullRefreshGestureShellProps,
): JSXRenderable {
  return (
    <div
      ref={props.bindGestureShellRef}
      class={twMerge(
        /**
         * 外壳**不**承担纵向滚动；**ref 挂本层**在捕获阶段接 pointer/touch。
         */
        /** 与内层 `overscroll-y-none` 配合，减少顶部下拉时把滚动链交给外层 `main` */
        "pull-refresh relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden overscroll-y-contain",
        props.class,
      )}
    >
      {props.children}
    </div>
  );
}

/**
 * 列表滚动层：**不**读 `pullDragPx` / `isLoading`，避免与头区共用同一组件闭包时信号更新整段重绘、
 * `bindScrollRootRef` 重挂 → `pointercancel`。头区见 {@link PullRefreshPullHead}。
 */
type PullRefreshScrollPaneProps = {
  /** 与 {@link PullRefreshDomBridge.bindScrollRootRef} 一致 */
  bindScrollRootRef: (el: unknown) => void;
  children?: unknown;
};

/**
 * 唯一 `overflow-y-auto` 滚动根；无响应式读，DOM 在拖动过程中保持稳定。
 *
 * @param props - 滚动层 props
 */
function PullRefreshScrollPane(
  props: PullRefreshScrollPaneProps,
): JSXRenderable {
  return (
    <div
      ref={props.bindScrollRootRef}
      data-pull-refresh-content=""
      class="relative flex min-h-0 min-w-0 flex-1 touch-pan-y flex-col overflow-y-auto overflow-x-hidden overscroll-y-none [overflow-anchor:none]"
    >
      <div class="flex min-h-0 min-w-0 flex-col">{props.children}</div>
    </div>
  );
}

/** 头区展示：唯一读 `pullDragPx()` / `isLoading()` 的壳内子树 */
type PullRefreshPullHeadProps = {
  domBridge: PullRefreshDomBridge;
  /** {@link createMemo} 返回的加载态 getter */
  isLoading: () => boolean;
  headHeight: number;
  pullDistance: number;
  pullingText: string;
  loosingText: string;
  loadingText: string;
};

/**
 * 下拉刷新头（进度、文案）；与 {@link PullRefreshScrollPane} 分离以便 `pullDragPx` 更新不替换滚动层节点。
 *
 * @param props - 头区 props
 */
function PullRefreshPullHead(props: PullRefreshPullHeadProps): JSXRenderable {
  const {
    domBridge,
    isLoading,
    headHeight,
    pullDistance,
    pullingText,
    loosingText,
    loadingText,
  } = props;
  const pullDragPx = domBridge.pullDragPx;

  return (
    <div
      ref={domBridge.setHeadRef}
      data-pull-refresh-head=""
      class={twMerge(
        "relative z-10 flex flex-col items-center justify-center gap-1 transition-all duration-200 ease-out",
        isLoading() || pullDragPx() > 0
          ? "shrink-0 border-b border-slate-200/90 bg-slate-50/95 px-2 py-1 text-sm shadow-sm dark:border-slate-600/80 dark:bg-slate-900/90 opacity-100"
          : "pointer-events-none max-h-0 min-h-0 shrink-0 overflow-hidden border-0 bg-transparent p-0 opacity-0 shadow-none",
      )}
      style={isLoading() || pullDragPx() > 0
        ? { minHeight: `${headHeight}px` }
        : { minHeight: 0, maxHeight: 0 }}
    >
      <div class="flex min-h-0 w-full items-center justify-center gap-2">
        {isLoading() && (
          <span
            class="inline-block h-4 w-4 shrink-0 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin"
            aria-hidden="true"
          />
        )}
        <span
          data-pull-refresh-label=""
          class={twMerge(
            "truncate text-center font-medium transition-colors duration-150",
            !isLoading() && pullDragPx() > 0 && pullDragPx() >= pullDistance
              ? "text-teal-600 dark:text-teal-400"
              : "text-slate-500 dark:text-slate-400",
          )}
        >
          {isLoading()
            ? loadingText
            : pullDragPx() > 0 && pullDragPx() >= pullDistance
            ? loosingText
            : pullingText}
        </span>
      </div>
      <div
        data-pull-refresh-progress-track=""
        class={twMerge(
          "h-1 w-[6.5rem] max-w-[85%] shrink-0 overflow-hidden rounded-full bg-slate-200/90 dark:bg-slate-600/80",
          !isLoading() && pullDragPx() > 0
            ? "opacity-100"
            : "pointer-events-none h-0 opacity-0",
        )}
      >
        <div
          data-pull-refresh-progress-inner=""
          class="h-full rounded-full bg-teal-500 transition-[width] duration-75 ease-out dark:bg-teal-400"
          style={{
            width: `${
              Math.min(
                100,
                Math.round((pullDragPx() / pullDistance) * 100),
              )
            }%`,
          }}
        />
      </div>
    </div>
  );
}

/**
 * 中间栏：本函数**不**读 `pullDragPx()`，仅组合头区与滚动层，避免二者绑在同一跟踪域。
 */
type PullRefreshChromeProps = {
  domBridge: PullRefreshDomBridge;
  isLoading: () => boolean;
  headHeight: number;
  pullDistance: number;
  pullingText: string;
  loosingText: string;
  loadingText: string;
  children?: unknown;
};

/**
 * 头 + 列表纵向排布（头见 {@link PullRefreshPullHead}，列表见 {@link PullRefreshScrollPane}）。
 *
 * @param props - 中间栏 props
 */
function PullRefreshChrome(props: PullRefreshChromeProps): JSXRenderable {
  const {
    domBridge,
    isLoading,
    headHeight,
    pullDistance,
    pullingText,
    loosingText,
    loadingText,
    children,
  } = props;

  return (
    <div class="relative flex min-h-0 min-w-0 flex-1 flex-col">
      <PullRefreshPullHead
        domBridge={domBridge}
        isLoading={isLoading}
        headHeight={headHeight}
        pullDistance={pullDistance}
        pullingText={pullingText}
        loosingText={loosingText}
        loadingText={loadingText}
      />
      <PullRefreshScrollPane bindScrollRootRef={domBridge.bindScrollRootRef}>
        {children}
      </PullRefreshScrollPane>
    </div>
  );
}

export function PullRefresh(props: PullRefreshProps): JSXRenderable {
  const {
    onRefresh,
    pullingText = DEFAULT_PULLING,
    loosingText = DEFAULT_LOOSING,
    loadingText = DEFAULT_LOADING,
    successText: _successText = null,
    successDuration: _successDuration = 500,
    headHeight = 50,
    pullDistance: pullDistanceProp,
    disabled = false,
    children,
    class: className,
  } = props;

  const owner = getOwner();
  if (owner == null) {
    throw new Error("[PullRefresh] 须在 View Owner 下使用（getOwner() 为空）");
  }

  /** 在 memo 内读 `Signal` / getter，触摸与展示态与父级受控同步 */
  const isLoading = createMemo(() => readControlledOpenInput(props.loading));

  const pullDistance = pullDistanceProp ?? headHeight;

  const domBridge = acquirePullRefreshDomBridge(owner);
  domBridge.st.cb = props.scrollContainerRef;

  /** 与 {@link PullRefreshDomBridge.pullDragPx} 同址；勿在组件内再 `createSignal`，见 Bridge 类型注释 */
  const pullDragPx = domBridge.pullDragPx;

  /**
   * 读取当前纵向滚动位置（仅 `refs.scrollEl` 即 `data-pull-refresh-content` 内层列表区）。
   *
   * @returns `scrollTop` 像素值
   */
  const getScrollTop = (): number => {
    const el = domBridge.refs.scrollEl;
    if (!el) return 0;
    return el.scrollTop;
  };

  /**
   * 取头部指示条节点：`jsx` 运行时**先**调部分 `ref` **再** `insert` 子节点，故首帧可能尚未写入。
   * 头与滚动根为**兄弟**（头在滚动层外），回退时用滚动根 `previousElementSibling` 或父级 `querySelector`。
   *
   * @returns 头部 `div` 或 `null`
   */
  const pickHeadEl = (): HTMLDivElement | null => {
    const direct = domBridge.refs.head;
    if (direct) return direct;
    const scroll = domBridge.refs.scrollEl;
    if (!scroll) return null;
    const prev = scroll.previousElementSibling;
    if (
      prev instanceof HTMLElement && prev.matches("[data-pull-refresh-head]")
    ) {
      return prev as HTMLDivElement;
    }
    const fromParent = scroll.parentElement?.querySelector(
      "[data-pull-refresh-head]",
    ) as HTMLDivElement | null;
    if (fromParent) return fromParent;
    return scroll.querySelector("[data-pull-refresh-head]") as
      | HTMLDivElement
      | null;
  };

  /**
   * 在浏览器 `touch*` 回调里读 `loading`：须包 {@link untrack}。
   * 若此时仍挂着某次 `batch`/flush 遗留的 `currentObserver`，读 `Signal`/`memo` 会把依赖绑到**错误的**外层
   * `insert`（模板克隆整段根节点的那层）；`refreshLoading` 一变就整段 `_tmpl$()` 重跑、`replaceChild`，
   * DevTools 里父、子 div 一起闪，当前手势落在已卸下的节点上表现为拖不动。
   *
   * @returns 是否处于加载中（与 {@link isLoading} 语义一致，但不建立订阅）
   */
  const isLoadingNowUntracked = (): boolean =>
    untrack(() => readControlledOpenInput(props.loading));

  /**
   * 在原生 `pointermove` 路径里**直接写**头部文案与进度条，并强制展开头部行内样式（与 Tailwind `max-h-0` 竞态）。
   * 在 `pullDragPx(delta)` 后须 **`flushPendingSync()`** 再调用本函数（与 move 路径一致），否则 JSX 仍按旧值写回子节点。
   *
   * @param delta - 相对手势起点的向下位移（px）；`0` 表示复位为「下拉即可刷新」态
   */
  const syncPullHeadUi = (delta: number): void => {
    if (isLoadingNowUntracked()) {
      return;
    }
    const head = pickHeadEl();
    if (!head) {
      return;
    }
    /** 与 Tailwind `max-h-0` 竞态：拖动时用行内样式强制展开，否则文案写在 DOM 里仍被折叠区裁掉 */
    const expand = delta > 0;
    if (expand) {
      head.style.setProperty("max-height", `${headHeight}px`, "important");
      head.style.setProperty("min-height", `${headHeight}px`, "important");
      head.style.setProperty("opacity", "1", "important");
      head.style.setProperty("overflow", "hidden", "important");
      head.style.setProperty("pointer-events", "auto", "important");
    } else {
      head.style.removeProperty("max-height");
      head.style.removeProperty("min-height");
      head.style.removeProperty("opacity");
      head.style.removeProperty("overflow");
      head.style.removeProperty("pointer-events");
    }
    const lab = head.querySelector("[data-pull-refresh-label]");
    if (!(lab instanceof HTMLElement)) return;
    const armed = delta >= pullDistance;
    lab.textContent = armed ? loosingText : pullingText;
    lab.className = twMerge(
      "truncate text-center font-medium transition-colors duration-150",
      armed
        ? "text-teal-600 dark:text-teal-400"
        : "text-slate-500 dark:text-slate-400",
    );
    const track = head.querySelector("[data-pull-refresh-progress-track]");
    const inner = head.querySelector("[data-pull-refresh-progress-inner]");
    if (track instanceof HTMLElement && inner instanceof HTMLElement) {
      if (expand) {
        track.style.height = "4px";
        track.style.opacity = "1";
        inner.style.width = `${
          Math.min(
            100,
            Math.round((delta / pullDistance) * 100),
          )
        }%`;
      } else {
        track.style.height = "0";
        track.style.opacity = "0";
        inner.style.width = "0%";
      }
    }
  };

  /**
   * 清除列表滚动层上的下拉 `transform`（头区固定在壳顶，不因下拉做 `translateY`）。
   *
   * @returns `void`
   */
  const clearPullTransforms = (): void => {
    const sc = domBridge.refs.scrollEl;
    if (sc != null) sc.style.transform = "";
  };

  /**
   * 根据下拉距离更新**仅列表滚动层**的位移（阻尼与 {@link pullDistance} 一致）；头区文案/进度由 {@link syncPullHeadUi} 固定在顶部展开，不与列表整段下移。
   *
   * @param delta - 当前触点相对 `startY` 的向下位移（px）
   */
  const applyPullDisplacement = (delta: number): void => {
    const damp = delta > pullDistance
      ? pullDistance + (delta - pullDistance) * 0.3
      : delta;
    const sc = domBridge.refs.scrollEl;
    if (sc != null && sc.isConnected) {
      sc.style.transform = `translateY(${damp}px)`;
    }
  };

  /**
   * 结束拖动时复位下拉位移信号，并同步头部文案回「下拉即可刷新」态。
   *
   * @returns `void`
   */
  const resetPullDragPx = (): void => {
    clearPullTransforms();
    pullDragPx(0);
    flushPendingSync();
    syncPullHeadUi(0);
  };

  /**
   * 触摸或鼠标松手：复位头部并按阈值触发 `onRefresh`；无论是否触发刷新都会复位拖动距离信号。
   *
   * @param endClientY - 松开时的视口 Y（`touchend.changedTouches` 或 `mouseup.clientY`）
   */
  const finishPullGesture = (endClientY: number): void => {
    try {
      const head = pickHeadEl();
      if (disabled || isLoadingNowUntracked() || !head) return;
      const delta = endClientY - domBridge.refs.startY;
      clearPullTransforms();
      /** 允许亚像素抖动：仅当明显离开顶部时才禁止刷新 */
      const atTop = domBridge.refs.startScrollTop <= PULL_REFRESH_TOP_SLOP_PX;
      if (atTop && delta >= pullDistance && onRefresh) {
        onRefresh();
      }
    } finally {
      domBridge.refs.activePointerId = null;
      domBridge.refs.activeTouchIdentifier = null;
      resetPullDragPx();
      domBridge.refs.currentY = 0;
      domBridge.refs.startY = 0;
    }
  };

  /**
   * 指针按下：仅在列表**接近顶部**时接管（略放宽 `scrollTop`，避免亚像素导致永远不触发）。
   *
   * @param e - `pointerdown`
   */
  const handlePointerDown = (e: PointerEvent) => {
    if (disabled || isLoadingNowUntracked()) return;
    /** 触摸由 `touch*` + 非 passive `touchmove` 独占，避免与 Pointer 合成事件双计位移 */
    if (e.pointerType === "touch") return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.isPrimary === false) return;
    if (domBridge.refs.activePointerId !== null) return;
    if (domBridge.refs.activeTouchIdentifier !== null) return;
    const st = getScrollTop();
    if (st > PULL_REFRESH_TOP_SLOP_PX) {
      return;
    }
    domBridge.refs.startScrollTop = st;
    domBridge.refs.startY = e.clientY;
    domBridge.refs.currentY = e.clientY;
    domBridge.refs.activePointerId = e.pointerId;
    resetPullDragPx();
    /** `pointerdown` 在 shell 捕获上委托时 `currentTarget` 不是滚动根，必须用 `scrollEl` */
    const captureRoot = domBridge.refs.scrollEl;
    if (captureRoot != null) {
      try {
        captureRoot.setPointerCapture(e.pointerId);
      } catch {
        /* 部分环境禁止 capture 时忽略 */
      }
    }
  };

  /**
   * 指针移动：顶部下拉阻尼与文案切换。
   *
   * @param e - `pointermove`
   */
  const handlePointerMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    if (domBridge.refs.activePointerId !== e.pointerId) return;
    if (disabled || isLoadingNowUntracked()) return;
    const scrollTop = getScrollTop();
    if (scrollTop > PULL_REFRESH_TOP_SLOP_PX) {
      clearPullTransforms();
      resetPullDragPx();
      const releaseRoot = domBridge.refs.scrollEl;
      if (releaseRoot != null) {
        try {
          releaseRoot.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
      domBridge.refs.activePointerId = null;
      domBridge.refs.activeTouchIdentifier = null;
      return;
    }
    domBridge.refs.currentY = e.clientY;
    const delta = domBridge.refs.currentY - domBridge.refs.startY;
    /**
     * 仅在**明确向下拉**（delta>0）时 `preventDefault`（鼠标/笔）：`delta===0` 时拦截会把纵向 pan 锁死。
     * 触摸路径见 {@link handleTouchMove}，顶部可在首帧 `delta===0` 拦截以抢过合成滚动。
     */
    if (scrollTop <= PULL_REFRESH_TOP_SLOP_PX && delta > 0) {
      e.preventDefault();
    }
    if (delta <= 0) {
      clearPullTransforms();
      resetPullDragPx();
      return;
    }
    pullDragPx(delta);
    applyPullDisplacement(delta);
    /** 同步排空 View 队列，再 imperative 写头，避免与 `pullDragPx` 触发的 JSX 竞态 */
    flushPendingSync();
    syncPullHeadUi(domBridge.pullDragPx());
  };

  /**
   * 指针抬起 / 取消 / 丢失捕获：结束手势并判断是否刷新。
   *
   * @param e - `pointerup` | `pointercancel` | `lostpointercapture`
   */
  const handlePointerUp = (e: PointerEvent) => {
    if (e.pointerType === "touch") {
      /**
       * 触摸以 `touchend`/`touchcancel` 为主结束；但浏览器常在触摸结束前派发 **`pointercancel`**，
       * 原逻辑直接 `return` 导致从不 `resetPullDragPx`/`syncPullHeadUi(0)`，头区会卡在 imperative 写的「下拉即可刷新」展开态。
       * `pointercancel`/`lostpointercapture` 时若仍武装触摸 id，按**手势被系统终止**清理（不触发 `onRefresh`）。
       * 正常松手仍以 `touchend` → {@link handleTouchEnd} 为准；若已清理则此处 `activeTouchIdentifier` 已为 null。
       */
      if (
        (e.type === "pointercancel" || e.type === "lostpointercapture") &&
        domBridge.refs.activeTouchIdentifier !== null
      ) {
        clearPullTransforms();
        resetPullDragPx();
        domBridge.refs.activeTouchIdentifier = null;
      }
      return;
    }
    if (domBridge.refs.activePointerId === null) return;
    if (e.pointerId !== domBridge.refs.activePointerId) return;
    const endY = e.clientY;
    domBridge.refs.activePointerId = null;
    const releaseRootUp = domBridge.refs.scrollEl;
    if (releaseRootUp != null) {
      try {
        releaseRootUp.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    finishPullGesture(endY);
  };

  /**
   * 触摸开始：与 {@link handlePointerDown} 语义一致；列表近顶时用 **touches[0]** 作为跟手点（Mac 上可能同时存在多个触点）。
   * 不在此 `preventDefault`，避免影响轻点/滚动起手的点击判定。
   *
   * @param e - `touchstart`（`passive: true`）
   */
  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || isLoadingNowUntracked()) return;
    if (domBridge.refs.activeTouchIdentifier !== null) return;
    if (domBridge.refs.activePointerId !== null) return;
    if (e.touches.length < 1) return;
    const st = getScrollTop();
    if (st > PULL_REFRESH_TOP_SLOP_PX) {
      return;
    }
    const touch = e.touches[0];
    if (touch == null) return;
    domBridge.refs.startScrollTop = st;
    domBridge.refs.startY = touch.clientY;
    domBridge.refs.currentY = touch.clientY;
    domBridge.refs.activeTouchIdentifier = touch.identifier;
    resetPullDragPx();
  };

  /**
   * 触摸移动：在列表近顶且 `delta>=0` 时 `preventDefault`（含首帧 `delta===0`），从 overscroll/外层滚动链抢纵向手势。
   * **以 `activeTouchIdentifier` 匹配触点**；与 {@link handlePointerMove} 的鼠标路径分离（触摸不走 Pointer 累计）。
   *
   * @param e - `touchmove`（`passive: false`）
   */
  const handleTouchMove = (e: TouchEvent) => {
    if (domBridge.refs.activeTouchIdentifier === null) return;
    if (disabled || isLoadingNowUntracked()) return;
    let touch: Touch | undefined = Array.from(e.touches).find((t) =>
      t.identifier === domBridge.refs.activeTouchIdentifier
    );
    /**
     * 个别 WebKit 上 `identifier` 与 `touches[0]` 偶发不一致；仅剩单点时回退并校正 id。
     */
    if (touch == null && e.touches.length === 1) {
      const sole = e.touches[0];
      if (sole != null) {
        touch = sole;
        domBridge.refs.activeTouchIdentifier = sole.identifier;
      }
    }
    if (touch == null) {
      clearPullTransforms();
      resetPullDragPx();
      domBridge.refs.activeTouchIdentifier = null;
      return;
    }
    const scrollTop = getScrollTop();
    if (scrollTop > PULL_REFRESH_TOP_SLOP_PX) {
      clearPullTransforms();
      resetPullDragPx();
      domBridge.refs.activeTouchIdentifier = null;
      return;
    }
    domBridge.refs.currentY = touch.clientY;
    const delta = domBridge.refs.currentY - domBridge.refs.startY;
    /**
     * 顶部下拉：`delta>=0` 即拦截（含首帧 `delta===0`），减轻 Chrome 桌面触控板与外层 `main` 纵向滚动抢首帧后 `pointercancel`。
     * `delta<0` 为手指上移，不拦截，便于正常向下浏览列表。
     */
    if (scrollTop <= PULL_REFRESH_TOP_SLOP_PX && delta >= 0) {
      e.preventDefault();
    }
    if (delta <= 0) {
      clearPullTransforms();
      resetPullDragPx();
      return;
    }
    pullDragPx(delta);
    applyPullDisplacement(delta);
    flushPendingSync();
    syncPullHeadUi(domBridge.pullDragPx());
  };

  /**
   * 触摸结束/取消：与 {@link handlePointerUp} 一致，按终点 Y 结束手势。
   *
   * @param e - `touchend` | `touchcancel`
   */
  const handleTouchEnd = (e: TouchEvent) => {
    if (domBridge.refs.activeTouchIdentifier === null) return;
    const ended = Array.from(e.changedTouches).find((t) =>
      t.identifier === domBridge.refs.activeTouchIdentifier
    );
    if (ended == null) {
      clearPullTransforms();
      resetPullDragPx();
      domBridge.refs.activeTouchIdentifier = null;
      return;
    }
    const endY = ended.clientY;
    finishPullGesture(endY);
  };

  /**
   * 将本轮渲染的手势闭包挂到桥接对象，供滚动根上**直连**监听器转发（须在 `return` 前执行，以便 `ref` 触发时已有实现）。
   */
  domBridge.gestureRef.pointerDown = handlePointerDown;
  domBridge.gestureRef.pointerMove = handlePointerMove;
  domBridge.gestureRef.pointerUp = handlePointerUp;
  domBridge.gestureRef.touchStart = handleTouchStart;
  domBridge.gestureRef.touchMove = handleTouchMove;
  domBridge.gestureRef.touchEnd = handleTouchEnd;

  /**
   * `isLoading` 仅传入 {@link PullRefreshChrome}；本函数 return **不**再读 `pullDragPx()` / `isLoading()`，
   * 与 {@link PullRefreshGestureShell} 分离后，`pullDragPx` 更新不会替换带 `bindGestureShellRef` 的根节点。
   */

  return (
    <PullRefreshGestureShell
      bindGestureShellRef={domBridge.bindGestureShellRef}
      class={className}
    >
      <PullRefreshChrome
        domBridge={domBridge}
        isLoading={isLoading}
        headHeight={headHeight}
        pullDistance={pullDistance}
        pullingText={pullingText}
        loosingText={loosingText}
        loadingText={loadingText}
      >
        {children}
      </PullRefreshChrome>
    </PullRefreshGestureShell>
  );
}
