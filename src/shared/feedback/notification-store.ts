/**
 * Notification 消息通知框 — 全局状态与命令式 API。
 * 支持 title、description、icon、type、duration、key 去重、堆叠（右上角）。
 */

import { createSignal } from "@dreamer/view";

export type NotificationType =
  | "success"
  | "error"
  | "info"
  | "warning"
  | "default";

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
}

const [getNotificationList, setNotificationList] = createSignal<
  NotificationItem[]
>([]);
export const notificationList = getNotificationList;

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
}

export function openNotification(options: OpenOptions): string {
  const key = options.key;
  let list = getNotificationList();
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
  };
  setNotificationList([...list, item]);
  if (item.duration > 0) {
    setTimeout(() => closeNotification(id), item.duration);
  }
  return id;
}

export function closeNotification(id: string): void {
  const item = getNotificationList().find((n: NotificationItem) => n.id === id);
  item?.onClose?.();
  setNotificationList(
    getNotificationList().filter((n: NotificationItem) => n.id !== id),
  );
}

export function destroyNotifications(): void {
  setNotificationList([]);
}

export const notification = {
  open: openNotification,
  close: closeNotification,
  destroy: destroyNotifications,
};
