/**
 * Dropdown 下拉菜单（View）。
 * 桌面点击/悬停展开；**仅向触发器下方**展开（`bottom` / `bottomLeft` / `bottomRight` / `bottomAuto`），不支持向上展开。
 * Esc 关闭（需 initDropdownEsc）、hover 延迟防抖。展开状态由组件内部维护，无需传 open。
 * 浮层容器使用 **`p-1`**（四边等距）；展开时经 {@link Portal} 挂到 `document.body`，`fixed` 按视口定位，避免祖先 `overflow` 裁剪。
 */

import { createEffect, createSignal, Portal, Show } from "@dreamer/view";
import type { JSXRenderable } from "@dreamer/view";
import { twMerge } from "tailwind-merge";

export type DropdownPlacement =
  | "bottom"
  | "bottomLeft"
  | "bottomRight"
  | "bottomAuto";

export interface DropdownProps {
  /** 触发元素（子节点） */
  children?: unknown;
  /** 下拉内容（菜单或自定义节点） */
  overlay: unknown;
  /** 打开/关闭时回调（可选，仅通知，不参与控制） */
  onOpenChange?: (open: boolean) => void;
  /** 触发方式：click 或 hover，默认 "click" */
  trigger?: "click" | "hover";
  /** hover 时展开延迟（ms），默认 150 */
  hoverOpenDelay?: number;
  /** hover 时收起延迟（ms），默认 100 */
  hoverCloseDelay?: number;
  /** 下拉位置（均在触发器下方）：默认 `bottom`（居中）；`bottomAuto` 根据左右空间在正下/偏左/偏右间切换 */
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
   * 为 true 时在浮层**顶边**（靠向触发器一侧）绘制小尖角；左/中/右随 `placement`。
   * 默认 false。
   */
  arrow?: boolean;
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
      close();
      delete g[DROPDOWN_ESC_KEY];
    }
  };
  globalThis.document.addEventListener("keydown", onKeyDown);
  return () => globalThis.document.removeEventListener("keydown", onKeyDown);
}

/** 与 Tailwind `mt-1`/`mb-1` 默认间距一致（px） */
const GAP_Y_COMPACT_PX = 4;
/** 与 Tailwind `mt-2`/`mb-2` 默认间距一致（px），用于带箭头时间隙 */
const GAP_Y_ARROW_PX = 8;

/** 与 {@link getDropdownArrowProps} 内 `left`/`right` inset 一致（px）；`bottomLeft`/`bottomRight` 带箭头时用其锚定浮层，使箭头对准触发器左/右缘 */
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
function computeDropdownFixedStyle(
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
      /**
       * 与 `bottomRight` 对称：箭头在面板**右侧** inset，`right: iw - tr.left - inset` 使尖角对准触发器**左缘**；无箭头时浮层左缘贴 `tr.left`。
       */
      if (arrowEnabled) {
        return {
          ...C,
          top: `${tr.bottom + gap}px`,
          right: `${iw - tr.left - ARROW_INSET_PX}px`,
          left: "auto",
          bottom: "auto",
          transform: "none",
        };
      }
      return {
        ...C,
        top: `${tr.bottom + gap}px`,
        left: `${tr.left}px`,
        right: "auto",
        transform: "none",
      };
    case "bottomRight":
      /**
       * 箭头在面板**左侧** inset：`left: tr.right - inset` 使尖角对准触发器**右缘**；无箭头时浮层右缘贴 `tr.right`。
       */
      if (arrowEnabled) {
        return {
          ...C,
          top: `${tr.bottom + gap}px`,
          left: `${tr.right - ARROW_INSET_PX}px`,
          right: "auto",
          bottom: "auto",
          transform: "none",
        };
      }
      return {
        ...C,
        top: `${tr.bottom + gap}px`,
        right: `${iw - tr.right}px`,
        left: "auto",
        bottom: "auto",
        transform: "none",
      };
    default:
      return { ...C };
  }
}

type ResolvedPopPlacement =
  | "bottom"
  | "bottomLeft"
  | "bottomRight";

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
  if (placement === "bottomAuto") {
    return "bottom";
  }
  return placement;
}

/**
 * 菱形箭头：`rotate(45deg)` 与位移写在**同一条** `transform`，避免多段 Tailwind transform 互相覆盖。
 * 菜单仅在触发器**下方**，箭头始终在面板**顶边**；`bottomLeft` 为右侧 inset，`bottomRight` 为左侧 inset。
 *
 * @param eff - 解析后的 placement
 */
