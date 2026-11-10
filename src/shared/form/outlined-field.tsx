/**
 * 描边内嵌标签：用 fieldset/legend 在边框左上开真缺口（线从字两边断开，不靠底色遮挡）。
 * 空且未聚焦时文字在框内；聚焦或有值后上到边框。供 Input / Password / Textarea 使用。
 */

import { createContext, type Context, type JSXRenderable, useContext } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import type { SizeVariant } from "../types.ts";
import { controlErrorBorder } from "./input-focus-ring.ts";

/** FormItem `labelPosition="outline"` 时下传给子控件的描边标签 */
export interface FormItemOutlineLabel {
  label: string;
  requiredMark: boolean;
}

/**
 * 仅当 FormItem 为描边内嵌标签时有值；子控件用 {@link resolveOutlinedLabel} 读取。
 */
export const FormItemOutlineLabelContext: Context<
  FormItemOutlineLabel | undefined
> = createContext<FormItemOutlineLabel | undefined>(undefined);

/** 内嵌控件去掉自身边框与 ring，改由 {@link OutlinedField} 的 fieldset 承担 */
export const outlinedControlClass =
  "border-0 bg-transparent dark:bg-transparent shadow-none focus:ring-0 focus:border-transparent";

const fieldRounded: Record<SizeVariant, string> = {
  xs: "rounded-md",
  sm: "rounded-md",
  md: "rounded-lg",
  lg: "rounded-lg",
};

const innerPadX: Record<SizeVariant, string> = {
  xs: "left-2.5",
  sm: "left-3",
  md: "left-3",
  lg: "left-4",
};

const innerText: Record<SizeVariant, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-sm",
  lg: "text-base",
};

/**
 * 浮动／缺口样式用原生 CSS（fieldset:has），避免依赖 Tailwind 扫描新文件或解析 :not() 任意变体。
 * 只注入一次，不按实例重复插 style。
 */
const OUTLINED_FIELD_CSS = `.ui-outlined{min-inline-size:0}` +
  `.ui-outlined:focus-within{border-color:rgb(59 130 246)}` +
  `.dark .ui-outlined:focus-within{border-color:rgb(96 165 250)}` +
  `.ui-outlined:focus-within>legend{color:rgb(37 99 235)}` +
  `.dark .ui-outlined:focus-within>legend{color:rgb(147 197 253)}` +
  `.ui-outlined.ui-outlined-error,.ui-outlined.ui-outlined-error:focus-within{border-color:rgb(239 68 68)}` +
  `.ui-outlined.ui-outlined-error:focus-within>legend{color:rgb(239 68 68)}` +

  `.ui-outlined>legend{margin-inline-start:10px;max-width:0;padding:0;opacity:0;overflow:hidden;white-space:nowrap;` +
  `transition:max-width .2s,padding .2s,opacity .2s}` +
  `.ui-outlined:focus-within>legend,` +
  `.ui-outlined:has(input:not(:placeholder-shown))>legend,` +
  `.ui-outlined:has(textarea:not(:placeholder-shown))>legend` +
  `{max-width:calc(100% - 1rem);padding-inline:2px;opacity:1}` +
  `.ui-outlined>.ui-outlined-inner{transition:opacity .2s}` +
  `.ui-outlined:focus-within>.ui-outlined-inner,` +
  `.ui-outlined:has(input:not(:placeholder-shown))>.ui-outlined-inner,` +
  `.ui-outlined:has(textarea:not(:placeholder-shown))>.ui-outlined-inner{opacity:0;pointer-events:none}` +
  `.ui-outlined:has(>.ui-outlined-inner) input::placeholder,` +
  `.ui-outlined:has(>.ui-outlined-inner) textarea::placeholder{color:transparent}` +
  `.ui-outlined:focus-within:has(>.ui-outlined-inner) input:placeholder-shown::placeholder,` +
  `.ui-outlined:focus-within:has(>.ui-outlined-inner) textarea:placeholder-shown::placeholder{color:rgb(148 163 184)}` +
  `.dark .ui-outlined:focus-within:has(>.ui-outlined-inner) input:placeholder-shown::placeholder,` +
  `.dark .ui-outlined:focus-within:has(>.ui-outlined-inner) textarea:placeholder-shown::placeholder{color:rgb(100 116 139)}`;

const OUTLINED_STYLE_ID = "ui-outlined-field-css";

