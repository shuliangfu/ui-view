/**
 * ActionSheet 底部动作列表（View）。
 * 移动端选择/操作：底部弹出若干选项 + 取消；支持标题、危险项、禁用项。
 */

import { twMerge } from "tailwind-merge";

export interface ActionSheetAction {
  /** 显示文案 */
  label: string;
  /** 点击回调 */
  onClick?: () => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否危险操作（红色文案） */
  danger?: boolean;
  /** 可选描述（如副标题） */
  description?: string;
  /** 可选图标（VNode，显示在 label 左侧） */
  icon?: unknown;
}

export interface ActionSheetProps {
  /** 是否打开（受控） */
  open?: boolean;
  /** 关闭回调（点击取消或遮罩时触发） */
  onClose?: () => void;
  /** 标题（可选，显示在动作列表上方） */
  title?: string | null;
  /** 动作项列表 */
  actions: ActionSheetAction[];
  /** 取消按钮文案，默认 "取消"；传 null 或空则不显示取消区 */
  cancelText?: string | null;
  /** 点击遮罩是否关闭，默认 true */
  maskClosable?: boolean;
  /** 关闭后是否销毁，默认 false */
  destroyOnClose?: boolean;
  /** 额外 class（作用于容器） */
  class?: string;
}

export function ActionSheet(props: ActionSheetProps) {
  const {
    open = false,
    onClose,
    title,
    actions,
    cancelText = "取消",
    maskClosable = true,
    destroyOnClose = false,
    class: className,
  } = props;

  const shouldRender = open || !destroyOnClose;
  if (!shouldRender) return () => null;

  const handleMaskClick = (e: Event) => {
    if (e.target === e.currentTarget && maskClosable) onClose?.();
  };

  return () => {
    const g = globalThis as unknown as { document?: Document };
    if (!open) {
      if (g.document?.body) g.document.body.style.overflow = "";
      return null;
    }
    if (g.document?.body) g.document.body.style.overflow = "hidden";
    return (
      <div
        class="fixed inset-0 z-300 flex flex-col justify-end"
        role="dialog"
        aria-modal="true"
        aria-label="操作列表"
      >
        <div
          class="absolute inset-0 bg-black/50 dark:bg-black/60 transition-opacity"
          onClick={handleMaskClick as unknown as (e: Event) => void}
          aria-hidden
        />
        <div
          class={twMerge(
            "relative z-10 flex flex-col gap-2 px-2 pb-safe max-h-[85vh] overflow-hidden",
            className,
          )}
          onClick={(e: Event) => e.stopPropagation()}
        >
          <div class="rounded-2xl overflow-hidden bg-white dark:bg-slate-800 shadow-xl">
            {title != null && title !== "" && (
              <div class="px-4 py-3 text-center text-sm text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                {title}
              </div>
            )}
            <div class="max-h-[60vh] overflow-auto">
              {actions.map((action, index) => (
                <button
                  key={index}
                  type="button"
                  disabled={action.disabled}
                  class={twMerge(
                    "w-full px-4 py-3 text-left text-base font-medium transition-colors flex items-center gap-3",
                    "border-b border-slate-100 dark:border-slate-700 last:border-b-0",
                    action.disabled &&
                      "opacity-50 cursor-not-allowed text-slate-400 dark:text-slate-500",
                    !action.disabled &&
                      action.danger &&
                      "text-red-600 dark:text-red-400 active:bg-red-50 dark:active:bg-red-950/30",
                    !action.disabled &&
                      !action.danger &&
                      "text-slate-900 dark:text-slate-100 active:bg-slate-100 dark:active:bg-slate-700",
                  )}
                  onClick={() => {
                    if (!action.disabled) {
                      action.onClick?.();
                      onClose?.();
                    }
                  }}
                >
                  {action.icon != null && (
                    <span class="shrink-0 flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5">
                      {action.icon}
                    </span>
                  )}
                  <span class="flex-1 min-w-0">
                    <span>{action.label}</span>
                    {action.description != null && action.description !== "" &&
                      (
                        <div class="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                          {action.description}
                        </div>
                      )}
                  </span>
                </button>
              ))}
            </div>
          </div>
          {cancelText != null && cancelText !== "" && (
            <button
              type="button"
              class="w-full py-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium shadow-xl border-0"
              onClick={() => onClose?.()}
            >
              {cancelText}
            </button>
          )}
        </div>
      </div>
    );
  };
}
