/**
 * FormItem 表单项包装（View）。
 * 提供标签、必填星号、错误提示；支持标签在上方或左侧，左侧时可左对齐/右对齐。
 * 可配合 Form 使用，将 error/required 通过 class 影响子控件样式。
 */

import { twMerge } from "tailwind-merge";

/** 标签位置：上方（默认）或左侧 */
export type FormItemLabelPosition = "top" | "left";

/** 标签对齐（仅 labelPosition=left 时有效）：左对齐或右对齐 */
export type FormItemLabelAlign = "left" | "right";

export interface FormItemProps {
  /** 表单项标签 */
  label?: string;
  /** 是否必填（显示 *） */
  required?: boolean;
  /** 错误文案（展示在下方并给容器加 error 样式） */
  error?: string;
  /** 标签位置：上方 或 左侧 */
  labelPosition?: FormItemLabelPosition;
  /** 标签对齐（仅当 labelPosition=left 时有效）：左对齐 / 右对齐 */
  labelAlign?: FormItemLabelAlign;
  /** 额外 class（作用于容器） */
  class?: string;
  /** 关联控件的 id（label for、子控件需同 id） */
  id?: string;
  /** 子控件（单个输入组件等） */
  children?: unknown;
}

const labelBaseCls = "text-sm font-medium text-slate-700 dark:text-slate-300";
const labelTopCls = "block mb-1";
/** 标签在左侧：固定列宽便于多行对齐，垂直居中与输入框齐平 */
const labelLeftCls = "shrink-0 w-28 min-w-[7rem]";
const labelAlignLeftCls = "text-left";
const labelAlignRightCls = "text-right";
const requiredCls = "text-red-500 dark:text-red-400 ml-0.5";
const errorCls = "mt-1 text-sm text-red-600 dark:text-red-400";

export function FormItem(props: FormItemProps) {
  const {
    label,
    required = false,
    error,
    labelPosition = "top",
    labelAlign = "left",
    class: className,
    id,
    children,
  } = props;
  const hasError = Boolean(error);
  const isLeft = labelPosition === "left";

  const labelEl = label != null
    ? (
      <label
        for={id}
        class={twMerge(
          labelBaseCls,
          isLeft
            ? twMerge(
              labelLeftCls,
              labelAlign === "right" ? labelAlignRightCls : labelAlignLeftCls,
            )
            : labelTopCls,
        )}
      >
        {label}
        {required && <span class={requiredCls} aria-hidden="true">*</span>}
      </label>
    )
    : null;

  return () => (
    <div
      class={twMerge(
        "flex flex-col my-3",
        hasError &&
          "[&_input]:border-red-500 [&_textarea]:border-red-500 dark:[&_input]:border-red-500 dark:[&_textarea]:border-red-500",
        className,
      )}
      role={hasError ? "alert" : undefined}
    >
      {isLeft && labelEl != null
        ? (
          <div class="flex flex-row items-center gap-4 py-0.5">
            {labelEl}
            <div class="form-item-input min-w-0 flex-1">{children}</div>
          </div>
        )
        : (
          <>
            {labelEl}
            <div class="form-item-input">{children}</div>
          </>
        )}
      {error != null && error !== "" && (
        <div class={errorCls} id={id ? `${id}-error` : undefined}>
          {error}
        </div>
      )}
    </div>
  );
}
