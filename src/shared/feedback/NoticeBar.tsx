/**
 * NoticeBar 通知栏（View）。
 * 顶部／块级提示条：信息／成功／警告／危险；可关闭、可滚动长文案。
 *
 * 关闭态：内部 `closed` Signal + 子树 thunk 订阅（setup 经 jsx `untrack`）。
 */

import { createSignal, type JSXRenderable } from "@dreamer/view";
import { twMerge } from "tailwind-merge";

export type NoticeBarTone = "info" | "success" | "warning" | "danger";

export interface NoticeBarMessages {
  /** 关闭按钮 aria-label */
  close: string;
}

export const defaultNoticeBarMessages: NoticeBarMessages = {
  close: "关闭",
};

export interface NoticeBarProps {
  /** 文案；也可传自定义节点 */
  content?: unknown;
  /** 子节点（与 content 二选一，children 优先） */
  children?: unknown;
  /** 色调 */
  tone?: NoticeBarTone;
  /** 左侧图标／前缀 */
  icon?: unknown;
  /** 是否可关闭 */
  closable?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
  /**
   * 受控可见；传入时优先于内部关闭态（`false` 隐藏）。
   * 未传则点 × 用内部 Signal 隐藏。
   */
  visible?: boolean;
  /** 整条点击 */
  onClick?: () => void;
  /** 长文案横向滚动（CSS 动画；遵循 reduced-motion） */
  scrollable?: boolean;
  /** 额外 class */
  class?: string;
  messages?: Partial<NoticeBarMessages>;
}

const toneCls: Record<NoticeBarTone, string> = {
  info:
    "bg-sky-50 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200 border-sky-200/80 dark:border-sky-800",
  success:
    "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 border-emerald-200/80 dark:border-emerald-800",
  warning:
    "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100 border-amber-200/80 dark:border-amber-800",
  danger:
    "bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-200 border-red-200/80 dark:border-red-800",
};

export function NoticeBar(props: NoticeBarProps): JSXRenderable {
  const {
    content,
    children,
    tone = "info",
    icon,
    closable = false,
    onClose,
    onClick,
    scrollable = false,
    class: className,
  } = props;
  const m = { ...defaultNoticeBarMessages, ...(props.messages ?? {}) };
  const closed = createSignal(false);

  return (
    <div class="contents" data-dreamer-notice-bar-host="">
      {() => {
        if (props.visible === false) return null;
        if (props.visible === undefined && closed.value) return null;
        const body = children ?? content;
        return (
          <div
            class={twMerge(
              "notice-bar flex items-center gap-2 px-3 py-2 text-sm border",
              toneCls[tone],
              onClick && "cursor-pointer",
              className,
            )}
            role="status"
            data-dreamer-notice-bar=""
            onClick={() => onClick?.()}
          >
            {icon != null && <span class="shrink-0 inline-flex">{icon}</span>}
            <div
              class={twMerge(
                "min-w-0 flex-1",
                scrollable &&
                  "overflow-hidden whitespace-nowrap [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]",
              )}
            >
              <div
                class={twMerge(
                  scrollable &&
                    "inline-block animate-notice-bar-marquee motion-reduce:animate-none pr-8",
                )}
              >
                {body}
              </div>
            </div>
            {closable && (
              <button
                type="button"
                class="shrink-0 rounded p-0.5 hover:bg-black/5 dark:hover:bg-white/10"
                aria-label={m.close}
                data-dreamer-notice-bar-close=""
                onClick={(e: Event) => {
                  e.stopPropagation();
                  if (props.visible === undefined) {
                    closed.set(true);
                  }
                  onClose?.();
                }}
              >
                ×
              </button>
            )}
          </div>
        );
      }}
    </div>
  );
}
