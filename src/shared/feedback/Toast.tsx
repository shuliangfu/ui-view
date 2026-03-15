/**
 * Toast 轻提示容器（View）。
 * 需在应用根节点挂载 <ToastContainer />，通过 toast.success/error/info/warning 触发。
 * 支持 placement、duration、light/dark 主题。
 */

import { twMerge } from "tailwind-merge";
import type { ToastItem, ToastType } from "./toast-store.ts";
import { removeToast, toastList } from "./toast-store.ts";
import {
  IconAlertCircle,
  IconCheckCircle,
  IconInfo,
  IconXCircle,
} from "../basic/icons/mod.ts";

/** 按 placement 分组 */
const PLACEMENTS = [
  "top",
  "top-center",
  "top-left",
  "top-right",
  "bottom",
  "bottom-center",
  "bottom-left",
  "bottom-right",
] as const;

const placementContainerClasses: Record<(typeof PLACEMENTS)[number], string> = {
  "top": "top-4 left-1/2 -translate-x-1/2 items-center",
  "top-center": "top-4 left-1/2 -translate-x-1/2 items-center",
  "top-left": "top-4 left-4 items-start",
  "top-right": "top-4 right-4 items-end",
  "bottom": "bottom-4 left-1/2 -translate-x-1/2 items-center",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
  "bottom-left": "bottom-4 left-4 items-start",
  "bottom-right": "bottom-4 right-4 items-end",
};

const typeIconClasses: Record<ToastType, string> = {
  success: "text-green-600 dark:text-green-400",
  error: "text-red-600 dark:text-red-400",
  warning: "text-amber-600 dark:text-amber-400",
  info: "text-blue-600 dark:text-blue-400",
};

const typeBorderClasses: Record<ToastType, string> = {
  success: "border-l-green-500 dark:border-l-green-400",
  error: "border-l-red-500 dark:border-l-red-400",
  warning: "border-l-amber-500 dark:border-l-amber-400",
  info: "border-l-blue-500 dark:border-l-blue-400",
};

/** 渲染单条 Toast 的图标 */
function ToastIcon({ type }: { type: ToastType }) {
  const iconCls = typeIconClasses[type];
  const base = "shrink-0 w-5 h-5";
  if (type === "success") {
    return <IconCheckCircle class={twMerge(base, iconCls)} />;
  }
  if (type === "error") return <IconXCircle class={twMerge(base, iconCls)} />;
  if (type === "warning") {
    return <IconAlertCircle class={twMerge(base, iconCls)} />;
  }
  return <IconInfo class={twMerge(base, iconCls)} />;
}

/** 单条 Toast 项（纯展示，不读 signal，避免整块重跑导致闪烁） */
function ToastItemEl(
  { item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void },
) {
  const borderCls = typeBorderClasses[item.type];
  return () => (
    <div
      role="alert"
      class={twMerge(
        "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 border-l-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all duration-200",
        borderCls,
      )}
    >
      <ToastIcon type={item.type} />
      <span class="text-sm font-medium break-words flex-1">{item.content}</span>
      <button
        type="button"
        aria-label="关闭"
        class="shrink-0 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
        onClick={() => onDismiss(item.id)}
      >
        <svg
          class="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

/** Toast 容器：固定定位，按 placement 分组渲染，自动关闭由 store 内 setTimeout 处理 */
export function ToastContainer() {
  return () => {
    const list = toastList();
    const byPlacement = new Map<string, ToastItem[]>();
    for (const item of list) {
      const key = item.placement;
      if (!byPlacement.has(key)) byPlacement.set(key, []);
      byPlacement.get(key)!.push(item);
    }

    return (
      <div
        class="fixed inset-0 pointer-events-none z-200 flex flex-col"
        aria-live="polite"
      >
        {PLACEMENTS.map((placement) => {
          const items = byPlacement.get(placement) ?? [];
          if (items.length === 0) return null;
          return (
            <div
              key={placement}
              class={twMerge(
                "absolute flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none",
                placementContainerClasses[placement],
              )}
            >
              <div class="flex flex-col gap-2 w-full pointer-events-auto">
                {items.map((item) => (
                  <div key={item.id}>
                    <ToastItemEl item={item} onDismiss={removeToast} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <style>
          {`
          @keyframes toast-in {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          `}
        </style>
      </div>
    );
  };
}
