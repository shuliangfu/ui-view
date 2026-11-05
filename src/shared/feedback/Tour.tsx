/**
 * Tour 漫游式引导（View）。
 * 按步骤高亮目标并展示说明气泡；支持受控 `open`／`current`。
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
  type MaybeSignal,
  readMaybeSignal,
  commitMaybeSignal,
} from "../form/maybe-signal.ts";

export interface TourStep {
  /** 目标选择器（querySelector）或 HTMLElement */
  target: string | HTMLElement | (() => HTMLElement | null | undefined);
  /** 标题 */
  title?: unknown;
  /** 说明 */
  description?: unknown;
  /** 气泡放置 */
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

export function Tour(props: TourProps): JSXRenderable {
  const {
    steps,
    onClose,
    onFinish,
    onCurrentChange,
    showSkip = true,
    class: className,
  } = props;
  const m = { ...defaultTourMessages, ...(props.messages ?? {}) };
  const isOpen = createMemo(() => readControlledOpenInput(props.open));
  const rectSig = createSignal<DOMRect | null>(null);

  const currentIndex = createMemo(() => {
    const v = readMaybeSignal(props.current);
    return typeof v === "number" && Number.isFinite(v) ? Math.max(0, v) : 0;
  });

  const setCurrent = (i: number) => {
    commitMaybeSignal(props.current, i);
    onCurrentChange?.(i);
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
      rectSig.value = el?.getBoundingClientRect?.() ?? null;
    };
    update();
    const onWin = () => update();
    globalThis.addEventListener?.("resize", onWin);
    globalThis.addEventListener?.("scroll", onWin, true);
    onCleanup(() => {
      globalThis.removeEventListener?.("resize", onWin);
      globalThis.removeEventListener?.("scroll", onWin, true);
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
      ? {
        top: `${rect.bottom + 12}px`,
        left: `${Math.min(
          Math.max(12, rect.left),
          (globalThis.innerWidth ?? 400) - 280,
        )}px`,
      }
      : { top: "30%", left: "50%", transform: "translateX(-50%)" };

    const isLast = idx >= steps.length - 1;

    return (
      <div
        class={twMerge("fixed inset-0 z-400", className)}
        role="dialog"
        aria-modal="true"
        aria-label="功能引导"
      >
        <div class="absolute inset-0 bg-slate-900/50" aria-hidden />
        {highlight && (
          <div
            class="absolute rounded-md ring-2 ring-blue-400 shadow-[0_0_0_9999px_rgba(15,23,42,0.55)] pointer-events-none"
            style={highlight}
          />
        )}
        <div
          class="absolute z-10 w-[min(100%-24px,20rem)] rounded-xl bg-white dark:bg-slate-800 p-4 shadow-xl text-slate-900 dark:text-slate-100"
          style={bubbleStyle}
        >
          {step.title != null && (
            <div class="font-semibold text-sm mb-1">{step.title}</div>
          )}
          {step.description != null && (
            <div class="text-sm text-slate-600 dark:text-slate-300 mb-3">
              {step.description}
            </div>
          )}
          <div class="flex items-center justify-between gap-2">
            <div class="text-xs text-slate-400">
              {idx + 1}/{steps.length}
            </div>
            <div class="flex gap-2">
              {showSkip && (
                <button
                  type="button"
                  class="text-xs text-slate-500 px-2 py-1"
                  onClick={() => onClose?.()}
                >
                  {m.skip}
                </button>
              )}
              {idx > 0 && (
                <button
                  type="button"
                  class="text-xs px-2 py-1 rounded border border-slate-200 dark:border-slate-600"
                  onClick={() => setCurrent(idx - 1)}
                >
                  {m.prev}
                </button>
              )}
              <button
                type="button"
                class="text-xs px-3 py-1 rounded bg-blue-600 text-white"
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
