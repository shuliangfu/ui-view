/**
 * FormItem 表单项包装（View）。
 * 提供标签、必填星号（可单独关闭显示）、错误提示；支持标签在上方、左侧，或描边内嵌（字坐在控件边框左上缺口里）。左侧时可左对齐/右对齐。
 * 可配合 Form 使用，将 error/required 通过 class 影响子控件样式。
 *
 * 与 {@link createForm} 联用时：传 `name`（及可选 `rules`）自动注册字段、展示 store 中的错误文案；
 * 控件值仍用 `form.bind(name)` 绑定（不克隆 children）。
 */

import {
  createRenderEffect,
  getOwner,
  type JSXRenderable,
} from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import type { FormFieldMeta } from "./create-form.ts";
import { useFormStore } from "./form-context.ts";
import type { FormRule, FormValidateTrigger } from "./form-rules.ts";
import {
  FormItemControlIdContext,
  resolveFormItemControlId,
} from "./form-item-control-id.ts";
import { FormItemOutlineLabelContext } from "./outlined-field.tsx";

/** 标签位置：上方（默认）、左侧，或描边内嵌（字在边框左上缺口，无线穿过） */
export type FormItemLabelPosition = "top" | "left" | "outline";

/** 标签对齐（仅 labelPosition=left 时有效）：左对齐或右对齐 */
export type FormItemLabelAlign = "left" | "right";

export interface FormItemProps {
  /**
   * 字段名：有值且祖先 Form 注入了 store 时，注册字段并展示 `form.errors[name]`。
   * 显式 `error` prop 优先于 store。
   */
  name?: string;
  /** 校验规则（写入 store；与 createForm `fields` 合并，本处优先） */
  rules?: FormRule[];
  /** 本字段校验触发；默认跟随 createForm / 全局 */
  validateTrigger?: FormValidateTrigger | FormValidateTrigger[];
  /** 表单项标签 */
  label?: string;
  /** 是否必填（默认会显示红色 *；若只想语义必填、不显示星号，见 `hideRequiredMark`） */
  required?: boolean;
  /**
   * 为 true 时不渲染标签旁的红色 *，即使 `required` 为 true。
   * 适用于：仍传 `required` 给子控件或业务校验，但标签上不抢视觉。
   */
  hideRequiredMark?: boolean;
  /** 错误文案（展示在下方并给容器加 error 样式）；优先于 store 错误 */
  error?: string;
  /**
   * 标签位置：上方、左侧，或描边内嵌。
   * `outline` 不渲染外部标签，把文案交给子控件（Input / Password / Textarea）做成边框左上缺口内的浮动标签。
   */
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
/** 标签在左侧：固定列宽；justify 控制文字+* 在列内左/右贴齐 */
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
/** 有错误时给子 input/textarea/fieldset 加红框（挂在容器 class 上） */
const errorBorderCls =
  "[&:not(:has(fieldset))_input]:border-red-500 [&:not(:has(fieldset))_textarea]:border-red-500 dark:[&:not(:has(fieldset))_input]:border-red-500 dark:[&:not(:has(fieldset))_textarea]:border-red-500 [&_fieldset]:border-red-500 dark:[&_fieldset]:border-red-500";

/**
 * 表单项：setup 在组件边界 `untrack` 下只跑一次，children 稳定挂载。
 * `form.errors` 仅通过下方独立 getter / `createRenderEffect` 订阅，避免校验时整项
 * `cleanNode` 重挂载 Cascader 等浮层控件（关面板、失焦）。
 */
export function FormItem(props: FormItemProps): JSXRenderable {
  /** 与 `jsx` 中本组件 `Owner` 一致，用于在多次渲染间复用自动生成的 `controlId` */
  const formItemOwner = getOwner();

  const {
    name,
    rules,
    validateTrigger,
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

  const formStore = useFormStore();
  if (formStore && name) {
    const meta: FormFieldMeta = {};
    if (rules) meta.rules = rules;
    if (validateTrigger) meta.validateTrigger = validateTrigger;
    formStore.registerField(name, meta);
  }

  const fromRulesRequired = formStore && name
    ? formStore.isFieldRequired(name)
    : false;
  const resolvedRequired = required || fromRulesRequired;
  const controlId = resolveFormItemControlId(formItemOwner, id);
  const isLeft = labelPosition === "left";
  const hasTrailing = trailing != null && trailing !== false;
  const showRequiredAsterisk = resolvedRequired && !hideRequiredMark;
  const isOutline = labelPosition === "outline";

  /**
   * 解析当前错误文案（显式 `error` 优先于 store）。
   * 仅在错误相关的细粒度 effect / getter 内调用。
   */
  const readResolvedError = (): string | undefined => {
    const storeError = formStore && name
      ? formStore.errors.value[name]
      : undefined;
    return error != null && error !== "" ? error : storeError;
  };

  const labelEl = label != null && !isOutline
    ? (
      <label
        for={controlId}
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
  const outlineValue = isOutline && label != null
    ? { label, requiredMark: showRequiredAsterisk }
    : undefined;

  const controlRow = (
    <div
      class={twMerge(
        "flex min-w-0 flex-row flex-wrap items-center gap-1.5",
        isLeft
          ? (hasTrailing ? "max-w-md flex-1" : "flex-1")
          : (hasTrailing ? "w-full max-w-md" : undefined),
      )}
    >
      <div class="form-item-input min-w-0 flex-1">{children}</div>
      {hasTrailing && <div class="form-item-trailing shrink-0">{trailing}</div>}
    </div>
  );

  /** 容器：静态 class；错误红框 / role 由 ref 上的 renderEffect 同步，不触发整项重挂载 */
  const baseClass = twMerge("flex flex-col my-3", className);

  return (
    <FormItemControlIdContext.Provider value={controlId}>
      <FormItemOutlineLabelContext.Provider value={outlineValue}>
        <div
          class={baseClass}
          data-form-item-name={name}
          ref={(el: HTMLDivElement | null) => {
            if (!el) return;
            createRenderEffect(() => {
              const hasErr = !!readResolvedError();
              el.className = twMerge(baseClass, hasErr && errorBorderCls);
              if (hasErr) el.setAttribute("role", "alert");
              else el.removeAttribute("role");
            });
          }}
        >
          {isLeft && labelEl != null
            ? (
              <div class="flex flex-row items-center gap-4 py-0.5 min-w-0">
                {labelEl}
                {controlRow}
              </div>
            )
            : (
              <>
                {labelEl}
                {controlRow}
              </>
            )}
          {() => {
            const resolvedError = readResolvedError();
            if (resolvedError == null || resolvedError === "") return null;
            return (
              <div class={errorCls} id={`${controlId}-error`}>
                {resolvedError}
              </div>
            );
          }}
        </div>
      </FormItemOutlineLabelContext.Provider>
    </FormItemControlIdContext.Provider>
  );
}
