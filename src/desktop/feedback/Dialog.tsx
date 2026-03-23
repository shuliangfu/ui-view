/**
 * Dialog 确认/取消对话框（View）。
 * 可视为 Modal 简化版：标题、内容、确定/取消按钮；支持危险操作（红色确定）、加载态。
 */

import { Button } from "../../shared/basic/Button.tsx";
import { Modal } from "./Modal.tsx";
import type { ModalProps } from "./Modal.tsx";

export interface DialogProps extends
  Omit<
    ModalProps,
    "footer" | "children"
  > {
  /** 是否打开（受控） */
  open?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
  /** 标题 */
  title?: string | null;
  /** 正文内容（与 children 二选一，若都传则 content 优先） */
  content?: string | unknown;
  /** 弹层内容（与 content 二选一） */
  children?: unknown;
  /** 自定义底部（覆盖默认确定/取消）；传 null 不显示 footer */
  footer?: unknown;
  /** 确定按钮文案，默认 "确定" */
  confirmText?: string;
  /** 取消按钮文案，默认 "取消"；传 null 或空则不显示取消按钮 */
  cancelText?: string | null;
  /** 确定回调；不传则不显示确定按钮（仅当 footer 也未传时生效） */
  onConfirm?: () => void | Promise<void>;
  /** 取消回调，默认 onClose */
  onCancel?: () => void;
  /** 是否为危险操作（确定按钮 danger 样式），默认 false */
  danger?: boolean;
  /** 确定按钮 loading 态，默认 false */
  confirmLoading?: boolean;
  /** 是否显示底部（确定/取消）；传 false 则完全不显示 footer */
  showFooter?: boolean;
}

export function Dialog(props: DialogProps) {
  const {
    open,
    onClose,
    title,
    content,
    children,
    footer: footerOverride,
    confirmText = "确定",
    cancelText = "取消",
    onConfirm,
    onCancel,
    danger = false,
    confirmLoading = false,
    showFooter = true,
    ...restModal
  } = props;

  const body = content !== undefined ? content : children;
  const hasCancel = cancelText != null && cancelText !== "";
  const hasConfirm = onConfirm != null;

  const defaultFooter =
    showFooter && (hasConfirm || hasCancel) && footerOverride === undefined
      ? (
        <>
          {hasCancel && (
            <Button
              variant="default"
              onClick={(_e: Event) => (onCancel ?? onClose)?.()}
              disabled={confirmLoading}
            >
              {cancelText}
            </Button>
          )}
          {hasConfirm && (
            <Button
              variant={danger ? "danger" : "primary"}
              onClick={(_e: Event) => onConfirm?.()}
              disabled={confirmLoading}
            >
              {confirmLoading ? "加载中…" : confirmText}
            </Button>
          )}
        </>
      )
      : footerOverride;

  /** 无内部 signal，直接返回 VNode */
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={defaultFooter}
      keyboard
      {...restModal}
    >
      {body}
    </Modal>
  );
}
