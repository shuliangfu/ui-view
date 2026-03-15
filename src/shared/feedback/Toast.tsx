/**
 * Toast 轻提示容器（View）。
 * 需在应用根节点挂载 <ToastContainer />，通过 toast.success/error/info/warning 触发。
 * 仅简单背景色 + 文案，无左侧色条/类型图标/关闭按钮；支持 placement、duration、light/dark 主题。
 */

import { twMerge } from "tailwind-merge";
import type { ToastItem } from "./toast-store.ts";
import { toastList } from "./toast-store.ts";

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

/** 单条 Toast 项：仅简单背景 + 文案，无图标/关闭按钮（自动 duration 关闭） */
function ToastItemEl({ item }: { item: ToastItem }) {
  return () => (
    <div
      role="alert"
      class="px-4 py-3 rounded-lg bg-slate-200/95 dark:bg-slate-700/95 text-slate-800 dark:text-slate-100 text-sm shadow-md backdrop-blur-sm"
    >
      {item.content}
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
                    <ToastItemEl item={item} />
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
