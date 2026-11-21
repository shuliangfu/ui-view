/**
 * Dropdown 下拉菜单（View）。
 * 桌面点击/悬停展开。`bottom*` 始终向下；`top*` 向上；`bottomAuto` 只在下方做左右翻转；`auto` 按视口空间在上/下及左/中/右间选择。
 * Esc 关闭（需 initDropdownEsc）、hover 延迟防抖。展开默认内部维护；也可传受控 `open` + `onOpenChange`（点菜单项关菜单等场景）。
 * 浮层容器使用 **`p-1`**（四边等距）；展开时经 {@link Portal} 挂到 `document.body`，`fixed` 按视口定位，避免祖先 `overflow` 裁剪。
 */

import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  Portal,
  Show,
} from "@dreamer/view";
import type { JSXRenderable } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import {
  type ControlledOpenInput,
  readControlledOpenInput,
} from "../../shared/feedback/controlled-open.ts";
import { computeArrowAnchorStyle } from "../../shared/feedback/popFixedStyle.ts";

export type DropdownPlacement =
  | "bottom"
  | "bottomLeft"
  | "bottomRight"
  | "bottomAuto"
  | "top"
  | "topLeft"
  | "topRight"
  | "auto";

export interface DropdownProps {
  /** 触发元素（子节点） */
  children?: unknown;
  /** 下拉内容（菜单或自定义节点） */
  overlay: unknown;
  /**
   * 受控展开。不传则内部维护。
   * 传 `createSignal` 返回值、`() => boolean` 或 boolean（与 Modal 一致；勿传 `sig.value` 快照）。
   */
  open?: ControlledOpenInput;
  /** 打开/关闭时回调；受控时须在此写回 `open` 对应 signal */
  onOpenChange?: (open: boolean) => void;
  /** 触发方式：click 或 hover，默认 "click" */
  trigger?: "click" | "hover";
  /** hover 时展开延迟（ms），默认 150 */
  hoverOpenDelay?: number;
  /** hover 时收起延迟（ms），默认 100 */
  hoverCloseDelay?: number;
  /**
   * 下拉位置：默认 `bottom`（居中向下）；
   * `bottomAuto` 只在下方根据左右空间切换；
   * `auto` 按视口上下与左右空间选择。
   */
  placement?: DropdownPlacement;
  /** 是否禁用，默认 false */
  disabled?: boolean;
  /** 额外 class（包装器） */
  class?: string;
  /** 下拉层 class */
  overlayClass?: string;
  /** 下拉层 id（无障碍：aria-describedby 等，可选） */
  overlayId?: string;
  /**
   * 为 true 时在浮层靠向触发器的一侧绘制小尖角，尖角对准按钮中线
   * （下拉在按钮正下方，上拉在按钮正上方）。默认 false。
   */
  arrow?: boolean;
  /**
   * `trigger="click"` 时，点击浮层**内部**是否关闭。默认 true（点菜单项即关）。
   * 列设置等多选面板应设为 false：否则 click 冒泡先卸载浮层，checkbox 的 change 来不及触发。
   */
  closeOnOverlayClick?: boolean;
}

/** 用于 Esc 关闭时注册当前打开的下拉关闭回调（每帧仅一个） */
const DROPDOWN_ESC_KEY = "__lastDropdownClose" as const;

/** 在客户端调用一次，监听 Esc 关闭当前已打开的下拉 */
export function initDropdownEsc(): (() => void) | undefined {
  if (typeof globalThis.document === "undefined") return;
  const g = globalThis as unknown as Record<string, (() => void) | undefined>;
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    const close = g[DROPDOWN_ESC_KEY];
    if (close) {
      // 一次 Esc 只关闭最上层下拉，不能继续冒泡把承载它的 Modal 一并取消。
      e.preventDefault();
      e.stopImmediatePropagation();
      close();
      delete g[DROPDOWN_ESC_KEY];
    }
  };
  globalThis.document.addEventListener("keydown", onKeyDown, true);
  return () =>
    globalThis.document.removeEventListener("keydown", onKeyDown, true);
}

