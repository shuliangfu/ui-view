/**
 * Popconfirm 气泡确认框（View）。
 * 删除等二次确认：点击触发后显示带标题与「确定/取消」的面板；支持危险样式。
 * 受控：open + onOpenChange，由父级在触发元素上绑定 onClick 打开。
 */

import { twMerge } from "tailwind-merge";
import { Button } from "../../shared/basic/Button.tsx";
import { IconHelpCircle } from "../../shared/basic/icons/mod.ts";

export type PopconfirmPlacement =
  | "top"
  | "topLeft"
  | "topRight"
  | "bottom"
  | "bottomLeft"
  | "bottomRight"
  | "left"
  | "right";

export interface PopconfirmProps {
  /** 是否打开（受控） */
  open?: boolean;
  /** 打开/关闭回调（关闭时传 false） */
  onOpenChange?: (open: boolean) => void;
  /** 确认标题/描述 */
  title: string;
  /** 确定回调 */
  onConfirm?: () => void;
  /** 取消回调（默认即 onOpenChange(false)） */
  onCancel?: () => void;
  /** 确定按钮文案，默认 "确定" */
  okText?: string;
  /** 取消按钮文案，默认 "取消" */
  cancelText?: string;
  /** 是否为危险操作（确定按钮红色），默认 false */
  danger?: boolean;
  /** 是否显示问号图标，默认 true */
  showIcon?: boolean;
  /** 气泡位置，默认 "top" */
  placement?: PopconfirmPlacement;
  /** 触发元素（需在 onClick 中调用 onOpenChange(true) 打开） */
  children?: unknown;
  /** 额外 class（包装器） */
  class?: string;
  /** 面板 class */
  overlayClass?: string;
}

const placementClasses: Record<PopconfirmPlacement, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  topLeft: "bottom-full left-0 mb-2",
  topRight: "bottom-full right-0 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  bottomLeft: "top-full left-0 mt-2",
  bottomRight: "top-full right-0 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

export function Popconfirm(props: PopconfirmProps) {
  const {
    open = false,
    onOpenChange,
    title,
    onConfirm,
    onCancel,
    okText = "确定",
    cancelText = "取消",
    danger = false,
    showIcon = true,
    placement = "top",
    children,
    class: className,
    overlayClass,
  } = props;

  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange?.(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange?.(false);
  };

  const posCls = placementClasses[placement];

  const handleBackdropClick = (e: Event) => {
    if (e.target === e.currentTarget) onOpenChange?.(false);
  };

  return () => (
    <span class={twMerge("relative inline-flex", className)}>
      {children}
      {open && (
        <>
          <div
            class="fixed inset-0 z-40"
            aria-hidden
            onClick={handleBackdropClick as (e: Event) => void}
          />
          <span
            class={twMerge(
              "absolute z-50 min-w-[200px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg text-slate-900 dark:text-slate-100 p-3",
              posCls,
              overlayClass,
            )}
          >
          <div class="flex gap-2">
            {showIcon && (
              <span class="shrink-0 text-slate-400 dark:text-slate-500 mt-0.5">
                <IconHelpCircle class="w-4 h-4" />
              </span>
            )}
            <div class="flex-1">
              <div class="text-sm mb-3">{title}</div>
              <div class="flex justify-end gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={(_e: Event) => handleCancel()}
                >
                  {cancelText}
                </Button>
                <Button
                  variant={danger ? "danger" : "primary"}
                  size="sm"
                  onClick={(_e: Event) => handleConfirm()}
                >
                  {okText}
                </Button>
              </div>
            </div>
          </div>
          </span>
        </>
      )}
    </span>
  );
}
