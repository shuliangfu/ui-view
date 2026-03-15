/**
 * Drawer 侧边抽屉（View）。
 * 左/右拉出面板；支持标题、底部、关闭、遮罩关闭、Esc、自定义宽度。
 */

import { twMerge } from "tailwind-merge";
import { IconClose } from "../basic/icons/mod.ts";

export type DrawerPlacement = "left" | "right";

export interface DrawerProps {
  /** 是否打开（受控） */
  open?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
  /** 从左侧或右侧滑出，默认 "right" */
  placement?: DrawerPlacement;
  /** 抽屉宽度（CSS），默认 "360px" */
  width?: string | number;
  /** 标题；传 null 不显示标题栏 */
  title?: string | null;
  /** 抽屉内容 */
  children?: unknown;
  /** 底部区域（如按钮组）；传 null 不显示 */
  footer?: unknown;
  /** 是否显示关闭按钮，默认 true */
  closable?: boolean;
  /** 点击遮罩是否关闭，默认 true */
  maskClosable?: boolean;
  /** 关闭后是否销毁子节点，默认 false */
  destroyOnClose?: boolean;
  /** 是否支持 Esc 关闭，默认 true */
  keyboard?: boolean;
  /** 额外 class（作用于抽屉面板） */
  class?: string;
}

const defaultWidth = "360px";

export function Drawer(props: DrawerProps) {
  const {
    open = false,
    onClose,
    placement = "right",
    width = defaultWidth,
    title,
    children,
    footer = null,
    closable = true,
    maskClosable = true,
    destroyOnClose = false,
    keyboard = true,
    class: className,
  } = props;

  const shouldRender = open || !destroyOnClose;
  if (!shouldRender) return () => null;

  const handleMaskClick = (e: Event) => {
    if (e.target === e.currentTarget && maskClosable) onClose?.();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (keyboard && e.key === "Escape") onClose?.();
  };

  const widthStyle = typeof width === "number" ? `${width}px` : width;
  const isLeft = placement === "left";

  const setDrawerRef = (el: unknown) => {
    const div = el as HTMLDivElement | null;
    if (!div) return;
    const elWithFlag = div as HTMLDivElement & { _drawerAnimated?: boolean };
    if (elWithFlag._drawerAnimated) return;
    elWithFlag._drawerAnimated = true;
    div.style.transition = "transform 0.2s ease-out";
    div.style.transform = isLeft ? "translateX(-100%)" : "translateX(100%)";
    const raf = (globalThis as unknown as {
      requestAnimationFrame?: (cb: () => void) => number;
    }).requestAnimationFrame;
    if (raf) {
      raf(() => {
        div.style.transform = "translateX(0)";
      });
    } else div.style.transform = "translateX(0)";
  };

  return () => {
    if (!open) {
      document.body.style.overflow = "";
      return null;
    }
    document.body.style.overflow = "hidden";
    return (
      <div
        class="fixed inset-0 z-300 flex"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "drawer-title" : undefined}
        tabindex={-1}
        onKeyDown={(e: Event) => handleKeyDown(e as KeyboardEvent)}
      >
        <div
          class={twMerge(
            "absolute inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm transition-opacity",
          )}
          onClick={(e: Event) => handleMaskClick(e)}
          aria-hidden
        />
        <div
          ref={setDrawerRef}
          class={twMerge(
            "relative z-10 flex flex-col h-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xl",
            isLeft ? "ml-0" : "ml-auto",
            className,
          )}
          style={{
            width: widthStyle,
            maxWidth: "100vw",
          }}
          onClick={(e: Event) => e.stopPropagation()}
        >
          {title != null && title !== "" && (
            <div class="flex items-center justify-between shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-600">
              <h2 id="drawer-title" class="text-lg font-semibold">
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
          )}
          {title == null && closable && (
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
          )}
          <div class="flex-1 overflow-auto min-h-0 px-6 py-4">{children}</div>
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
