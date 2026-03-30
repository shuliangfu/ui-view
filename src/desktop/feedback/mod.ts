/**
 * 桌面端反馈入口：本目录各 `.ts`/`.tsx` 显式导出（Toast/Message/Notification/Alert 等为薄 re-export，Modal 等为桌面实现）。
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

export { Alert } from "./Alert.tsx";
export type { AlertProps, AlertType } from "./Alert.tsx";

export { Drawer } from "./Drawer.tsx";
export type {
  DrawerOpenInput,
  DrawerPlacement,
  DrawerProps,
  DrawerTitleAlign,
  DrawerTitleInput,
} from "./Drawer.tsx";

export { Progress } from "./Progress.tsx";
export type {
  ProgressPercentInput,
  ProgressProps,
  ProgressStatus,
  ProgressType,
} from "./Progress.tsx";

export { Result } from "./Result.tsx";
export type { ResultProps, ResultStatus } from "./Result.tsx";

export { Modal } from "./Modal.tsx";
export type {
  ModalOpenInput,
  ModalProps,
  ModalTitleAlign,
  ModalTitleInput,
  ModalWidthInput,
  ModalWidthPrimitive,
} from "./Modal.tsx";
export { Dialog } from "./Dialog.tsx";
export type { DialogProps } from "./Dialog.tsx";
export { Tooltip } from "./Tooltip.tsx";
export type { TooltipPlacement, TooltipProps } from "./Tooltip.tsx";
export { Popover } from "./Popover.tsx";
export type { PopoverPlacement, PopoverProps } from "./Popover.tsx";
export { Popconfirm } from "./Popconfirm.tsx";
export type {
  PopconfirmOpenInput,
  PopconfirmPlacement,
  PopconfirmProps,
} from "./Popconfirm.tsx";
