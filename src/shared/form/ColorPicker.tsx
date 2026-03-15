/**
 * ColorPicker 颜色选择（View）。
 * 基于 input type="color"，支持 value 十六进制；light/dark 主题。
 */

import { twMerge } from "tailwind-merge";

export interface ColorPickerProps {
  /** 当前颜色，#rrggbb */
  value?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 变更回调 */
  onChange?: (e: Event) => void;
  /** 额外 class（作用于容器） */
  class?: string;
  /** 原生 name */
  name?: string;
  /** 原生 id */
  id?: string;
}

const inputCls =
  "h-10 w-full min-w-[80px] cursor-pointer rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded [&::-moz-color-swatch]:border-0 [&::-moz-color-swatch]:rounded";

export function ColorPicker(props: ColorPickerProps) {
  const {
    value = "#000000",
    disabled = false,
    onChange,
    class: className,
    name,
    id,
  } = props;

  return () => (
    <input
      type="color"
      id={id}
      name={name}
      value={value}
      disabled={disabled}
      class={twMerge(inputCls, className)}
      onChange={onChange}
    />
  );
}
