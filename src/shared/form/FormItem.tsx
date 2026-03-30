/**
 * FormItem 表单项包装（View）。
 * 提供标签、必填星号（可单独关闭显示）、错误提示；支持标签在上方或左侧，左侧时可左对齐/右对齐。
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
  /** 是否必填（默认会显示红色 *；若只想语义必填、不显示星号，见 `hideRequiredMark`） */
  required?: boolean;
  /**
   * 为 true 时不渲染标签旁的红色 *，即使 `required` 为 true。
   * 适用于：仍传 `required` 给子控件或业务校验，但标签上不抢视觉。
   */
  hideRequiredMark?: boolean;
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
  /**
   * 与主控件同一行、排在输入区域右侧（如 FormList 的「删除」）。
   * 使用 `flex` + `items-center`，与输入框占同一水平线，避免删除挂在整块表单项外侧导致上下错位。
   */
  trailing?: unknown;
  /** 子控件（单个输入组件等） */
  children?: unknown;
}

/** text-sm + leading-5 与下方星号容器 h-5 一致，避免行高不一致导致对齐飘移 */
const labelBaseCls =
  "text-sm font-medium leading-5 text-slate-700 dark:text-slate-300";
/** 标签在上方：横向 flex，交叉轴居中，* 与「必填」等字垂直对齐 */
const labelTopCls = "mb-1 flex items-center gap-1";
/** 标签在左侧：固定列宽；justify 控制标签+* 在列内左/右贴齐 */
const labelLeftCls = "flex w-28 min-w-[7rem] shrink-0 items-center gap-1";
const labelAlignLeftCls = "justify-start";
const labelAlignRightCls = "justify-end";
/** 标签文案：与星号同一条 flex 行、统一行高 */
const labelTextCls = "shrink-0 leading-5";
/**
 * 星号外层：高度等于 text-sm 默认行高（h-5），内部 flex 垂直居中；
 * 星号字形在多数字体里偏上，内层略下移（top）贴合汉字视觉中线。
 */
const requiredOuterCls =
  "inline-flex h-5 shrink-0 items-center justify-center text-red-500 dark:text-red-400";
const requiredMarkCls = "relative top-[0.1em] text-sm font-medium leading-none";
const errorCls = "mt-1 text-sm text-red-600 dark:text-red-400";

/**
 * 返回渲染 getter，使 View 为 FormItem 创建带 data-view-dynamic 的容器；
 * patch 时复用容器、只更新内容，避免子组件（如 Password）被整棵替换导致失焦。
 */
export function FormItem(props: FormItemProps) {
  return () => {
    const {
      label,
      required = false,
      hideRequiredMark = false,
      error,
      labelPosition = "top",
      labelAlign = "left",
      class: className,
      id,
      trailing,
      children,
    } = props;
    const hasError = Boolean(error);
    const isLeft = labelPosition === "left";
    /** 有 trailing 时控件行限制宽度，避免 flex-1 撑满整行导致删除被甩到视口最右侧 */
    const hasTrailing = trailing != null && trailing !== false;
    /** 是否绘制必填星号：必填且未显式隐藏 */
    const showRequiredAsterisk = required && !hideRequiredMark;

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
          <span class={labelTextCls}>{label}</span>
          {showRequiredAsterisk && (
            <span class={requiredOuterCls} aria-hidden="true">
              <span class={requiredMarkCls}>*</span>
            </span>
          )}
        </label>
      )
      : null;

    return (
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
            <div class="flex flex-row items-center gap-4 py-0.5 min-w-0">
              {labelEl}
              <div
                class={twMerge(
                  "flex min-w-0 flex-row flex-wrap items-center gap-1.5",
                  hasTrailing ? "max-w-md flex-1" : "flex-1",
                )}
              >
                <div class="form-item-input min-w-0 flex-1">{children}</div>
                {hasTrailing && (
                  <div class="form-item-trailing shrink-0">{trailing}</div>
                )}
              </div>
            </div>
          )
          : (
            <>
              {labelEl}
              <div
                class={twMerge(
                  "flex min-w-0 flex-row flex-wrap items-center gap-1.5",
                  hasTrailing && "w-full max-w-md",
                )}
              >
                <div class="form-item-input min-w-0 flex-1">{children}</div>
                {hasTrailing && (
                  <div class="form-item-trailing shrink-0">{trailing}</div>
                )}
              </div>
            </>
          )}
        {error != null && error !== "" && (
          <div class={errorCls} id={id ? `${id}-error` : undefined}>
            {error}
          </div>
        )}
      </div>
    );
  };
}
