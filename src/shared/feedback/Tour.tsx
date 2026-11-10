/**
 * Tour 漫游式引导（View）。
 * 按步骤高亮目标并展示说明气泡；支持受控 `open`／`current`、四向 placement 与 `auto`、Esc／焦点与步骤切换时滚动入视。
 * `placement="auto"` 时优选下方，边挡住则朝相反方向展开。
 *
 * 浮层经 Portal 挂 `document.body`，`z-index` 高于文档示例触发钮，避免「开始引导」等按钮叠在气泡／高亮之间。
 */

import {
  createEffect,
  createMemo,
  createPortal,
  createRenderEffect,
  createSignal,
  type JSXRenderable,
  onCleanup,
} from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import {
  type ControlledOpenInput,
  readControlledOpenInput,
} from "./controlled-open.ts";
import { getBrowserBodyPortalHost } from "./portal-host.ts";
import {
  commitMaybeSignal,
  type MaybeSignal,
  readMaybeSignal,
} from "../form/maybe-signal.ts";
import {
  flipPlacementToFit,
  popBoxForPlacement,
  type FullPopStylePlacement,
  type PopSize,
} from "./popFixedStyle.ts";

export interface TourStep {
  /** 目标选择器（querySelector）或 HTMLElement／getter */
  target: string | HTMLElement | (() => HTMLElement | null | undefined);
  /** 标题 */
  title?: unknown;
  /** 说明 */
  description?: unknown;
  /** 气泡相对目标的放置，默认 `bottom`；传 `"auto"` 时优选下方，边挡住则朝相反方向展开 */
  placement?: "top" | "bottom" | "left" | "right" | "auto";
}

export interface TourMessages {
  next: string;
  prev: string;
  finish: string;
  skip: string;
  /** 无 step.title 时浮层 aria-label */
  guide: string;
}

export const defaultTourMessages: TourMessages = {
  next: "下一步",
  prev: "上一步",
  finish: "完成",
  skip: "跳过",
  guide: "功能引导",
};

export interface TourProps {
  open?: ControlledOpenInput;
  steps: TourStep[];
  /** 当前步（0-based），MaybeSignal */
  current?: MaybeSignal<number>;
  onCurrentChange?: (index: number) => void;
  onClose?: () => void;
  onFinish?: () => void;
  messages?: Partial<TourMessages>;
  class?: string;
  /** 是否显示跳过，默认 true */
  showSkip?: boolean;
  /** Esc 关闭，默认 true */
  keyboard?: boolean;
}

/** 高于文档站 sticky 顶栏与示例区内按钮，避免触发钮叠穿引导层 */
const TOUR_Z_INDEX = 1100;