/** 与 Tailwind `mt-1`/`mb-1` 默认间距一致（px） */
const GAP_Y_COMPACT_PX = 4;
/** 与 Tailwind `mt-2`/`mb-2` 默认间距一致（px），用于带箭头时间隙 */
const GAP_Y_ARROW_PX = 8;

/** 未测得面板几何时，箭头距对齐边的回退 inset（px）；实测后对准按钮中线 */
const ARROW_INSET_PX = 12;

/**
 * Portal **只改变挂载节点**（通常是 `document.body`），不会自动跑到「浏览器最顶层」。
 * 和谁压谁仍然由 **层叠上下文 + z-index** 决定；若浮层未设有效 z-index，会输给带 `z-50` 的 `sticky` 顶栏。
 * 此处用**内联** z-index：宿主 Tailwind 若未扫描本包源码，`class="z-*"` 可能不进 CSS；数值取高以盖过常见顶栏与若干全局浮层。
 */
const DROPDOWN_OVERLAY_ROOT_Z_INDEX = "99999";

/**
 * 触发器与浮层竖向间距（px），语义同原 `overlayEdgeGapClass`。
 */
function gapYPixels(
  arrowEnabled: boolean,
  _eff: ResolvedPopPlacement,
): number {
  return arrowEnabled ? GAP_Y_ARROW_PX : GAP_Y_COMPACT_PX;
}

/**
 * 浮层挂到 `body` 且 `position:fixed` 时的样式（视口像素），与原先 `absolute` + placement 类语义一致。
 *
 * @param triggerRect 触发器外框矩形（视口坐标）
 * @param eff 解析后的 placement
 * @param arrowEnabled 是否带箭头（影响竖向间隙）
 */
export function computeDropdownFixedStyle(
  triggerRect: DOMRect,
  eff: ResolvedPopPlacement,
  arrowEnabled: boolean,
): Record<string, string> {
  const gap = gapYPixels(arrowEnabled, eff);
  const w = globalThis.window;
  const iw = w.innerWidth;
  const tr = triggerRect;

  /**
   * 每次**写全**可参与 `fixed` 定位的轴，未用轴为 `auto`、`transform: none`。
   * 仅写 `right`+`top` 时，若上一条还留着 `left`+`transform`（例如从正下方居中 rAF 更新到右对齐），
   * 会残留为「下左+居中变换」的视觉效果。
   */
  const C = {
    left: "auto",
    right: "auto",
    top: "auto",
    bottom: "auto",
    transform: "none",
  } as const;

  switch (eff) {
    case "bottom":
      return {
        ...C,
        top: `${tr.bottom + gap}px`,
        left: `${tr.left + tr.width / 2}px`,
        right: "auto",
        transform: "translateX(-50%)",
      };
    case "bottomLeft":
      /** 浮层左缘贴触发器左缘；带箭头时尖角在面板顶边左侧，不改变展开方向。 */
      return {
        ...C,
        top: `${tr.bottom + gap}px`,
        left: `${tr.left}px`,
        right: "auto",
        transform: "none",
      };
    case "bottomRight":
      /** 浮层右缘贴触发器右缘；带箭头时尖角在面板顶边右侧，不改变展开方向。 */
      return {
        ...C,
        top: `${tr.bottom + gap}px`,
        right: `${iw - tr.right}px`,
        left: "auto",
        bottom: "auto",
        transform: "none",
      };
    case "top":
      return {
        ...C,
        top: "auto",
        bottom: `${w.innerHeight - tr.top + gap}px`,
        left: `${tr.left + tr.width / 2}px`,
        transform: "translateX(-50%)",
      };
    case "topLeft":
      return {
        ...C,
        top: "auto",
        bottom: `${w.innerHeight - tr.top + gap}px`,
        left: `${tr.left}px`,
        transform: "none",
      };
    case "topRight":
      return {
        ...C,
        top: "auto",
        bottom: `${w.innerHeight - tr.top + gap}px`,
        right: `${iw - tr.right}px`,
        left: "auto",
        transform: "none",
      };
    default:
      return { ...C };
  }
}

