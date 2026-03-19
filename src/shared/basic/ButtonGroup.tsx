/**
 * ButtonGroup 按钮组（View）。
 * 将多个按钮或操作项横向排列，支持紧凑（attached）样式。
 */

import { twMerge } from "tailwind-merge";

export interface ButtonGroupProps {
  /** 是否紧凑相连（默认 true：中间无间隙、仅首尾圆角；false 时保留间距） */
  attached?: boolean;
  /** 额外 class */
  class?: string;
  /** 子节点（通常为多个 Button） */
  children?: unknown;
}

const ATTACHED_GROUP_CLASS = "dreamer-btn-group-attached";

/**
 * 按钮组容器，用于将多个按钮横向排列为一组。
 * 默认紧凑相连（中间无间距、仅首尾圆角）；attached=false 时保留间距。
 * 使用内联 style 覆盖子按钮圆角，避免被 Tailwind 类顺序覆盖。
 */
export function ButtonGroup(props: ButtonGroupProps) {
  const { attached = true, class: className, children } = props;
  const base = "inline-flex items-center";
  const layout = attached ? "gap-0" : "gap-2";
  const groupClass = attached ? ATTACHED_GROUP_CLASS : "";
  return (
    <>
      {attached && (
        <style>
          {`.${ATTACHED_GROUP_CLASS} > *:first-child {
            border-top-right-radius: 0 !important;
            border-bottom-right-radius: 0 !important;
          }
          .${ATTACHED_GROUP_CLASS} > *:last-child {
            border-top-left-radius: 0 !important;
            border-bottom-left-radius: 0 !important;
          }
          .${ATTACHED_GROUP_CLASS} > *:not(:first-child):not(:last-child) {
            border-radius: 0 !important;
          }
          .${ATTACHED_GROUP_CLASS} > *:not(:last-child) {
            border-right-width: 0 !important;
          }
          /* 焦点环贴边显示（inset），不向外偏移；仅画在外侧边，不破坏组结构 */
          .${ATTACHED_GROUP_CLASS} > *:first-child:focus {
            outline: none !important;
            box-shadow: inset 2px 0 0 0 #3b82f6, inset 0 2px 0 0 #3b82f6, inset 0 -2px 0 0 #3b82f6 !important;
          }
          .${ATTACHED_GROUP_CLASS} > *:last-child:focus {
            outline: none !important;
            box-shadow: inset -2px 0 0 0 #3b82f6, inset 0 2px 0 0 #3b82f6, inset 0 -2px 0 0 #3b82f6 !important;
          }
          .${ATTACHED_GROUP_CLASS} > *:not(:first-child):not(:last-child):focus {
            outline: none !important;
            box-shadow: inset 0 2px 0 0 #3b82f6, inset 0 -2px 0 0 #3b82f6 !important;
          }`}
        </style>
      )}
      <div
        class={twMerge(base, layout, groupClass, className)}
        role="group"
      >
        {children}
      </div>
    </>
  );
}
