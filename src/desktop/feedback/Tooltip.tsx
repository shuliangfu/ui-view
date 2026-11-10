/**
 * Tooltip 悬停提示（View）。
 * 桌面常用：触发器悬停时显示气泡；支持 placement、箭头。`placement="auto"` 时优选上方，边挡住则朝相反方向展开，箭头跟随实际方位。
 *
 * **布局**：有可用 `document.body` 时，气泡经 {@link createPortal} 挂到 body，`position:fixed` + 视口坐标，
 * 避免祖先 `overflow: hidden | auto` 裁切；否则回退为包裹层内 `absolute`（SSR / hybrid）。
 */

import {
  createPortal,
  createRef,
  createRenderEffect,
  createSignal,
  type JSXRenderable,
  onCleanup,
} from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { getBrowserBodyPortalHost } from "../../shared/feedback/portal-host.ts";
import {
  computeArrowAnchorStyle,
  resolveAutoPopPlacement,
  type AutoPopPlacement,
  type FullPopStylePlacement,
  type PopSize,
} from "./popFixedStyle.ts";

/** 含 `auto`：优选上方并在贴边时翻转；写死方位不翻转 */
export type TooltipPlacement = AutoPopPlacement;

export interface TooltipMessages {
  /**
   * 预留扩展键（当前气泡正文走 props.content）。
   * 保留空默认对象以便 `messages?: Partial<TooltipMessages>` 与其它组件同形。
   */
  _reserved?: string;
}

export const defaultTooltipMessages: TooltipMessages = {};

export interface TooltipProps {
  /** 提示文案或节点 */
  content: string | unknown;
  /** 气泡位置，默认 `"top"`；传 `"auto"` 时优选上方，边挡住则朝相反方向展开，箭头跟随实际方位 */
  placement?: TooltipPlacement;
  /** 触发元素（子节点） */
  children?: unknown;
  /** 是否显示箭头，默认 true */
  arrow?: boolean;
  /** 额外 class（作用于包装器） */
  class?: string;
  /** 气泡内容区 class（含 z-index 等，便于全屏编辑器等抬高） */
  overlayClass?: string;
  /**
   * 为 true 时强制隐藏且不再响应悬停。
   * 传零参 getter 时可订阅 Signal（如 Popconfirm 打开时压掉同锚点 Tooltip）。
   */
  disabled?: boolean | (() => boolean);
  /** 多语言／自定义文案；未传字段走 {@link defaultTooltipMessages}；正文请用 content */
  messages?: Partial<TooltipMessages>;
}

const TOOLTIP_VIEWPORT_GAP_PX = 8;

/** 占位矩形，仅作 {@link createSignal} 初值，首帧 hover 前即会被 {@link syncFloatGeometry} 覆盖 */
const EMPTY_DOM_RECT = {
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  width: 0,
  height: 0,
  x: 0,
  y: 0,
} as unknown as DOMRect;


/** 解析 {@link TooltipProps.disabled}（字面量或零参 getter）。 */
function readTooltipDisabled(
  disabled: boolean | (() => boolean) | undefined,
): boolean {
  if (disabled == null) return false;
  return typeof disabled === "function" ? disabled() : disabled;
}

/**
 * 根据触发器视口矩形与 placement，计算 Portal 浮层 `fixed` 的 left/top/transform（像素）。
 *
 * @param placement - 已解析的具体方位（不含 auto）
 * @param rect - 触发器 {@link DOMRect}
 * @param gap - 与触发器边距（px）
 */
function getTooltipFixedStyle(
  placement: FullPopStylePlacement,
  rect: DOMRect,
  gap: number,
): { left: string; top: string; transform: string } {
  const L = rect.left;
  const R = rect.right;
  const T = rect.top;
  const B = rect.bottom;
  const cx = L + rect.width / 2;
  const cy = T + rect.height / 2;
  switch (placement) {
    case "top":
      return {
        left: `${cx}px`,
        top: `${T - gap}px`,
        transform: "translate(-50%, -100%)",
      };
    case "topLeft":
      return {
        left: `${L}px`,
        top: `${T - gap}px`,
        transform: "translate(0, -100%)",
      };
    case "topRight":
      return {
        left: `${R}px`,
        top: `${T - gap}px`,
        transform: "translate(-100%, -100%)",
      };
    case "bottom":
      return {
        left: `${cx}px`,
        top: `${B + gap}px`,
        transform: "translate(-50%, 0)",
      };
    case "bottomLeft":
      return {
        left: `${L}px`,
        top: `${B + gap}px`,
        transform: "translate(0, 0)",
      };
    case "bottomRight":
      return {
        left: `${R}px`,
        top: `${B + gap}px`,
        transform: "translate(-100%, 0)",
      };
    case "left":
      return {
        left: `${L - gap}px`,
        top: `${cy}px`,
        transform: "translate(-100%, -50%)",
      };
    case "leftTop":
      return {
        left: `${L - gap}px`,
        top: `${T}px`,
        transform: "translate(-100%, 0)",
      };
    case "leftBottom":
      return {
        left: `${L - gap}px`,
        top: `${B}px`,
        transform: "translate(-100%, -100%)",
      };
    case "right":
      return {
        left: `${R + gap}px`,
        top: `${cy}px`,
        transform: "translate(0, -50%)",
      };
    case "rightTop":
      return {
        left: `${R + gap}px`,
        top: `${T}px`,
        transform: "translate(0, 0)",
      };
    case "rightBottom":
      return {
        left: `${R + gap}px`,
        top: `${B}px`,
        transform: "translate(0, -100%)",
      };
    default:
      return {
        left: `${cx}px`,
        top: `${T - gap}px`,
        transform: "translate(-50%, -100%)",
      };
  }
}