type ResolvedPopPlacement =
  | "bottom"
  | "bottomLeft"
  | "bottomRight"
  | "top"
  | "topLeft"
  | "topRight";

/**
 * 解析后用于箭头定位的 placement：bottomAuto 时使用 {@link autoPlacement}。
 */
function resolvePlacement(
  isAuto: boolean,
  auto: ResolvedPopPlacement,
  placement: DropdownPlacement,
): ResolvedPopPlacement {
  if (isAuto) {
    return auto;
  }
  if (placement === "bottomAuto" || placement === "auto") {
    return "bottom";
  }
  return placement;
}

/**
 * 由触发器、placement 与已测得的面板尺寸推算面板视口矩形。
 * 只信任尺寸、不信任尚未刷新的 `left/top`，避免把箭头写到首帧未定位坐标上。
 */
export function panelBoxFromTrigger(
  triggerRect: Pick<
    DOMRect,
    "left" | "top" | "width" | "height" | "right" | "bottom"
  >,
  eff: ResolvedPopPlacement,
  size: Pick<DOMRect, "width" | "height">,
  arrowEnabled: boolean,
): Pick<DOMRect, "left" | "top" | "width" | "height"> {
  const gap = gapYPixels(arrowEnabled, eff);
  const w = size.width;
  const h = size.height;
  const tr = triggerRect;
  switch (eff) {
    case "bottom":
      return {
        left: tr.left + tr.width / 2 - w / 2,
        top: tr.bottom + gap,
        width: w,
        height: h,
      };
    case "bottomLeft":
      return { left: tr.left, top: tr.bottom + gap, width: w, height: h };
    case "bottomRight":
      return { left: tr.right - w, top: tr.bottom + gap, width: w, height: h };
    case "top":
      return {
        left: tr.left + tr.width / 2 - w / 2,
        top: tr.top - gap - h,
        width: w,
        height: h,
      };
    case "topLeft":
      return { left: tr.left, top: tr.top - gap - h, width: w, height: h };
    case "topRight":
      return { left: tr.right - w, top: tr.top - gap - h, width: w, height: h };
    default:
      return { left: tr.left, top: tr.bottom + gap, width: w, height: h };
  }
}

/**
 * 菱形箭头：`rotate(45deg)` 与位移写在**同一条** `transform`，避免多段 Tailwind transform 互相覆盖。
 * bottom 系列箭头在面板顶边，top 系列在底边。
 * 传入触发器与面板矩形时，水平对准按钮中线；未传入时 Left/Right 退回距对齐边 {@link ARROW_INSET_PX}，居中方位仍为 50%。
 *
 * @param eff - 解析后的 placement
 * @param trigger - 触发器视口矩形；与 `panel` 同时传入时对准其中线
 * @param panel - 面板视口矩形
 */
