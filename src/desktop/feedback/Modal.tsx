/**
 * Modal 模态弹窗（View）。
 * 桌面居中弹层：遮罩、标题、内容、底部按钮；支持关闭、点击遮罩关闭、Esc、自定义宽度与 footer。
 */

import { twMerge } from "tailwind-merge";
import { IconClose } from "../../shared/basic/icons/mod.ts";

export interface ModalProps {
  /** 是否打开（受控） */
  open?: boolean;
  /** 关闭回调（关闭按钮、遮罩、Esc 触发） */
  onClose?: () => void;
  /** 标题；传 null 或 false 不显示标题栏 */
  title?: string | null;
  /** 弹层内容 */
  children?: unknown;
  /** 底部区域：传 VNode 或 null 不显示；不传时默认无 footer */
  footer?: unknown;
  /** 是否显示右上角关闭按钮，默认 true */
  closable?: boolean;
  /** 点击遮罩是否关闭，默认 true */
  maskClosable?: boolean;
  /** 弹层宽度（CSS，如 "520px"、"80%"），默认 "520px" */
  width?: string | number;
  /** 是否垂直居中，默认 true */
  centered?: boolean;
  /** 关闭后是否销毁子节点（不挂载），默认 false */
  destroyOnClose?: boolean;
  /** 是否支持 Esc 关闭，默认 true */
  keyboard?: boolean;
  /** 遮罩 class */
  maskClass?: string;
  /** 弹层容器 class */
  wrapClass?: string;
  /** 内容区 class */
  bodyClass?: string;
  /** 额外 class（作用于弹层盒子） */
  class?: string;
}

const defaultWidth = "520px";

export function Modal(props: ModalProps) {
  const {
    open = false,
    onClose,
    title,
    children,
    footer = null,
    closable = true,
    maskClosable = true,
    width = defaultWidth,
    centered = true,
    destroyOnClose = false,
    keyboard = true,
    maskClass,
    wrapClass,
    bodyClass,
    class: className,
  } = props;

  const handleMaskClick = (e: Event) => {
    if (e.target === e.currentTarget && maskClosable) onClose?.();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (keyboard && e.key === "Escape") onClose?.();
  };

  const shouldRender = open || !destroyOnClose;
  if (!shouldRender) return () => null;

  return () => {
    const g = globalThis as unknown as { document?: Document };
    if (!open) {
      if (g.document?.body) g.document.body.style.overflow = "";
      return null;
    }
    if (g.document?.body) g.document.body.style.overflow = "hidden";
    const widthStyle = typeof width === "number" ? `${width}px` : width;
    return (
      <div
        class={twMerge(
          "fixed inset-0 z-300 flex",
          centered
            ? "items-center justify-center"
            : "items-start justify-center pt-16",
          wrapClass,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        tabindex={-1}
        onKeyDown={handleKeyDown as unknown as (e: Event) => void}
      >
        {/* 遮罩 */}
        <div
          class={twMerge(
            "absolute inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm transition-opacity",
            maskClass,
          )}
          onClick={handleMaskClick as unknown as (e: Event) => void}
          aria-hidden
        />
        {/* 弹层 */}
        <div
          class={twMerge(
            "relative z-10 flex flex-col max-h-[90vh] rounded-xl shadow-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100",
            className,
          )}
          style={{ width: widthStyle }}
          onClick={(e: Event) => e.stopPropagation()}
        >
          {(title != null && title !== "")
            ? (
              <div class="flex items-center justify-between shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-600">
                <h2 id="modal-title" class="text-lg font-semibold">
                  {title}
                </h2>
                {closable && (
                  <button
                    type="button"
                    aria-label="关闭"
                    class="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                    onClick={() => onClose?.()}
                  >
                    <IconClose class="w-5 h-5" />
                  </button>
                )}
              </div>
            )
            : closable
            ? (
              <div class="absolute top-4 right-4 z-10">
                <button
                  type="button"
                  aria-label="关闭"
                  class="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                  onClick={() => onClose?.()}
                >
                  <IconClose class="w-5 h-5" />
                </button>
              </div>
            )
            : null}
          <div
            class={twMerge(
              "flex-1 overflow-auto px-6 py-4 min-h-0",
              !(title != null && title !== "") && closable && "pt-12 pr-12",
              bodyClass,
            )}
          >
            {children}
          </div>
          {footer != null && (
            <div class="shrink-0 flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 dark:border-slate-600">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  };
}