function getDropdownArrowProps(
  eff: ResolvedPopPlacement,
): { className: string; style: Record<string, string> } {
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
      /** 与 bottomRight 对称：尖角在面板顶边**右侧** */
      style = {
        top: "0",
        left: "auto",
        right: `${ARROW_INSET_PX}px`,
        transform: "translate(50%, -50%) rotate(45deg)",
      };
      break;
    case "bottomRight":
      style = {
        top: "0",
        left: `${ARROW_INSET_PX}px`,
        right: "auto",
        transform: "translate(-50%, -50%) rotate(45deg)",
      };
      break;
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
const hoverTimers: { open: number; close: number } = { open: 0, close: 0 };

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
  } = props;

  /** 展开状态由组件内部维护（`Signal`，`.value`） */
  const openState = createSignal(false);
  /** bottomAuto 时根据视口空间计算出的实际位置 */
  const autoPlacement = createSignal<
    "bottom" | "bottomLeft" | "bottomRight"
  >("bottom");

  /** Portal + `fixed` 浮层的内联样式（视口坐标），展开时由 {@link computeDropdownFixedStyle} 写入 */
  const portalFixedStyle = createSignal<Record<string, string>>({});

  /** 同步内部 open 与 onOpenChange 通知 */
  const setOpen = (value: boolean) => {
    openState.value = value;
    onOpenChange?.(value);
  };

  const isHover = trigger === "hover";
  const isAuto = placement === "bottomAuto";

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
    if (spaceLeft < halfW && spaceRight >= halfW) {
      autoPlacement.value = "bottomLeft";
    } else if (spaceRight < halfW && spaceLeft >= halfW) {
      autoPlacement.value = "bottomRight";
    } else {
      autoPlacement.value = "bottom";
    }
  };
  const scheduleMeasure = () => {
    if (typeof globalThis.requestAnimationFrame === "undefined") return;
    globalThis.requestAnimationFrame(() => {
      measureAndSetAuto();
    });
  };

  /**
   * 展开后把 Portal 浮层 `fixed` 与触发器对齐。
   * 仅依赖 `scroll` 时，部分浏览器与合成顺序会导致晚一帧才更新，**滚动跟手**感差。
   * 故在**展开期**用 `requestAnimationFrame` 自循环，每帧读 `getBoundingClientRect` 与绘制同频（约 60Hz），
   * 对任意 `div` 滚动/窗口变化/动效下触发器移动都能跟上；`bottomAuto` 在第二帧再量浮层宽。
   */
  createEffect(() => {
    if (!openState.value || typeof globalThis.window === "undefined") {
      portalFixedStyle.value = {};
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

    const run = () => {
      if (!triggerEl) return;
      const tr = triggerEl.getBoundingClientRect();
      const eff = resolvePlacement(
        isAuto,
        autoPlacement.value,
        placement,
      );
      portalFixedStyle.value = computeDropdownFixedStyle(tr, eff, arrow);
    };

    run();

    let frameIndex = 0;
    let rafLoop = 0;
    let running = true;
    const keepAligned = () => {
      if (!running) return;
      run();
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
    const onResize = () => run();
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
  createEffect(() => {
    if (
      typeof globalThis.document === "undefined" || isHover || !openState.value
    ) {
      return;
    }
    const id = globalThis.setTimeout(() => {
      const onDocClick = (e: MouseEvent) => {
        const target = e.target as Node | null;
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
        removeClickOutside = null;
      };
    }, 0);
    return () => {
      globalThis.clearTimeout(id);
      removeClickOutside?.();
    };
  });

  const handleTriggerClick = (e: Event) => {
    e.preventDefault();
    if (disabled) return;
    if (!isHover) setOpen(!openState.value);
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
        aria-expanded={() => openState.value}
        aria-disabled={disabled}
        onClick={!isHover
          ? (handleTriggerClick as (e: Event) => void)
          : undefined}
        onKeyDown={!isHover && !disabled
          ? ((e: Event) => {
            const k = (e as KeyboardEvent).key;
            if (k === "Enter" || k === " ") {
              e.preventDefault();
              setOpen(!openState.value);
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
      <Show when={() => openState.value}>
        {[
          typeof globalThis !== "undefined" &&
          (() => {
            const g = globalThis as unknown as Record<
              string,
              (() => void) | undefined
            >;
            g[DROPDOWN_ESC_KEY] = () => setOpen(false);
            return null;
          })(),
          typeof globalThis.document !== "undefined" && (
            <Portal mount={globalThis.document.body}>
              <div
                key="dropdown-overlay"
                ref={(el: HTMLElement) => {
                  overlayEl = el;
                  if (el && isAuto) {
                    scheduleMeasure();
                  }
                }}
                class="fixed overflow-visible"
                style={() => ({
                  ...portalFixedStyle.value,
                  zIndex: DROPDOWN_OVERLAY_ROOT_Z_INDEX,
                })}
                onClick={!isHover
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
                  /** 菜单面板：边框、背景、内边距；`overlayClass` 只作用于此 */
                  const panelClass = () =>
                    twMerge(
                      "relative z-10 min-w-[120px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg p-1",
                      overlayClass,
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
                  const eff = resolvePlacement(
                    isAuto,
                    autoPlacement.value,
                    placement,
                  );
                  const ap = getDropdownArrowProps(eff);
                  const arrowEl = (
                    <span
                      key="dropdown-arrow"
                      class={() =>
                        twMerge("pointer-events-none z-20", ap.className)}
                      style={ap.style}
                      aria-hidden
                    />
                  );
                  /** 箭头在后便于叠在面板之上绘制 */
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