export function getDropdownArrowProps(
  eff: ResolvedPopPlacement,
  trigger?: Pick<DOMRect, "left" | "top" | "width" | "height">,
  panel?: Pick<DOMRect, "left" | "top" | "width" | "height">,
): { className: string; style: Record<string, string> } {
  if (trigger && panel) {
    const shell =
      "absolute w-2 h-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800";
    const cut = (eff === "top" || eff === "topLeft" || eff === "topRight")
      ? twMerge(shell, "border-t-0 border-l-0")
      : twMerge(shell, "border-b-0 border-r-0");
    return {
      className: cut,
      style: computeArrowAnchorStyle(eff, trigger, panel),
    };
  }
  const shell =
    "absolute w-2 h-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800";

  const cut = twMerge(shell, "border-b-0 border-r-0");
  let style: Record<string, string>;
  switch (eff) {
    case "bottom":
      style = {
        top: "0",
        left: "50%",
        transform: "translate(-50%, -50%) rotate(45deg)",
      };
      break;
    case "bottomLeft":
      /** 尖角在面板顶边**左侧**，与左对齐的展开方向一致 */
      style = {
        top: "0",
        left: `${ARROW_INSET_PX}px`,
        right: "auto",
        transform: "translate(-50%, -50%) rotate(45deg)",
      };
      break;
    case "bottomRight":
      /** 尖角在面板顶边**右侧**，与右对齐的展开方向一致 */
      style = {
        top: "0",
        left: "auto",
        right: `${ARROW_INSET_PX}px`,
        transform: "translate(50%, -50%) rotate(45deg)",
      };
      break;
    case "top":
      style = {
        top: "auto",
        bottom: "0",
        left: "50%",
        transform: "translate(-50%, 50%) rotate(45deg)",
      };
      return { className: twMerge(shell, "border-t-0 border-l-0"), style };
    case "topLeft":
      style = {
        top: "auto",
        bottom: "0",
        left: `${ARROW_INSET_PX}px`,
        right: "auto",
        transform: "translate(-50%, 50%) rotate(45deg)",
      };
      return { className: twMerge(shell, "border-t-0 border-l-0"), style };
    case "topRight":
      style = {
        top: "auto",
        bottom: "0",
        left: "auto",
        right: `${ARROW_INSET_PX}px`,
        transform: "translate(50%, 50%) rotate(45deg)",
      };
      return { className: twMerge(shell, "border-t-0 border-l-0"), style };
    default:
      style = {
        top: "0",
        left: "50%",
        transform: "translate(-50%, -50%) rotate(45deg)",
      };
  }
  return { className: cut, style };
}

/** hover 时用的定时器（闭包共享，避免闪动） */
const hoverTimers: {
  open: ReturnType<typeof globalThis.setTimeout> | 0;
  close: ReturnType<typeof globalThis.setTimeout> | 0;
} = { open: 0, close: 0 };