/**
 * 箭头外观 class；沿边位置由 {@link computeArrowAnchorStyle} 对准触发器中线。
 *
 * @param placement - 气泡相对触发器的方位
 * @returns Tailwind 定位类名字符串
 */
function arrowClass(_placement: FullPopStylePlacement): string {
  void _placement;
  return "absolute w-2 h-2 bg-slate-800 dark:bg-slate-700";
}

/** 相对包裹层、按 placement 对齐（仅无 Portal 时的回退路径） */
const placementClasses: Record<FullPopStylePlacement, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  topLeft: "bottom-full left-0 mb-2",
  topRight: "bottom-full right-0 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  bottomLeft: "top-full left-0 mt-2",
  bottomRight: "top-full right-0 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  leftTop: "right-full top-0 mr-2",
  leftBottom: "right-full bottom-0 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
  rightTop: "left-full top-0 ml-2",
  rightBottom: "left-full bottom-0 ml-2",
};

const bubbleInnerCls =
  "relative w-max max-w-[min(20rem,calc(100vw-1rem))] px-3 py-1.5 text-xs font-normal text-white text-left whitespace-normal break-words rounded-md bg-slate-800 dark:bg-slate-700 shadow-lg box-border";

/**
 * 悬停提示：包裹 `children`，有 `body` 时将气泡 Portal 到文档根，避免 overflow 裁切。
 *
 * @param props - {@link TooltipProps}
 * @returns 包装器与（悬停时）Portal 气泡
 */
