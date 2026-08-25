/**
 * Textarea 多行输入（View）。
 * 对齐 Input：value 可为 getter、主体不读 value()，maxLength 字数由子组件读 value()，避免失焦。light/dark 主题。
 */

import {
  type JSXRenderable,
  useContext,
  type ViewRefObject,
} from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { FormItemControlIdContext } from "./form-item-control-id.ts";
import {
  controlBlueFocusRing,
  controlErrorBorder,
  controlErrorFocusRing,
} from "./input-focus-ring.ts";
import { commitMaybeSignal, type MaybeSignal } from "./maybe-signal.ts";

/**
 * Textarea 内置文案。
 */
export interface TextareaMessages {
  /** 字数提示文本，参数为剩余字符数与上限 */
  remaining: (remaining: number, maxLength: number) => string;
}

/** 默认中文文案 */
export const defaultTextareaMessages: TextareaMessages = {
  remaining: (remaining, maxLength) => `剩余 ${remaining} / ${maxLength}`,
};

export interface TextareaProps {
  /** 是否禁用 */
  disabled?: boolean;
  /** 为 true 时隐藏聚焦激活态边框；默认 false 显示 ring */
  hideFocusRing?: boolean;
  /** 占位文案 */
  placeholder?: string;
  /** 行数（高度） */
  rows?: number;
  /** 输入值（受控可选）；见 {@link MaybeSignal} */
  value?: MaybeSignal<string>;
  /** 最大字数（展示已用/总数）；由子组件内读 value()，仅该槽位重跑 */
  maxLength?: number;
  /** 是否只读 */
  readOnly?: boolean;
  /** 是否必填（aria-required） */
  required?: boolean;
  /** 错误状态（红框 + aria-invalid） */
  error?: boolean;
  /** 额外 class */
  class?: string;
  /** 输入回调 */
  onInput?: (e: Event) => void;
  /** 变更回调 */
  onChange?: (e: Event) => void;
  /** 失焦回调 */
  onBlur?: (e: Event) => void;
  /** 聚焦回调 */
  onFocus?: (e: Event) => void;
  /** 键盘按下 */
  onKeyDown?: (e: Event) => void;
  /** 键盘抬起 */
  onKeyUp?: (e: Event) => void;
  /** 点击控件 */
  onClick?: (e: Event) => void;
  /** 粘贴 */
  onPaste?: (e: Event) => void;
  /** 原生 name */
  name?: string;
  /** 原生 id */
  id?: string;
  /** 内部 textarea ref，便于旧表单迁移后继续读取 DOM 值 */
  textareaRef?: ViewRefObject<HTMLTextAreaElement>;
  /** 多语言/自定义文案；未传字段走 {@link defaultTextareaMessages} */
  messages?: Partial<TextareaMessages>;
}

/** 基础底纹（不含 ring）；`w-full min-w-0` 覆盖原生 textarea 默认 cols 导致的窄宽度，并在 grid/flex 子项中正确伸缩 */
const textareaSurface =
  "box-border w-full min-w-0 border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border-slate-300 dark:border-slate-600 focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-3 py-2 text-sm rounded-lg resize-y min-h-[80px]";
const readOnlyCls = "bg-slate-50 dark:bg-slate-800/80 cursor-default";

/**
 * 仅此子组件读 value() 展示字数，避免 Textarea 主体订阅 signal 导致整块重渲染、textarea 失焦。
 * 在 textarea 下方一行、左侧显示剩余字符数。
 */
function TextareaLengthDisplay(props: {
  value?: MaybeSignal<string>;
  maxLength: number;
  /** 由父组件合并默认值后传入，避免子组件再次合并 */
  remainingFormatter: (remaining: number, maxLength: number) => string;
}) {
  const { value, maxLength, remainingFormatter } = props;
  const s = typeof value === "function" ? value() : (value ?? "");
  const len = s.length;
  const remaining = Math.max(0, maxLength - len);
  return (
    <span
      class="mt-1 block text-left text-xs text-slate-500 dark:text-slate-400"
      aria-live="polite"
    >
      {remainingFormatter(remaining, maxLength)}
    </span>
  );
}

export function Textarea(props: TextareaProps): JSXRenderable {
  const {
    disabled = false,
    placeholder,
    rows = 3,
    value,
    maxLength,
    readOnly = false,
    required = false,
    error = false,
    hideFocusRing = false,
    class: className,
    onInput,
    onChange,
    onBlur,
    onFocus,
    onKeyDown,
    onKeyUp,
    onClick,
    onPaste,
    name,
    id,
    textareaRef,
    messages,
  } = props;
  const m = { ...defaultTextareaMessages, ...messages };

  /** 在 {@link import("./FormItem.tsx").FormItem} 下且未显式 `id` 时，与 `label[for]` 自动对齐 */
  const fromFormItem = useContext(FormItemControlIdContext);
  const resolvedId = id ?? fromFormItem;

  // 禁止在组件体内读 value()：会订阅 signal，导致整树重跑、textarea 失焦。value 透传给 <textarea value={value} />。

  /**
   * 受控 `value` 为 Signal 时由组件写回，再调用外部 `onInput`。
   *
   * @param e - 原生 input 事件
   */
  const handleInput = (e: Event) => {
    commitMaybeSignal(value, (e.target as HTMLTextAreaElement).value);
    onInput?.(e);
  };

  /**
   * 受控 `value` 为 Signal 时由组件写回，再调用外部 `onChange`。
   *
   * @param e - 原生 change 事件
   */
  const handleChange = (e: Event) => {
    commitMaybeSignal(value, (e.target as HTMLTextAreaElement).value);
    onChange?.(e);
  };

  /**
   * 原生属性字典：勿在「未限制字数」时写入 `maxLength: undefined`。
   * 经 `setProperty` 会变成 `textarea.maxLength = undefined`，部分引擎按 0 处理，导致无法输入任何字符；
   * 显式传 `maxLength={200}` 时值为正数，故仅该分支正常。
   */
  const textareaProps = {
    id: resolvedId,
    ref: textareaRef,
    name,
    rows,
    value,
    placeholder,
    disabled,
    readOnly,
    ...(maxLength != null ? { maxLength } : {}),
    "aria-required": required,
    "aria-invalid": error,
    class: twMerge(
      textareaSurface,
      controlBlueFocusRing(!hideFocusRing),
      error && controlErrorBorder,
      error && !hideFocusRing && controlErrorFocusRing(true),
      readOnly && readOnlyCls,
      className,
    ),
    onInput: handleInput,
    onChange: handleChange,
    onBlur,
    onFocus,
    onKeyDown,
    onKeyUp,
    onClick,
    onPaste,
  };

  if (maxLength == null) {
    /**
     * 与 {@link Input} 无 addon 分支一致：避免多包一层 `() => <textarea />` 在 View `insert` 下与受控
     * `value` 叠用导致整段 DOM 重建、输入失焦。
     */
    return <textarea {...textareaProps} />;
  }

  /**
   * 外壳稳定；字数由函数子局部读 value（与 Password 强度槽同理），勿包整段 `() =>`。
   */
  return (
    <div class="w-full min-w-0">
      <textarea {...textareaProps} />
      {() => (
        <TextareaLengthDisplay
          value={value}
          maxLength={maxLength}
          remainingFormatter={m.remaining}
        />
      )}
    </div>
  );
}
