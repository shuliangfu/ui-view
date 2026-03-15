/**
 * 消息与通知（ANALYSIS 3.3）：Toast、Message、Notification。
 */
export { ToastContainer } from "./Toast.tsx";
export { toast } from "./toast-store.ts";
export type { ToastItem, ToastPlacement, ToastType } from "./toast-store.ts";
export { clearToasts, removeToast } from "./toast-store.ts";

export { message } from "./message.ts";

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
