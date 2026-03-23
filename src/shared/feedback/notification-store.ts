/**
 * Notification 消息通知框 — 全局状态与命令式 API。
 * 支持 title、description、icon、type、duration、key 去重、堆叠；支持自定义弹出位置 placement。
 */

import { createSignal } from "@dreamer/view/signal";

export type NotificationType =
  | "success"
  | "error"
  | "info"
  | "warning"
  | "default";

/** 弹出位置：右上、右下、下中、上中、左上、左下 */
export type NotificationPlacement =
  | "top-right"
  | "top-center"
  | "top-left"
  | "bottom-right"
  | "bottom-center"
  | "bottom-left";

export interface NotificationItem {
  id: string;
  /** 可选 key，相同 key 会替换旧通知 */
  key?: string;
  type: NotificationType;
  title: string;
  description?: string;
  /** 自定义图标（VNode 或组件），不传则按 type 用默认图标 */
  icon?: unknown;
  duration: number;
  createdAt: number;
  /** 可选操作按钮文案与回调 */
  btnText?: string;
  onBtnClick?: () => void;
  onClose?: () => void;
  /** 弹出位置，默认 top-right */
  placement?: NotificationPlacement;
}

const notificationListRef = createSignal<NotificationItem[]>([]);

/** 供 NotificationContainer 在渲染 getter 内订阅列表 */
export function notificationList(): NotificationItem[] {
  return notificationListRef.value;
}

function nextId(): string {
  return `notification-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const DEFAULT_DURATION = 4500;

export interface OpenOptions {
  key?: string;
  type?: NotificationType;
  title: string;
  description?: string;
  icon?: unknown;
  duration?: number;
  btnText?: string;
  onBtnClick?: () => void;
  onClose?: () => void;
  /** 弹出位置，默认 top-right */
  placement?: NotificationPlacement;
}

export function openNotification(options: OpenOptions): string {
  const key = options.key;
  let list = notificationListRef.value;
  if (key != null && key !== "") {
    list = list.filter((n: NotificationItem) => n.key !== key);
  }
  const id = nextId();
  const item: NotificationItem = {
    id,
    key: options.key,
    type: options.type ?? "default",
    title: options.title,
    description: options.description,
    icon: options.icon,
    duration: options.duration ?? DEFAULT_DURATION,
    createdAt: Date.now(),
    btnText: options.btnText,
    onBtnClick: options.onBtnClick,
    onClose: options.onClose,
    placement: options.placement ?? "top-right",
  };
  notificationListRef.value = [...list, item];
  if (item.duration > 0) {
    setTimeout(() => closeNotification(id), item.duration);
  }
  return id;
}

export function closeNotification(id: string): void {
  const item = notificationListRef.value.find((n: NotificationItem) =>
    n.id === id
  );
  item?.onClose?.();
  notificationListRef.value = notificationListRef.value.filter((n) =>
    n.id !== id
  );
}

export function destroyNotifications(): void {
  notificationListRef.value = [];
}

export const notification = {
  open: openNotification,
  close: closeNotification,
  destroy: destroyNotifications,
};
