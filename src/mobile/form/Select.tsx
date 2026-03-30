/**
 * Select 单选下拉（移动版）。
 * 移动可底部滚轮/全屏选择；当前为加大触控区样式，后续可接 Picker。
 */

import { twMerge } from "tailwind-merge";
import {
  controlBlueFocusRing,
  nativeSelectSurface,
} from "../../shared/form/input-focus-ring.ts";
import type { SizeVariant } from "../../shared/types.ts";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  size?: SizeVariant;
  disabled?: boolean;
  options?: SelectOption[];
  value?: string;
  /** 占位选项文案（对应 value=""） */
  placeholder?: string;
  class?: string;
  onChange?: (e: Event) => void;
  name?: string;
  id?: string;
  children?: unknown;
  /** 为 true 时隐藏聚焦激活态边框；默认 false 显示 ring */
  hideFocusRing?: boolean;
}

const sizeClasses: Record<SizeVariant, string> = {
  xs: "px-3 py-2 text-sm rounded-md min-h-[44px]",
  sm: "px-4 py-2.5 text-sm rounded-lg min-h-[44px]",
  md: "px-4 py-3 text-base rounded-lg min-h-[48px]",
  lg: "px-5 py-3.5 text-base rounded-lg min-h-[52px]",
};

export function Select(props: SelectProps) {
  const {
    size = "md",
    disabled = false,
    options,
    value,
    placeholder,
    class: className,
    onChange,
    name,
    id,
    children,
    hideFocusRing = false,
  } = props;
  const sizeCls = sizeClasses[size];
  /** 无内部 signal，直接返回 VNode */
  return (
    <select
      id={id}
      name={name}
      value={value}
      disabled={disabled}
      class={twMerge(
        "w-full touch-manipulation",
        nativeSelectSurface,
        controlBlueFocusRing(!hideFocusRing),
        sizeCls,
        className,
      )}
      onChange={onChange}
    >
      {options
        ? (
          <>
            {placeholder != null && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </>
        )
        : children}
    </select>
  );
}
