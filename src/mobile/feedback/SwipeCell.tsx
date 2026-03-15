/**
 * SwipeCell 滑动单元格（View）。
 * 移动端列表项左/右滑露出操作按钮（删除、更多等）；支持左右两侧、自定义宽度与样式。
 */

import { twMerge } from "tailwind-merge";

/** 单侧的一个操作项 */
export interface SwipeCellAction {
  /** 按钮文案 */
  text: string;
  /** 点击回调 */
  onClick?: () => void;
  /** 按钮样式：default 灰、primary 蓝、danger 红 */
  style?: "default" | "primary" | "danger";
  /** 自定义 class 覆盖 */
  class?: string;
}

export interface SwipeCellProps {
  /** 左侧操作列（从左向右滑露出） */
  leftActions?: SwipeCellAction[];
  /** 右侧操作列（从右向左滑露出） */
  rightActions?: SwipeCellAction[];
  /** 单元格主内容 */
  children?: unknown;
  /** 是否禁用滑动 */
  disabled?: boolean;
  /** 单侧操作按钮宽度（px），默认 64 */
  actionWidth?: number;
  /** 打开时回调（当前为 left | right） */
  onOpen?: (side: "left" | "right") => void;
  /** 关闭时回调 */
  onClose?: () => void;
  /** 额外 class（作用于最外层） */
  class?: string;
}

const ACTION_STYLE_CLASSES: Record<"default" | "primary" | "danger", string> = {
  default:
    "bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 active:bg-slate-300 dark:active:bg-slate-500",
  primary:
    "bg-blue-500 text-white active:bg-blue-600 dark:bg-blue-600 dark:active:bg-blue-700",
  danger:
    "bg-red-500 text-white active:bg-red-600 dark:bg-red-600 dark:active:bg-red-700",
};

const ACTION_WIDTH = 64;

export function SwipeCell(props: SwipeCellProps) {
  const {
    leftActions = [],
    rightActions = [],
    children,
    disabled = false,
    actionWidth = ACTION_WIDTH,
    onOpen,
    onClose,
    class: className,
  } = props;

  const leftWidth = leftActions.length * actionWidth;
  const rightWidth = rightActions.length * actionWidth;

  const refs: {
    inner: HTMLDivElement | null;
    startX: number;
    currentX: number;
    offset: number;
  } = {
    inner: null,
    startX: 0,
    currentX: 0,
    offset: 0,
  };

  /** 基准：中间内容可见时 inner 的 translateX 为 -leftWidth */
  const getTransformX = (offset: number) => -leftWidth + offset;

  const setInnerRef = (el: unknown) => {
    refs.inner = el as HTMLDivElement | null;
    if (refs.inner) {
      refs.inner.style.transform = `translateX(${getTransformX(0)}px)`;
    }
  };

  const applyTransform = (offset: number) => {
    if (!refs.inner) return;
    refs.inner.style.transform = `translateX(${getTransformX(offset)}px)`;
  };

  const snap = () => {
    if (!refs.inner) return;
    const x = refs.offset;
    const threshold = actionWidth * 0.3;
    let target = 0;
    if (x > threshold && leftWidth > 0) target = leftWidth;
    else if (x < -threshold && rightWidth > 0) target = -rightWidth;
    refs.offset = target;
    refs.inner.style.transition = "transform 0.2s ease-out";
    applyTransform(target);
    if (target === 0) onClose?.();
    else onOpen?.(target > 0 ? "left" : "right");
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled) return;
    refs.startX = e.touches[0].clientX;
    refs.currentX = refs.startX;
    if (refs.inner) refs.inner.style.transition = "";
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (disabled || !refs.inner) return;
    refs.currentX = e.touches[0].clientX;
    const delta = refs.currentX - refs.startX;
    let next = refs.offset + delta;
    if (next > leftWidth) next = leftWidth + (next - leftWidth) * 0.3;
    if (next < -rightWidth) next = -rightWidth + (next + rightWidth) * 0.3;
    refs.offset = next;
    refs.startX = refs.currentX;
    applyTransform(next);
  };

  const handleTouchEnd = () => {
    if (disabled) return;
    if (refs.inner) refs.inner.style.transition = "transform 0.2s ease-out";
    snap();
  };

  return () => (
    <div
      class={twMerge(
        "swipe-cell overflow-hidden rounded-lg",
        disabled && "pointer-events-none",
        className,
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        ref={setInnerRef}
        class="flex"
        style={{ width: `calc(100% + ${leftWidth + rightWidth}px)` }}
      >
        {leftActions.length > 0 && (
          <div class="flex shrink-0" style={{ width: `${leftWidth}px` }}>
            {leftActions.map((action, i) => (
              <button
                key={i}
                type="button"
                class={twMerge(
                  "flex items-center justify-center text-sm font-medium h-full",
                  ACTION_STYLE_CLASSES[action.style ?? "default"],
                  action.class,
                )}
                style={{ width: `${actionWidth}px` }}
                onClick={() => action.onClick?.()}
              >
                {action.text}
              </button>
            ))}
          </div>
        )}
        <div class="flex-1 min-w-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 border-l-0 border-r-0">
          {children}
        </div>
        {rightActions.length > 0 && (
          <div class="flex shrink-0" style={{ width: `${rightWidth}px` }}>
            {rightActions.map((action, i) => (
              <button
                key={i}
                type="button"
                class={twMerge(
                  "flex items-center justify-center text-sm font-medium h-full",
                  ACTION_STYLE_CLASSES[action.style ?? "default"],
                  action.class,
                )}
                style={{ width: `${actionWidth}px` }}
                onClick={() => action.onClick?.()}
              >
                {action.text}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
