/**
 * Toast 轻提示容器（View）。
 * 需在应用根节点挂载 <ToastContainer />，通过 toast.success/error/info/warning 触发。
 * 仅简单背景色 + 文案，无左侧色条/类型图标/关闭按钮；支持 placement、duration、light/dark 主题。
 * 有 `document.body` 时用 {@link createPortal} 挂到 `body`，避免应用根 `overflow` 裁切。
 */

import {
  createRenderEffect,
  type JSXRenderable,
  onCleanup,
} from "@dreamer/view";
import { createPortal } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import type { ToastItem, ToastType } from "./toast-store.ts";
import { toastList } from "./toast-store.ts";
import { getBrowserBodyPortalHost } from "./portal-host.ts";

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
 * 浮层 VNode：在 Portal getter 或 SSR 回退 getter 内调用，读 `toastList()` 以订阅列表。
 */
function renderToastOverlay(): JSXRenderable {
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
}

/**
 * Toast 容器：有 `body` 时内容经 Portal 挂到 `body`；纯 SSR 无 `body` 时回退为根内 getter。
 */
export function ToastContainer() {
  /**
   * 仅在有待展示条目时创建 Portal：`createPortal` 会立刻在 `body` 下插入包装节点，
   * 若首帧即 `createPortal` 而 `renderToastOverlay` 为 null，会留下空 `view-portal` div。
   */
  createRenderEffect(() => {
    const host = getBrowserBodyPortalHost();
    if (host == null) return;
    if (toastList().length === 0) return;
    const root = createPortal(() => renderToastOverlay(), host);
    onCleanup(() => {
      root.unmount();
    });
  });

  const portalHostOk = getBrowserBodyPortalHost() != null;
  if (portalHostOk) {
    return (
      <span
        style="display:none;width:0;height:0;overflow:hidden;position:absolute;clip:rect(0,0,0,0)"
        aria-hidden="true"
        data-dreamer-toast-portal-anchor=""
      />
    );
  }
  return () => renderToastOverlay();
}
