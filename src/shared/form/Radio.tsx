/**
 * Radio 单选（View）。
 * 支持 disabled、checked，需配合 name 同组互斥；light/dark 主题。
 * `checked` 为 `createSignal` 返回值时，变更会先写入 Signal。
 */

import { type Signal } from "@dreamer/view";
import { safeIsSignal, writeSignalValue } from "../safe-signal.ts";
import type { JSXRenderable } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { resolveFormControlSize } from "./form-control-context.ts";
import { controlBlueFocusRing } from "./input-focus-ring.ts";
import type { MaybeSignal } from "./maybe-signal.ts";
import type { SizeVariant } from "../types.ts";

export interface RadioProps {
  /** 尺寸，与 {@link import("./Input.tsx").Input} 相同：xs、sm、md、lg */
  size?: SizeVariant;
  /** 是否选中；见 {@link MaybeSignal} */
  checked?: MaybeSignal<boolean>;
  /** 是否禁用 */
  disabled?: boolean;
  /** 同组 name 一致则互斥 */
  name?: string;
  /** 选项值 */
  value?: string;
  /** 额外 class（作用于 label） */
  class?: string;
  /** 变更回调。`checked` 为 Signal 时组件会先自动写入。 */
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
  /** 原生 id */
  id?: string;
  /** 错误状态（红框/红字） */
  error?: boolean;
  /** 文案或子节点 */
  children?: unknown;
  /** 为 true 时隐藏聚焦激活态边框；默认 false 显示 ring */
  hideFocusRing?: boolean;
}

/** 单选圆钮底纹（不含 ring） */
const radioInputSurface =
  "rounded-full border-slate-300 dark:border-slate-600 text-blue-600 focus:outline-hidden dark:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
const labelCls =
  "inline-flex items-center cursor-pointer text-slate-700 dark:text-slate-300";
const radioSizeClasses: Record<SizeVariant, string> = {
  xs: "h-3 w-3",
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};
const radioLabelSize: Record<SizeVariant, string> = {
  xs: "gap-1.5 text-xs",
  sm: "gap-2 text-sm",
  md: "gap-2 text-sm",
  lg: "gap-2 text-base",
};
const errorCls = "[&_input]:border-red-500 text-red-600 dark:text-red-400";

export function Radio(props: RadioProps): JSXRenderable {
  const {
    size: sizeProp,
    checked: checkedMaybe,
    disabled = false,
    error = false,
    hideFocusRing = false,
    name,
    value,
    class: className,
    onChange: onChangeProp,
    onBlur,
    onFocus,
    onKeyDown,
    onKeyUp,
    onClick,
    onPaste,
    id,
    children,
  } = props;
  const size = resolveFormControlSize(sizeProp);

  /**
   * 选中变化时：若 `checked` 为 Signal 则回写；再调用外部 `onChange`。
   *
   * @param e - 原生 change 事件
   */
  const handleChange = (e: Event) => {
    const next = (e.target as HTMLInputElement).checked;
    if (checkedMaybe !== undefined && safeIsSignal(checkedMaybe)) {
      writeSignalValue(checkedMaybe as Signal<boolean>, next);
    }
    onChangeProp?.(e);
  };

  const checkedForInput = checkedMaybe === undefined ? false : checkedMaybe;

  return (
    <label class={twMerge(labelCls, radioLabelSize[size], error && errorCls, className)}>
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={checkedForInput}
        disabled={disabled}
        aria-invalid={error}
        class={twMerge(radioInputSurface, radioSizeClasses[size], controlBlueFocusRing(!hideFocusRing))}
        onChange={handleChange}
        onBlur={onBlur}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onClick={onClick}
        onPaste={onPaste}
      />
      {children}
    </label>
  );
}