function installOutlinedFieldCss(): void {
  const doc = globalThis.document;
  if (!doc?.head) return;
  let el = doc.getElementById(OUTLINED_STYLE_ID);
  if (!el) {
    el = doc.createElement("style");
    el.id = OUTLINED_STYLE_ID;
    doc.head.appendChild(el);
  }
  el.textContent = OUTLINED_FIELD_CSS;
}

export interface OutlinedLabelResolve {
  /** 显示在缺口 / 框内的文案 */
  text: string;
  requiredMark: boolean;
  /** 写入原生 placeholder；空格用于驱动 :placeholder-shown */
  nativePlaceholder: string;
}

/**
 * 解析描边内嵌标签。须在控件组件函数内调用（会读 Context）。
 *
 * 优先级：控件 `label` → `floatingLabel` 时的 `placeholder` → FormItem outline 上下文。
 *
 * @param options.label - 控件自身的描边标签
 * @param options.floatingLabel - 为 true 且未设 label 时用 placeholder 上浮
 * @param options.placeholder - 控件 placeholder
 * @param options.required - 控件自身 required（仅在用控件 label / floatingLabel 时决定星号）
 * @param options.useInnerLabel - 为 false 时（如有前后缀）用可见 placeholder 代替框内字
 */
export function resolveOutlinedLabel(options: {
  label?: string;
  floatingLabel?: boolean;
  placeholder?: string;
  required?: boolean;
  useInnerLabel?: boolean;
}): OutlinedLabelResolve | undefined {
  const fromItem = useContext(FormItemOutlineLabelContext);
  const fromFloating = options.floatingLabel ? options.placeholder : undefined;
  const text = options.label || fromFloating || fromItem?.label;
  if (!text) return undefined;
  const fromControl = Boolean(options.label || fromFloating);
  const requiredMark = fromControl
    ? Boolean(options.required)
    : Boolean(fromItem?.requiredMark);
  const distinctPlaceholder = Boolean(
    options.placeholder &&
      options.placeholder !== text &&
      !fromFloating,
  );
  const useInner = options.useInnerLabel !== false;
  const nativePlaceholder = distinctPlaceholder
    ? options.placeholder!
    : useInner
    ? " "
    : text;
  return { text, requiredMark, nativePlaceholder };
}

export interface OutlinedFieldProps {
  label: string;
  requiredMark?: boolean;
  size?: SizeVariant;
  error?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  hideFocusRing?: boolean;
  /** 有前后缀时不画框内字，避免与 prefix 重叠 */
  hideInnerLabel?: boolean;
  /** 框内提示垂直位置；多行用 start，避免落在 Textarea 垂直中线 */
  innerAlign?: "center" | "start";
  class?: string;
  children?: unknown;
}

/**
 * 描边外壳：边框、聚焦环、legend 缺口与空值框内提示。
 * 子级须含 `<input>` 或 `<textarea>`，且不要再画外边框。
 */
export function OutlinedField(props: OutlinedFieldProps): JSXRenderable {
  installOutlinedFieldCss();
  const size = props.size ?? "md";
  const star = props.requiredMark
    ? <span class="text-red-500"> *</span>
    : null;
  return (
    <fieldset
      disabled={props.disabled || undefined}
      class={twMerge(
        "ui-outlined relative m-0 w-full min-w-0 p-0 border bg-white dark:bg-slate-800 [min-inline-size:0]",
        "border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100",
        "transition-colors",
        fieldRounded[size],
        props.disabled && "opacity-50",
        props.readOnly && "bg-slate-50 dark:bg-slate-800/80",
        props.error && twMerge(controlErrorBorder, "ui-outlined-error"),
        props.class,
      )}
    >
      <legend
        class="text-xs leading-none text-slate-500 dark:text-slate-400"
        aria-hidden="true"
      >
        {props.label}
        {star}
      </legend>
      {!props.hideInnerLabel && (
        <span
          class={twMerge(
            "ui-outlined-inner pointer-events-none absolute z-10 text-slate-400 dark:text-slate-500",
            props.innerAlign === "start"
              ? "top-2"
              : "top-1/2 -translate-y-1/2",
            innerPadX[size],
            innerText[size],
          )}
          aria-hidden="true"
        >
          {props.label}
          {star}
        </span>
      )}
      {props.children}
    </fieldset>
  );
}
