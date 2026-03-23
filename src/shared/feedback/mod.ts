/**
 * 消息与通知（ANALYSIS 3.3）：Toast、Message、Notification。
 * ToastContainer / MessageContainer / NotificationContainer 使用 `return () => { ... }`，
 * 在渲染 getter 内读取模块级列表 SignalRef（`toastList()` 等），以便命令式 API 更新时仍能重绘。
 */
export { ToastContainer } from "./Toast.tsx";
export { toast } from "./toast-store.ts";
export type { ToastItem, ToastPlacement, ToastType } from "./toast-store.ts";
export { clearToasts, removeToast } from "./toast-store.ts";

export { MessageContainer } from "./Message.tsx";
export { message } from "./message-store.ts";
export type {
  MessageItem,
  MessagePlacement,
  MessageType,
} from "./message-store.ts";
export { clearMessages, removeMessage } from "./message-store.ts";

export { NotificationContainer } from "./Notification.tsx";
export { notification } from "./notification-store.ts";
export type {
  NotificationItem,
  NotificationPlacement,
  NotificationType,
  OpenOptions,
} from "./notification-store.ts";
export {
  closeNotification,
  destroyNotifications,
  openNotification,
} from "./notification-store.ts";

/**
 * 反馈与浮层（ANALYSIS 3.4，C 共用）：Alert、Drawer、Progress、Result。
 * D：Modal、Dialog、Tooltip、Popover、Popconfirm → desktop/feedback；M：BottomSheet、ActionSheet、PullRefresh、SwipeCell → mobile/feedback。
 */
export { Alert } from "./Alert.tsx";
export type { AlertProps, AlertType } from "./Alert.tsx";

export { Drawer } from "./Drawer.tsx";
export type { DrawerPlacement, DrawerProps } from "./Drawer.tsx";

export { Progress } from "./Progress.tsx";
export type {
  ProgressProps,
  ProgressStatus,
  ProgressType,
} from "./Progress.tsx";

export { Result } from "./Result.tsx";
export type { ResultProps, ResultStatus } from "./Result.tsx";