function resolveTarget(t: TourStep["target"]): HTMLElement | null {
  try {
    if (typeof t === "function") return t() ?? null;
    if (typeof t === "string") {
      if (typeof globalThis.document === "undefined") return null;
      return globalThis.document.querySelector(t);
    }
    return t;
  } catch {
    return null;
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

const TOUR_GAP_PX = 12;
const TOUR_ESTIMATED_SIZE: PopSize = { width: 320, height: 160 };
const TOUR_VIEW_PADDING = 12;

function tourPreferredPlacement(
  placement: TourStep["placement"],
): FullPopStylePlacement {
  if (placement == null || placement === "auto") return "bottom";
  return placement;
}

/**
 * 按 placement 计算气泡 fixed 坐标。
 * `auto`：优选下方，边挡住则朝相反方向（与共享 {@link flipPlacementToFit} 同规则）；
 * 写死方位保持原侧，仅在交叉轴上夹入视口，避免改掉既有示例的固定方向。
 *
 * @param rect - 目标元素视口矩形
 * @param placement - 步骤声明的方位
 * @param size - 已测气泡尺寸；未知时用估计值
 * @returns style 与已解析方位
 */
function computeBubbleStyle(
  rect: DOMRect,
  placement: TourStep["placement"],
  size: PopSize = TOUR_ESTIMATED_SIZE,
): { style: Record<string, string>; placement: FullPopStylePlacement } {
  const gap = TOUR_GAP_PX;
  const bw = size.width > 0 ? size.width : TOUR_ESTIMATED_SIZE.width;
  const bh = size.height > 0 ? size.height : TOUR_ESTIMATED_SIZE.height;
  const vw = globalThis.innerWidth ?? 400;
  const vh = globalThis.innerHeight ?? 600;
  const viewport = { width: vw, height: vh };
  const popup = { width: bw, height: bh };
  const preferred = tourPreferredPlacement(placement);
  const resolved = placement === "auto"
    ? flipPlacementToFit(preferred, rect, popup, viewport, gap, TOUR_VIEW_PADDING)
    : preferred;
  const box = popBoxForPlacement(rect, resolved, popup, gap);
  let top = box.top;
  let left = box.left;
  top = clamp(top, TOUR_VIEW_PADDING, Math.max(TOUR_VIEW_PADDING, vh - bh - TOUR_VIEW_PADDING));
  left = clamp(left, TOUR_VIEW_PADDING, Math.max(TOUR_VIEW_PADDING, vw - bw - TOUR_VIEW_PADDING));
  return {
    style: {
      top: `${top}px`,
      left: `${left}px`,
      width: `min(100% - 24px, ${TOUR_ESTIMATED_SIZE.width}px)`,
    },
    placement: resolved,
  };
}

export function Tour(props: TourProps): JSXRenderable {
  const {
    steps,
    onClose,
    onFinish,
    onCurrentChange,
    showSkip = true,
    keyboard = true,
    class: className,
  } = props;
  const m = { ...defaultTourMessages, ...(props.messages ?? {}) };
  const isOpen = createMemo(() => readControlledOpenInput(props.open));
  const rectSig = createSignal<DOMRect | null>(null);
  const panelRef = createSignal<HTMLElement | null>(null);
  const bubbleSize = createSignal<PopSize>({ width: 0, height: 0 });
  /** 非受控步进：docs／多数用法不传 `current`，须有内部索引，否则「下一步」空操作 */
  const innerCurrent = createSignal(0);

  const currentIndex = createMemo(() => {
    const max = Math.max(0, steps.length - 1);
    const v = readMaybeSignal(props.current);
    if (typeof v === "number" && Number.isFinite(v)) {
      return clamp(v, 0, max);
    }
    return clamp(innerCurrent.value, 0, max);
  });

  const setCurrent = (i: number) => {
    const max = Math.max(0, steps.length - 1);
    const next = clamp(i, 0, max);
    if (props.current !== undefined) {
      commitMaybeSignal(props.current, next);
    } else {
      innerCurrent.set(next);
    }
    onCurrentChange?.(next);
  };

  createEffect(() => {
    if (!isOpen()) {
      rectSig.value = null;
      bubbleSize.value = { width: 0, height: 0 };
      // 关闭时复位非受控步，下次打开从第 0 步开始
      if (props.current === undefined) innerCurrent.set(0);
      return;
    }
    const step = steps[currentIndex()];
    if (!step) return;

    const update = () => {
      const el = resolveTarget(step.target);
      if (el && typeof el.scrollIntoView === "function") {
        try {
          el.scrollIntoView({
            block: "center",
            inline: "nearest",
            behavior: "smooth",
          });
        } catch {
          el.scrollIntoView();
        }
      }
      rectSig.value = el?.getBoundingClientRect?.() ?? null;
    };
    // 等滚动后再量一次
    update();
    const t = globalThis.setTimeout?.(update, 280);
    const onWin = () => {
      const el = resolveTarget(step.target);
      rectSig.value = el?.getBoundingClientRect?.() ?? null;
    };
    globalThis.addEventListener?.("resize", onWin);
    globalThis.addEventListener?.("scroll", onWin, true);

    const onKey = (e: KeyboardEvent) => {
      if (!keyboard) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        const idx = currentIndex();
        if (idx >= steps.length - 1) {
          onFinish?.();
          onClose?.();
        } else {
          setCurrent(idx + 1);
        }
      } else if (e.key === "ArrowLeft") {
        setCurrent(currentIndex() - 1);
      }
    };
    globalThis.document?.addEventListener?.("keydown", onKey);

    const focusPanel = () => {
      const panel = panelRef.value;
      const btn = panel?.querySelector?.<HTMLElement>("button");
      btn?.focus?.({ preventScroll: true });
    };
    const raf = globalThis.requestAnimationFrame?.(focusPanel);

    // 打开时锁 body 滚动，减少目标／气泡错位
    const body = getBrowserBodyPortalHost();
    const prevOverflow = body?.style.overflow;
    if (body) body.style.overflow = "hidden";

    onCleanup(() => {
      if (t != null) globalThis.clearTimeout?.(t);
      if (raf != null) globalThis.cancelAnimationFrame?.(raf);
      globalThis.removeEventListener?.("resize", onWin);
      globalThis.removeEventListener?.("scroll", onWin, true);
      globalThis.document?.removeEventListener?.("keydown", onKey);
      if (body && prevOverflow != null) body.style.overflow = prevOverflow;
    });
  });

  const markup = () => {
    if (!isOpen()) return null;
    const idx = currentIndex();
    const step = steps[idx];
    if (!step) return null;
    const rect = rectSig.value;
    const pad = 6;
    const highlight = rect
      ? {
        top: `${Math.max(0, rect.top - pad)}px`,
        left: `${Math.max(0, rect.left - pad)}px`,
        width: `${rect.width + pad * 2}px`,
        height: `${rect.height + pad * 2}px`,
        // 仅用外扩阴影做遮罩：高亮框内透出目标，框外变暗；不再铺 inset 半透明层，避免触发钮叠进气泡缝
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.6)",
      }
      : null;
    const computed = rect
      ? computeBubbleStyle(rect, step.placement, bubbleSize.value)
      : null;
    const bubbleStyle = computed
      ? computed.style
      : {
        top: "30%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(100% - 24px, 20rem)",
      };
    const isLast = idx >= steps.length - 1;
    const titleId = "ui-tour-title";
    const descId = "ui-tour-desc";

    return (
      <div
        class={twMerge("fixed inset-0", className)}
        style={{ zIndex: String(TOUR_Z_INDEX) }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={step.title != null ? titleId : undefined}
        aria-describedby={step.description != null ? descId : undefined}
        aria-label={step.title == null ? m.guide : undefined}
        data-dreamer-tour="root"
      >
        {/* 全屏拦截：挡住页面触发钮；视觉变暗由高亮 box-shadow 承担 */}
        <div
          class="absolute inset-0"
          aria-hidden="true"
          data-dreamer-tour="mask"
        />
        {highlight && (
          <div
            class="absolute rounded-md ring-2 ring-blue-400 pointer-events-none bg-transparent"
            style={highlight}
            aria-hidden="true"
            data-dreamer-tour="highlight"
          />
        )}
        <div
          ref={(el: unknown) => {
            const node = (el as HTMLElement | null) ?? null;
            panelRef.value = node;
            if (node) {
              const fr = node.getBoundingClientRect();
              if (fr.width > 0 && fr.height > 0) {
                const prev = bubbleSize.value;
                if (prev.width !== fr.width || prev.height !== fr.height) {
                  bubbleSize.value = { width: fr.width, height: fr.height };
                }
              }
            }
          }}
          class="absolute z-10 rounded-xl bg-white dark:bg-slate-800 p-4 shadow-xl text-slate-900 dark:text-slate-100"
          style={bubbleStyle}
          data-dreamer-tour="bubble"
          data-dreamer-placement={computed ? computed.placement : undefined}
          data-tour-step={String(idx)}
        >
          {step.title != null && (
            <div id={titleId} class="font-semibold text-sm mb-1">
              {step.title}
            </div>
          )}
          {step.description != null && (
            <div
              id={descId}
              class="text-sm text-slate-600 dark:text-slate-300 mb-3"
            >
              {step.description}
            </div>
          )}
          <div class="flex items-center justify-between gap-2">
            <div class="text-xs text-slate-400" aria-live="polite">
              {idx + 1}/{steps.length}
            </div>
            <div class="flex gap-2">
              {showSkip && (
                <button
                  type="button"
                  class="text-xs text-slate-500 px-2 py-1 rounded focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
                  onClick={() => onClose?.()}
                >
                  {m.skip}
                </button>
              )}
              {idx > 0 && (
                <button
                  type="button"
                  class="text-xs px-2 py-1 rounded border border-slate-200 dark:border-slate-600 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
                  onClick={() => setCurrent(idx - 1)}
                >
                  {m.prev}
                </button>
              )}
              <button
                type="button"
                class="text-xs px-3 py-1 rounded bg-blue-600 text-white focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-400"
                onClick={() => {
                  if (isLast) {
                    onFinish?.();
                    onClose?.();
                  } else {
                    setCurrent(idx + 1);
                  }
                }}
              >
                {isLast ? m.finish : m.next}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  createRenderEffect(() => {
    const host = getBrowserBodyPortalHost();
    if (host == null) return;
    const root = createPortal(() => markup(), host);
    onCleanup(() => {
      root.unmount();
    });
  });

  return (
    <span
      style="display:none;width:0;height:0;overflow:hidden;position:absolute;clip:rect(0,0,0,0)"
      aria-hidden="true"
      data-dreamer-tour-portal-anchor=""
    />
  );
}
