/**
 * Toast 轻提示容器（View）。
 * 需在应用根节点挂载 <ToastContainer />，通过 toast.success/error/info/warning 触发。
 * 仅简单背景色 + 文案，无左侧色条/类型图标/关闭按钮；支持 placement、duration、light/dark 主题。
 */

import { twMerge } from "tailwind-merge";
import type { ToastItem, ToastType } from "./toast-store.ts";
import { toastList } from "./toast-store.ts";

/** 按 placement 分组：上、下、居中 */
const PLACEMENTS = ["top", "bottom", "center"] as const;

const placementContainerClasses: Record<(typeof PLACEMENTS)[number], string> = {
  "top": "items-center",
  "bottom": "items-center",
  "center": "items-center justify-center",
};

/** 各类型背景色，与 Button 变体一致：success 绿、error 红、info 蓝、warning 橙 */
const toastTypeClasses: Record<ToastType, string> = {
  success: "bg-green-600 text-white dark:bg-green-500",
  error: "bg-red-600 text-white dark:bg-red-500",
  info: "bg-blue-600 text-white dark:bg-blue-500",
  warning: "bg-amber-500 text-white dark:bg-amber-500",
};

/** 单条 Toast 项：按 type 使用与按钮一致的背景色 + 文案（自动 duration 关闭） */
function ToastItemEl({ item }: { item: ToastItem }) {
  return (
    <div
      role="alert"
      class={twMerge(
        "px-4 py-3 rounded-lg text-sm shadow-md backdrop-blur-sm",
        toastTypeClasses[item.type],
      )}
    >
      {item.content}
    </div>
  );
}

/**
 * Toast 容器：固定定位，按 placement 分组渲染，自动关闭由 store 内 setTimeout 处理。
 * 外层 `return () => { ... }` 必须保留：在渲染 getter 内调用 `toastList()` 读模块级 SignalRef，
 * 父组件不会因命令式 `toast()` 而重渲染，仅靠此处订阅列表变化。
 */
export function ToastContainer() {
  return () => {
    const list = toastList();
    if (list.length === 0) return null;
    const byPlacement = new Map<string, ToastItem[]>();
    for (const item of list) {
      const key = item.placement;
      if (!byPlacement.has(key)) byPlacement.set(key, []);
      byPlacement.get(key)!.push(item);
    }

    return (
      <div
        class="fixed inset-0 pointer-events-none flex flex-col"
        style={{ zIndex: 2147483647 }}
        aria-live="polite"
      >
        {PLACEMENTS.map((placement) => {
          const items = byPlacement.get(placement) ?? [];
          if (items.length === 0) return null;
          const isCenter = placement === "center";
          const placementStyle = isCenter
            ? {
              top: "50%",
              left: "50%",
              right: "auto",
              bottom: "auto",
              transform: "translate(-50%, -50%)",
              width: "max-content",
              maxWidth: "24rem",
              margin: 0,
            }
            : placement === "top"
            ? {
              top: "3rem",
              bottom: "auto",
              left: 0,
              right: 0,
              marginLeft: "auto",
              marginRight: "auto",
              width: "max-content",
              maxWidth: "24rem",
            }
            : {
              top: "auto",
              bottom: "1rem",
              left: 0,
              right: 0,
              marginLeft: "auto",
              marginRight: "auto",
              width: "max-content",
              maxWidth: "24rem",
            };
          return (
            <div
              key={placement}
              class={twMerge(
                "absolute flex flex-col gap-2 px-4 pointer-events-none items-center",
                placementContainerClasses[placement],
              )}
              style={placementStyle}
            >
              <div class="flex flex-col gap-2 items-center min-w-0 pointer-events-auto">
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