export function Dropdown(props: DropdownProps): JSXRenderable {
  const {
    children,
    overlay,
    onOpenChange,
    trigger = "click",
    hoverOpenDelay = 150,
    hoverCloseDelay = 100,
    placement = "bottom",
    disabled = false,
    class: className,
    overlayClass,
    overlayId,
    arrow = false,
    closeOnOverlayClick = true,
  } = props;

  /** 非受控时的内部展开状态 */
  const openState = createSignal(false);
  const isControlled = () => props.open !== undefined;
  /** 当前是否展开（受控读 `props.open`，否则读内部 signal） */
  const isOpen = createMemo(() =>
    isControlled() ? readControlledOpenInput(props.open) : openState.value
  );
  /** `bottomAuto` / `auto` 时根据视口空间计算出的实际位置 */
  const autoPlacement = createSignal<ResolvedPopPlacement>("bottom");

  /** Portal + `fixed` 浮层的内联样式（视口坐标），展开时由 {@link computeDropdownFixedStyle} 写入 */
  const portalFixedStyle = createSignal<Record<string, string>>({});
  /** 箭头对准触发器中线的内联样式，展开且 `arrow` 时由 {@link computeArrowAnchorStyle} 写入 */
  const arrowStyle = createSignal<Record<string, string>>({});

  /** 写展开态：非受控改内部 signal；始终通知 onOpenChange（受控方须写回） */
  const setOpen = (value: boolean) => {
    if (!isControlled()) openState.value = value;
    onOpenChange?.(value);
  };

  // Show 的 children 会先构造；只能在实际展开时注册，避免后面的关闭菜单抢占 Esc。
  const closeForEsc = () => setOpen(false);
  const clearEsc = () => {
    const g = globalThis as unknown as Record<string, (() => void) | undefined>;
    if (g[DROPDOWN_ESC_KEY] === closeForEsc) delete g[DROPDOWN_ESC_KEY];
  };
  createEffect(() => {
    if (!isOpen() || typeof globalThis.document === "undefined") {
      clearEsc();
      return;
    }
    const g = globalThis as unknown as Record<string, (() => void) | undefined>;
    g[DROPDOWN_ESC_KEY] = closeForEsc;
    return clearEsc;
  });
  onCleanup(clearEsc);

  const isHover = trigger === "hover";
  const isAuto = placement === "bottomAuto" || placement === "auto";

  /** 用于 bottomAuto：测量触发元素与 overlay 后决定左/中/右 */
  let triggerEl: HTMLElement | null = null;
  let overlayEl: HTMLElement | null = null;
  const measureAndSetAuto = () => {
    if (
      typeof globalThis.document === "undefined" || !triggerEl || !overlayEl
    ) {
      return;
    }
    const triggerRect = triggerEl.getBoundingClientRect();
    const overlayRect = overlayEl.getBoundingClientRect();
    const vw = globalThis.document.documentElement.clientWidth;
    const halfW = overlayRect.width / 2;
    const centerX = triggerRect.left + triggerRect.width / 2;
    const spaceLeft = centerX;
    const spaceRight = vw - centerX;
    let horizontal: "Left" | "Right" | "" = "";
    if (spaceLeft < halfW && spaceRight >= halfW) {
      horizontal = "Left";
    } else if (spaceRight < halfW && spaceLeft >= halfW) {
      horizontal = "Right";
    }
    if (placement === "auto") {
      const vh = globalThis.document.documentElement.clientHeight;
      const spaceBelow = vh - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const goTop = spaceBelow <
          overlayRect.height + gapYPixels(arrow, autoPlacement.value) &&
        spaceAbove > spaceBelow;
      autoPlacement.value =
        ((goTop ? "top" : "bottom") + horizontal) as ResolvedPopPlacement;
      return;
    }
    autoPlacement.value = ("bottom" + horizontal) as ResolvedPopPlacement;
  };
  const scheduleMeasure = () => {
    if (typeof globalThis.requestAnimationFrame === "undefined") return;
    globalThis.requestAnimationFrame(() => {
      measureAndSetAuto();
    });
  };

  /**
   * 同步对齐浮层与箭头。箭头样式优先用触发器+面板尺寸推算中线；
   * 面板尚未挂载或尺寸为 0 时先写入 placement 回退，避免首帧出现在 (0,0)。
   */
  const alignOverlay = () => {
    if (!triggerEl || typeof globalThis.window === "undefined") return;
    if (isAuto) measureAndSetAuto();
    const tr = triggerEl.getBoundingClientRect();
    const eff = resolvePlacement(
      isAuto,
      autoPlacement.value,
      placement,
    );
    portalFixedStyle.value = computeDropdownFixedStyle(tr, eff, arrow);
    if (!arrow) return;
    const panelEl = overlayEl?.querySelector("[role='menu']") as
      | HTMLElement
      | null;
    const measured = panelEl ?? overlayEl;
    if (!measured) {
      arrowStyle.value = getDropdownArrowProps(eff).style;
      return;
    }
    const raw = measured.getBoundingClientRect();
    if (!(raw.width > 0) || !(raw.height > 0)) {
      arrowStyle.value = getDropdownArrowProps(eff).style;
      return;
    }
    arrowStyle.value = computeArrowAnchorStyle(
      eff,
      tr,
      panelBoxFromTrigger(tr, eff, raw, arrow),
    );
  };

  /**
   * 展开后把 Portal 浮层 `fixed` 与触发器对齐。
   * 仅依赖 `scroll` 时，部分浏览器与合成顺序会导致晚一帧才更新，**滚动跟手**感差。
   * 故在**展开期**用 `requestAnimationFrame` 自循环，每帧读 `getBoundingClientRect` 与绘制同频（约 60Hz），
   * 对任意 `div` 滚动/窗口变化/动效下触发器移动都能跟上；`bottomAuto` 在第二帧再量浮层宽。
   */
  createEffect(() => {
    if (!isOpen() || typeof globalThis.window === "undefined") {
      portalFixedStyle.value = {};
      arrowStyle.value = {};
      return;
    }
    const effResolved = resolvePlacement(
      isAuto,
      autoPlacement.value,
      placement,
    );
    void effResolved;
    if (isAuto) {
      void autoPlacement.value;
    }

    if (arrow) {
      const seed = resolvePlacement(
        isAuto,
        autoPlacement.value,
        placement,
      );
      arrowStyle.value = getDropdownArrowProps(seed).style;
    }
    alignOverlay();

    let frameIndex = 0;
    let rafLoop = 0;
    let running = true;
    const keepAligned = () => {
      if (!running) return;
      alignOverlay();
      if (frameIndex === 1 && isAuto && overlayEl) {
        scheduleMeasure();
      }
      frameIndex += 1;
      rafLoop = globalThis.requestAnimationFrame(keepAligned);
    };
    rafLoop = globalThis.requestAnimationFrame(keepAligned);

    /**
     * 窗口/视口尺寸与 visualViewport 变化不保证落在两次 rAF 间，用事件**补一帧**避免偶发一帧空档。
     */
    const onResize = () => alignOverlay();
    globalThis.window.addEventListener("resize", onResize);
    const vv = globalThis.visualViewport;
    if (vv) {
      vv.addEventListener("resize", onResize);
    }

    return () => {
      running = false;
      globalThis.cancelAnimationFrame(rafLoop);
      globalThis.window.removeEventListener("resize", onResize);
      if (vv) {
        vv.removeEventListener("resize", onResize);
      }
    };
  });

  /** click 模式下用 document 点击外部关闭；冒泡阶段且延迟关闭，避免拦截链接点击与路由导航、避免同步 setState 导致主内容区渲染异常 */
  let removeClickOutside: (() => void) | null = null;
  const dropClickOutside = () => {
    removeClickOutside?.();
    removeClickOutside = null;
  };
  createEffect(() => {
    if (typeof globalThis.document === "undefined" || isHover) {
      return;
    }
    if (!isOpen()) {
      dropClickOutside();
      return;
    }
    const id = globalThis.setTimeout(() => {
      const onDocClick = (e: MouseEvent) => {
        // 触发器已随全屏等重挂脱离 DOM 时，不可再写回受控 open（会立刻关掉新实例）
        if (triggerEl && !triggerEl.isConnected) {
          dropClickOutside();
          return;
        }
        // 浮层内点击若同步重绘卸掉目标节点，e.target 会脱离 DOM，
        // contains(target)===false 会被误判为“外部点击”。用 composedPath 认路径。
        const path = typeof e.composedPath === "function"
          ? e.composedPath()
          : [];
        if (
          (triggerEl && path.includes(triggerEl)) ||
          (overlayEl && path.includes(overlayEl))
        ) {
          return;
        }
        const target = e.target as Node | null;
        if (target && !target.isConnected) return;
        if (
          target &&
          triggerEl?.contains(target) === false &&
          overlayEl?.contains(target) === false
        ) {
          globalThis.setTimeout(() => setOpen(false), 0);
        }
      };
      globalThis.document.addEventListener("click", onDocClick, false);
      removeClickOutside = () => {
        globalThis.document.removeEventListener("click", onDocClick, false);
      };
    }, 0);
    return () => {
      globalThis.clearTimeout(id);
      dropClickOutside();
    };
  });

  const handleTriggerClick = (e: Event) => {
    e.preventDefault();
    if (disabled) return;
    if (!isHover) setOpen(!isOpen());
  };

  const handleTriggerEnter = () => {
    if (disabled) return;
    if (!isHover) return;
    if (hoverTimers.close) {
      clearTimeout(hoverTimers.close);
      hoverTimers.close = 0;
    }
    hoverTimers.open = setTimeout(() => setOpen(true), hoverOpenDelay);
  };

  const handleTriggerLeave = () => {
    if (!isHover) return;
    if (hoverTimers.open) {
      clearTimeout(hoverTimers.open);
      hoverTimers.open = 0;
    }
    hoverTimers.close = setTimeout(() => setOpen(false), hoverCloseDelay);
  };

  const handleOverlayEnter = () => {
    if (hoverTimers.close) {
      clearTimeout(hoverTimers.close);
      hoverTimers.close = 0;
    }
  };

  const handleOverlayLeave = () => {
    if (isHover) {
      hoverTimers.close = setTimeout(() => setOpen(false), hoverCloseDelay);
    }
  };

  return (
    <span
      class={twMerge("relative inline-flex", className)}
      data-dreamer-dropdown=""
      onMouseEnter={isHover
        ? (handleTriggerEnter as (e: Event) => void)
        : undefined}
      onMouseLeave={isHover
        ? (handleTriggerLeave as (e: Event) => void)
        : undefined}
    >
      {/* ref 挂在真实按钮上：`getBoundingClientRect` 与「下右」右缘对齐一致，避免外层容器多出空隙 */}
      <span
        ref={(el: HTMLElement) => {
          triggerEl = el;
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="true"
        aria-expanded={() => isOpen()}
        aria-disabled={disabled}
        onClick={!isHover
          ? (handleTriggerClick as (e: Event) => void)
          : undefined}
        onKeyDown={!isHover && !disabled
          ? ((e: Event) => {
            const k = (e as KeyboardEvent).key;
            if (k === "Enter" || k === " ") {
              e.preventDefault();
              setOpen(!isOpen());
            }
          }) as (e: Event) => void
          : undefined}
        class={disabled
          ? "pointer-events-none opacity-50"
          /** `inline-flex` + `max-w-fit`：触发器外框紧贴子内容，避免 flex 父级下虚宽导致 `getBoundingClientRect` 偏左、Portal 居中错位 */
          : "cursor-pointer inline-flex max-w-fit items-center"}
      >
        {children}
      </span>
      {
        /* 浮层经 Portal 挂 body + `fixed`，避免侧栏/滚动容器的 overflow 与叠层裁剪 */
      }
      <Show when={() => isOpen()}>
        {[
          typeof globalThis.document !== "undefined" && (
            <Portal mount={globalThis.document.body}>
              <div
                key="dropdown-overlay"
                ref={(el: HTMLElement) => {
                  overlayEl = el;
                  if (el) {
                    alignOverlay();
                    if (isAuto) scheduleMeasure();
                  }
                }}
                class="fixed overflow-visible"
                style={() => ({
                  ...portalFixedStyle.value,
                  zIndex: DROPDOWN_OVERLAY_ROOT_Z_INDEX,
                })}
                onClick={!isHover && closeOnOverlayClick
                  ? () =>
                    setOpen(false)
                  : undefined}
                onMouseEnter={isHover
                  ? (handleOverlayEnter as (e: Event) => void)
                  : undefined}
                onMouseLeave={isHover
                  ? (handleOverlayLeave as (e: Event) => void)
                  : undefined}
              >
                {
                  /*
                   * 可选箭头：菱形与 {@link Popover} 一致（旋转方片 + 缺角边框）。
                   * 外壳无 border；箭头相对面板外壳绝对定位。
                   */
                }
                {() => {
                  /**
                   * 菜单面板：边框、背景、内边距；`overlayClass` 只作用于此。
                   * 带 `arrow` 时仍用整周 `border`（与 {@link Popover} 一致），否则无 `border-t` 时顶边整条缺失，
                   * 左右竖边「悬空」、小箭头与盒体不连贯。若顶线与菱形有轻微交叠，由尖角同底色 + 较高 `z` 覆盖弱化。
                   */
                  const panelClass = () =>
                    twMerge(
                      "relative z-10 min-w-[120px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg p-1",
                      overlayClass,
                    );
                  const eff = resolvePlacement(
                    isAuto,
                    autoPlacement.value,
                    placement,
                  );
                  const panel = (
                    <div
                      key="dropdown-overlay-panel"
                      id={overlayId}
                      role="menu"
                      class={panelClass}
                    >
                      {overlay}
                    </div>
                  );
                  if (!arrow) {
                    return panel;
                  }
                  const arrowEl = (
                    <span
                      key="dropdown-arrow"
                      class={() =>
                        twMerge(
                          "pointer-events-none z-20",
                          getDropdownArrowProps(eff).className,
                        )}
                      style={() => arrowStyle.value}
                      aria-hidden
                    />
                  );
                  /** 箭头在后便于叠在面板之上绘制，且作为外壳直接子节点供测试定位 */
                  return [panel, arrowEl];
                }}
              </div>
            </Portal>
          ),
        ]}
      </Show>
    </span>
  );
}
