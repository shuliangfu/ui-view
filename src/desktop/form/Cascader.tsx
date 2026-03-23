/**
 * Cascader 级联选择（桌面版）。
 * 桌面：两级下拉；D/M 约定，桌面实现放 desktop/form。
 */

import { twMerge } from "tailwind-merge";
import type { SizeVariant } from "../../shared/types.ts";

export interface CascaderOption {
  value: string;
  label: string;
  children?: CascaderOption[];
}

export interface CascaderProps {
  options: CascaderOption[];
  value?: string[];
  size?: SizeVariant;
  disabled?: boolean;
  onChange?: (value: string[]) => void;
  placeholder?: string;
  class?: string;
  name?: string;
  id?: string;
}

const sizeClasses: Record<SizeVariant, string> = {
  xs: "px-2.5 py-1 text-xs rounded-md",
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-3 py-2 text-sm rounded-lg",
  lg: "px-4 py-2.5 text-base rounded-lg",
};

const selectBase =
  "border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors appearance-none cursor-pointer";

export function Cascader(props: CascaderProps) {
  const {
    options,
    value = [],
    size = "md",
    disabled = false,
    onChange,
    placeholder = "请选择",
    class: className,
    name,
    id,
  } = props;
  const sizeCls = sizeClasses[size];
  const parentValue = value[0] ?? "";
  const childOptions = options.find((o) => o.value === parentValue)?.children ??
    [];
  const childValue = value[1] ?? "";

  /** 无内部 signal，直接返回 VNode */
  return (
    <div class={twMerge("flex flex-wrap items-center gap-2", className)}>
      <select
        id={id}
        name={name}
        value={parentValue}
        disabled={disabled}
        class={twMerge(selectBase, sizeCls, "min-w-[120px]")}
        onChange={(e: Event) => {
          const v = (e.target as HTMLSelectElement).value;
          onChange?.(v ? [v] : []);
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {childOptions.length > 0 && (
        <select
          value={childValue}
          disabled={disabled}
          class={twMerge(selectBase, sizeCls, "min-w-[120px]")}
          onChange={(e: Event) => {
            const v = (e.target as HTMLSelectElement).value;
            onChange?.(parentValue ? [parentValue, v] : []);
          }}
        >
          <option value="">{placeholder}</option>
          {childOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}
    </div>
  );
}
