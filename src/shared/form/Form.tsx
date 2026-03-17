/**
 * Form 表单容器（View）。
 * 提供布局（vertical / horizontal / inline）、提交回调；与 FormItem 组合使用。
 */

import { twMerge } from "tailwind-merge";

export type FormLayout = "vertical" | "horizontal" | "inline";

export interface FormProps {
  /** 布局：垂直堆叠 / 水平标签 / 行内 */
  layout?: FormLayout;
  /** 提交回调（阻止默认提交，由调用方处理） */
  onSubmit?: (e: Event) => void;
  /** 额外 class（作用于 form） */
  class?: string;
  /** 表单项等子节点 */
  children?: unknown;
}

const layoutClasses: Record<FormLayout, string> = {
  vertical: "flex flex-col gap-4",
  horizontal: "flex flex-col gap-4 md:flex-row md:flex-wrap md:items-start",
  inline: "flex flex-wrap items-end gap-x-4 gap-y-2",
};

/**
 * 返回 getter，使 View 为 Form 创建带 data-view-dynamic 的容器；
 * patch 时复用容器、只更新内容，避免子组件（如 Password）被整棵替换导致失焦。
 */
export function Form(props: FormProps) {
  return () => {
    const { layout = "vertical", onSubmit, class: className, children } = props;
    const layoutCls = layoutClasses[layout];
    return (
      <form
        class={twMerge(layoutCls, className)}
        onSubmit={(e: Event) => {
          e.preventDefault();
          onSubmit?.(e);
        }}
      >
        {children}
      </form>
    );
  };
}
