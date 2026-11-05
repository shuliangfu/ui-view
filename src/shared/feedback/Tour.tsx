/**
 * Tour 漫游式引导（View）。
 * 按步骤高亮目标并展示说明气泡；支持受控 `open`／`current`、四向 placement、Esc／焦点与步骤切换时滚动入视。
 */

import {
  createEffect,
  createMemo,
  createPortal,
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

export interface TourStep {
  /** 目标选择器（querySelector）或 HTMLElement／getter */
  target: string | HTMLElement | (() => HTMLElement | null | undefined);
  /** 标题 */
  title?: unknown;
  /** 说明 */
  description?: unknown;
  /** 气泡相对目标的放置，默认 bottom */
  placement?: "top" | "bottom" | "left" | "right";
}

export interface TourMessages {
  next: string;
  prev: string;
  finish: string;
  skip: string;
}

export const defaultTourMessages: TourMessages = {
  next: "下一步",
  prev: "上一步",
  finish: "完成",
  skip: "跳过",
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

/**
 * 按 placement 计算气泡 fixed 坐标（尽量不溢出视口）。
 */
function computeBubbleStyle(
  rect: DOMRect,
  placement: TourStep["placement"],
): Record<string, string> {
  const gap = 12;
  const bw = 320;
  const bh = 160;
  const vw = globalThis.innerWidth ?? 400;
  const vh = globalThis.innerHeight ?? 600;
  const place = placement ?? "bottom";

  let top = rect.bottom + gap;
  let left = rect.left;

  if (place === "top") {
    top = rect.top - bh - gap;
    left = rect.left + rect.width / 2 - bw / 2;
  } else if (place === "bottom") {
    top = rect.bottom + gap;
    left = rect.left + rect.width / 2 - bw / 2;
  } else if (place === "left") {
    top = rect.top + rect.height / 2 - bh / 2;
    left = rect.left - bw - gap;
  } else if (place === "right") {
    top = rect.top + rect.height / 2 - bh / 2;
    left = rect.right + gap;
  }

  top = clamp(top, 12, Math.max(12, vh - bh - 12));
  left = clamp(left, 12, Math.max(12, vw - bw - 12));
  return {
    top: `${top}px`,
    left: `${left}px`,
    width: `min(100% - 24px, ${bw}px)`,
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

  const currentIndex = createMemo(() => {
    const v = readMaybeSignal(props.current);
    const max = Math.max(0, steps.length - 1);
    const n = typeof v === "number" && Number.isFinite(v) ? v : 0;
    return clamp(n, 0, max);
  });

  const setCurrent = (i: number) => {
    const max = Math.max(0, steps.length - 1);
    const next = clamp(i, 0, max);
    commitMaybeSignal(props.current, next);
    onCurrentChange?.(next);
  };

  createEffect(() => {
    if (!isOpen()) {
      rectSig.value = null;
      return;
    }
    const step = steps[currentIndex()];
    if (!step) return;

    const update = () => {
      const el = resolveTarget(step.target);
      if (el && typeof el.scrollIntoView === "function") {
        try {
          el.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
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

    // 聚焦气泡内首个按钮，便于键盘操作
    const focusPanel = () => {
      const panel = panelRef.value;
      const btn = panel?.querySelector?.<HTMLElement>("button");
      btn?.focus?.({ preventScroll: true });
    };
    const raf = globalThis.requestAnimationFrame?.(focusPanel);

    onCleanup(() => {
      if (t != null) globalThis.clearTimeout?.(t);
      if (raf != null) globalThis.cancelAnimationFrame?.(raf);
      globalThis.removeEventListener?.("resize", onWin);
      globalThis.removeEventListener?.("scroll", onWin, true);
      globalThis.document?.removeEventListener?.("keydown", onKey);
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
      }
      : null;
    const bubbleStyle = rect
      ? computeBubbleStyle(rect, step.placement)
      : { top: "30%", left: "50%", transform: "translateX(-50%)", width: "min(100% - 24px, 20rem)" };
    const isLast = idx >= steps.length - 1;
    const titleId = "ui-tour-title";
    const descId = "ui-tour-desc";

    return (
      <div
        class={twMerge("fixed inset-0 z-400", className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={step.title != null ? titleId : undefined}
        aria-describedby={step.description != null ? descId : undefined}
        aria-label={step.title == null ? "功能引导" : undefined}
      >
        <div class="absolute inset-0 bg-slate-900/50" aria-hidden="true" />
        {highlight && (
          <div
            class="absolute rounded-md ring-2 ring-blue-400 shadow-[0_0_0_9999px_rgba(15,23,42,0.55)] pointer-events-none"
            style={highlight}
            aria-hidden="true"
          />
        )}
        <div
          ref={(el: unknown) => {
            panelRef.value = (el as HTMLElement | null) ?? null;
          }}
          class="absolute z-10 rounded-xl bg-white dark:bg-slate-800 p-4 shadow-xl text-slate-900 dark:text-slate-100"
          style={bubbleStyle}
        >
          {step.title != null && (
            <div id={titleId} class="font-semibold text-sm mb-1">
              {step.title}
            </div>
          )}
          {step.description != null && (
            <div id={descId} class="text-sm text-slate-600 dark:text-slate-300 mb-3">
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

  const host = getBrowserBodyPortalHost();
  if (host) {
    createPortal(() => markup(), host);
    return null;
  }
  return () => markup();
}
