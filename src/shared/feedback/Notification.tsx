/**
 * Notification 消息通知框容器（View）。
 * 需在应用根挂载 <NotificationContainer />，通过 notification.open() 触发。
 * 支持自定义弹出位置 placement：右上、右下、下中、上中、左上、左下。
 */

import { twMerge } from "tailwind-merge";
import type {
  NotificationItem,
  NotificationPlacement,
  NotificationType,
} from "./notification-store.ts";
import { closeNotification, notificationList } from "./notification-store.ts";
import {
  IconAlertCircle,
  IconBell,
  IconCheckCircle,
  IconInfo,
  IconXCircle,
} from "../basic/icons/mod.ts";

const typeIconClasses: Record<NotificationType, string> = {
  success: "text-green-600 dark:text-green-400",
  error: "text-red-600 dark:text-red-400",
  warning: "text-amber-600 dark:text-amber-400",
  info: "text-blue-600 dark:text-blue-400",
  default: "text-slate-600 dark:text-slate-400",
};

/** 默认图标按 type */
function NotificationIcon({ type }: { type: NotificationType }) {
  const iconCls = typeIconClasses[type];
  const base = "shrink-0 w-5 h-5";
  if (type === "success") {
    return <IconCheckCircle class={twMerge(base, iconCls)} />;
  }
  if (type === "error") return <IconXCircle class={twMerge(base, iconCls)} />;
  if (type === "warning") {
    return <IconAlertCircle class={twMerge(base, iconCls)} />;
  }
  if (type === "info") return <IconInfo class={twMerge(base, iconCls)} />;
  return <IconBell class={twMerge(base, iconCls)} />;
}

/** 单条通知项 */
function NotificationItemEl({
  item,
  onClose,
}: {
  item: NotificationItem;
  onClose: (id: string) => void;
}) {
  return () => (
    <div
      role="alert"
      class="flex gap-3 p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 min-w-[320px] max-w-[420px]"
    >
      <div class="shrink-0 pt-0.5">
        <NotificationIcon type={item.type} />
      </div>
      <div class="flex-1 min-w-0">
        <div class="font-semibold text-sm text-slate-900 dark:text-slate-100">
          {item.title}
        </div>
        {item.description != null && item.description !== "" && (
          <div class="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {item.description}
          </div>
        )}
        {item.btnText != null && item.btnText !== "" &&
          item.onBtnClick != null && (
          <button
            type="button"
            class="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            onClick={() => item.onBtnClick?.()}
          >
            {item.btnText}
          </button>
        )}
      </div>
      <button
        type="button"
        aria-label="关闭"
        class="shrink-0 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
        onClick={() => onClose(item.id)}
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

const PLACEMENTS: NotificationPlacement[] = [
  "top-right",
  "top-center",
  "top-left",
  "bottom-right",
  "bottom-center",
  "bottom-left",
];

const placementContainerClasses: Record<NotificationPlacement, string> = {
  "top-right": "top-4 right-4 items-end",
  "top-center": "top-4 left-1/2 -translate-x-1/2 items-center",
  "top-left": "top-4 left-4 items-start",
  "bottom-right": "bottom-4 right-4 items-end",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
  "bottom-left": "bottom-4 left-4 items-start",
};

/** 通知容器：按 placement 分组，各位置独立堆叠 */
export function NotificationContainer() {
  return () => {
    const list = notificationList();
    if (list.length === 0) return null;
    const byPlacement = new Map<NotificationPlacement, NotificationItem[]>();
    for (const item of list) {
      const p = item.placement ?? "top-right";
      if (!byPlacement.has(p)) byPlacement.set(p, []);
      byPlacement.get(p)!.push(item);
    }
    return (
      <div
        class="fixed inset-0 pointer-events-none z-201 flex flex-col"
        aria-live="polite"
      >
        {PLACEMENTS.map((placement) => {
          const items = byPlacement.get(placement) ?? [];
          if (items.length === 0) return null;
          return (
            <div
              key={placement}
              class={twMerge(
                "absolute flex flex-col gap-3 pointer-events-none max-w-full px-4",
                placementContainerClasses[placement],
              )}
            >
              <div class="flex flex-col gap-3 pointer-events-auto">
                {items.map((item: NotificationItem) => (
                  <div key={item.id}>
                    <NotificationItemEl item={item} onClose={closeNotification} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
}
