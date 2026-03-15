/**
 * BottomSheet 底部抽屉/半屏（View）。
 * 移动端典型：从底部滑出面板；支持标题、高度（自动/半屏/全屏）、关闭。
 */

import { twMerge } from "tailwind-merge";
import { IconClose } from "../../shared/basic/icons/mod.ts";

export type BottomSheetHeight = "auto" | "half" | "full";

export interface BottomSheetProps {
  /** 是否打开（受控） */
  open?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
  /** 标题；传 null 不显示 */
  title?: string | null;
  /** 面板内容 */
  children?: unknown;
  /** 高度模式：自动（由内容撑开）、半屏、全屏，默认 "auto" */
  height?: BottomSheetHeight;
  /** 是否显示关闭按钮，默认 true */
  closable?: boolean;
  /** 点击遮罩是否关闭，默认 true */
  maskClosable?: boolean;
  /** 关闭后是否销毁子节点，默认 false */
  destroyOnClose?: boolean;
  /** 底部区域（如按钮组）；渲染在内容下方 */
  footer?: unknown;
  /** 进入动画时长（ms），默认 250 */
  animationDuration?: number;
  /** 额外 class（作用于面板） */
  class?: string;
}

const heightClasses: Record<BottomSheetHeight, string> = {
  auto: "max-h-[85vh]",
  half: "h-1/2 max-h-[85vh]",
  full: "h-[85vh]",
};

export function BottomSheet(props: BottomSheetProps) {
  const {
    open = false,
    onClose,
    title,
    children,
    height = "auto",
    closable = true,
    maskClosable = true,
    destroyOnClose = false,
    footer,
    animationDuration = 250,
    class: className,
  } = props;

  const shouldRender = open || !destroyOnClose;
  if (!shouldRender) return () => null;

  const handleMaskClick = (e: Event) => {
    if (e.target === e.currentTarget && maskClosable) onClose?.();
  };

  /** 面板挂载时执行进入动画，避免 JSX 内联 ref 中的类型断言导致解析错误 */
  const setSheetRef = (el: unknown) => {
    const div = el as HTMLDivElement | null;
    if (!div) return;
    const elWithFlag = div as HTMLDivElement & { _sheetAnimated?: boolean };
    if (elWithFlag._sheetAnimated) return;
    elWithFlag._sheetAnimated = true;
    div.style.transition = `transform ${animationDuration}ms ease-out`;
    div.style.transform = "translateY(100%)";
    const raf = (globalThis as unknown as {
      requestAnimationFrame?: (cb: () => void) => number;
    })
      .requestAnimationFrame;
    if (raf) {
      raf(() => {
        div.style.transform = "translateY(0)";
      });
    } else div.style.transform = "translateY(0)";
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
        aria-labelledby={title ? "bottomsheet-title" : undefined}
      >
        <div
          class="absolute inset-0 bg-black/50 dark:bg-black/60 transition-opacity"
          onClick={(e: Event) => handleMaskClick(e)}
          aria-hidden
        />
        <div
          ref={setSheetRef}
          class={twMerge(
            "relative z-10 flex flex-col rounded-t-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xl overflow-hidden",
            heightClasses[height],
            className,
          )}
          onClick={(e: Event) => e.stopPropagation()}
        >
          {/* 拖拽指示条（移动端常见） */}
          <div class="shrink-0 flex justify-center pt-2 pb-1">
            <span class="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
          </div>
          {title != null && title !== "" && (
            <div class="flex items-center justify-between shrink-0 px-4 pb-3">
              <h2 id="bottomsheet-title" class="text-lg font-semibold">
                {title}
              </h2>
              {closable && (
                <button
                  type="button"
                  aria-label="关闭"
                  class="p-2 -m-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                  onClick={() => onClose?.()}
                >
                  <IconClose class="w-5 h-5" />
                </button>
              )}
            </div>
          )}
          {title == null && closable && (
            <div class="absolute top-3 right-3 z-10">
              <button
                type="button"
                aria-label="关闭"
                class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                onClick={() => onClose?.()}
              >
                <IconClose class="w-5 h-5" />
              </button>
            </div>
          )}
          <div class="flex-1 overflow-auto min-h-0 px-4 pb-6">{children}</div>
          {footer != null && (
            <div class="shrink-0 border-t border-slate-200 dark:border-slate-600 px-4 py-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  };
}