export function Tooltip(props: TooltipProps): JSXRenderable {
  const {
    content,
    placement = "top",
    children,
    arrow = true,
    class: className,
    overlayClass,
  } = props;
  // merge for API parity; content remains the visible tip text
  const _m: TooltipMessages = {
    ...defaultTooltipMessages,
    ...(props.messages ?? {}),
  };
  void _m;

  const tooltipId = `tooltip-${Math.random().toString(36).slice(2, 11)}`;
  const preferred: AutoPopPlacement = placement;
  const initialResolved: FullPopStylePlacement = preferred === "auto" ? "top" : preferred;
  const resolvedPlacement = createSignal<FullPopStylePlacement>(initialResolved);
  const popupSize = createSignal<PopSize>({ width: 0, height: 0 });
  const wrapRef = createRef<HTMLSpanElement>(null);
  let tooltipPanelEl: HTMLElement | null = null;
  const visible = createSignal(false);
  const floatStyle = createSignal(
    getTooltipFixedStyle(initialResolved, EMPTY_DOM_RECT, TOOLTIP_VIEWPORT_GAP_PX),
  );
  const arrowStyle = createSignal<Record<string, string>>({});
  const posCls = placementClasses[initialResolved];

  const portalHostOk = getBrowserBodyPortalHost() != null;

  const syncFloatGeometry = (measured?: PopSize) => {
    const el = wrapRef.current;
    if (el == null) return;
    if (measured && measured.width > 0 && measured.height > 0) {
      const prev = popupSize.value;
      if (prev.width !== measured.width || prev.height !== measured.height) {
        popupSize.value = measured;
      }
    }
    const resolved = resolveAutoPopPlacement({
      trigger: el.getBoundingClientRect(),
      preferred,
      popup: measured ?? popupSize.value,
      autoPrefers: "top",
      gap: TOOLTIP_VIEWPORT_GAP_PX,
    });
    if (resolvedPlacement.value !== resolved) resolvedPlacement.value = resolved;
    const next = getTooltipFixedStyle(
      resolved,
      el.getBoundingClientRect(),
      TOOLTIP_VIEWPORT_GAP_PX,
    );
    const prev = floatStyle.value;
    if (prev.left !== next.left || prev.top !== next.top || prev.transform !== next.transform) {
      floatStyle.value = next;
    }
    if (tooltipPanelEl) {
      const panel = tooltipPanelEl.getBoundingClientRect();
      if (panel.width > 0 && panel.height > 0) {
        const nextArrow = computeArrowAnchorStyle(
          resolved,
          el.getBoundingClientRect(),
          panel,
        );
        const prevArrow = arrowStyle.value;
        if (
          prevArrow.left !== nextArrow.left ||
          prevArrow.top !== nextArrow.top ||
          prevArrow.right !== nextArrow.right ||
          prevArrow.bottom !== nextArrow.bottom ||
          prevArrow.transform !== nextArrow.transform
        ) {
          arrowStyle.value = nextArrow;
        }
      }
    }
  };

  const onEnter = () => {
    if (readTooltipDisabled(props.disabled)) return;
    syncFloatGeometry();
    visible.value = true;
  };
  const onLeave = () => {
    visible.value = false;
  };
  /** 点击／按下触发器时收起（避免同锚点 Popconfirm 打开后 tip 仍挡确认钮） */
  const onPointerDown = () => {
    visible.value = false;
  };

  // disabled 变为 true 时立刻收起（订阅 getter 内 Signal）
  createRenderEffect(() => {
    if (readTooltipDisabled(props.disabled)) visible.value = false;
  });

  createRenderEffect(() => {
    /** View 的 {@link createSignal} 用 `.value` 读写，勿写成 `visible()`（不会订阅、条件恒错） */
    if (!portalHostOk || !visible.value) return;
    const host = getBrowserBodyPortalHost();
    if (host == null) return;

    const onScrollOrResize = () => {
      syncFloatGeometry();
    };
    syncFloatGeometry();
    globalThis.addEventListener?.("scroll", onScrollOrResize, true);
    globalThis.addEventListener?.("resize", onScrollOrResize);

    const root = createPortal(() => {
      const st = floatStyle.value;
      const place = resolvedPlacement.value;
      return (
        <div
          id={tooltipId}
          role="tooltip"
          data-dreamer-placement={place}
          class={twMerge(
            "fixed z-1070 pointer-events-none transition-opacity duration-150 opacity-100 visible",
            overlayClass,
          )}
          style={{
            left: st.left,
            top: st.top,
            transform: st.transform,
          }}
          ref={(node: HTMLElement | null) => {
            if (node == null) {
              tooltipPanelEl = null;
              return;
            }
            tooltipPanelEl = node;
            const fr = node.getBoundingClientRect();
            if (fr.width > 0 && fr.height > 0) {
              const prev = popupSize.value;
              if (prev.width !== fr.width || prev.height !== fr.height) {
                syncFloatGeometry({ width: fr.width, height: fr.height });
              } else {
                syncFloatGeometry(undefined);
              }
            }
          }}
        >
          <div class={bubbleInnerCls}>
            {typeof content === "string" ? content : content}
            {arrow && (
              <span
                class={arrowClass(place)}
                style={arrowStyle.value}
                data-dreamer-arrow=""
              />
            )}
          </div>
        </div>
      );
    }, host);

    onCleanup(() => {
      globalThis.removeEventListener?.("scroll", onScrollOrResize, true);
      globalThis.removeEventListener?.("resize", onScrollOrResize);
      root.unmount();
    });
  });

  if (!portalHostOk) {
    return (
      <span
        class={twMerge("relative inline-flex group", className)}
        aria-describedby={tooltipId}
      >
        {children}
        <span
          id={tooltipId}
          role="tooltip"
          class={twMerge(
            "absolute z-1070 w-max max-w-[min(20rem,calc(100vw-1rem))] px-3 py-1.5 text-xs font-normal text-white text-left whitespace-normal break-words rounded-md bg-slate-800 dark:bg-slate-700 shadow-lg",
            "opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-150 pointer-events-none box-border",
            posCls,
            overlayClass,
          )}
        >
          {typeof content === "string" ? content : content}
          {arrow && (
            <span
              class={twMerge(
                arrowClass(initialResolved),
                initialResolved.startsWith("top")
                  ? "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"
                  : initialResolved.startsWith("bottom")
                  ? "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  : initialResolved.startsWith("left")
                  ? "right-0 top-1/2 -translate-y-1/2 translate-x-1/2"
                  : "left-0 top-1/2 -translate-y-1/2 -translate-x-1/2",
              )}
            />
          )}
        </span>
      </span>
    );
  }

  return (
    <span
      ref={wrapRef}
      class={twMerge("relative inline-flex", className)}
      aria-describedby={() => (visible.value ? tooltipId : undefined)}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onPointerDown={onPointerDown}
    >
      {children}
    </span>
  );
}
