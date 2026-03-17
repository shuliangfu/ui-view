/**
 * TreeSelect 树选择（桌面版，D 仅桌面）。
 * 树形结构单选；桌面实现放 desktop/form。
 */

import { twMerge } from "tailwind-merge";
import type { SizeVariant } from "../../shared/types.ts";

export interface TreeSelectOption {
  value: string;
  label: string;
  children?: TreeSelectOption[];
}

export interface TreeSelectProps {
  options: TreeSelectOption[];
  value?: string;
  size?: SizeVariant;
  disabled?: boolean;
  onChange?: (e: Event) => void;
  placeholder?: string;
  class?: string;
  name?: string;
  id?: string;
}

function flattenOptions(
  opts: TreeSelectOption[],
  prefix = "",
): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  for (const o of opts) {
    out.push({
      value: o.value,
      label: prefix ? `${prefix} / ${o.label}` : o.label,
    });
    if (o.children?.length) out.push(...flattenOptions(o.children, o.label));
  }
  return out;
}

const sizeClasses: Record<SizeVariant, string> = {
  xs: "px-2.5 py-1 text-xs rounded-md",
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-3 py-2 text-sm rounded-lg",
  lg: "px-4 py-2.5 text-base rounded-lg",
};

/** 基础样式：不含宽度，需全宽时由调用方加 class="w-full" */
const base =
  "border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors appearance-none cursor-pointer";

export function TreeSelect(props: TreeSelectProps) {
  const {
    options,
    value = "",
    size = "md",
    disabled = false,
    onChange,
    placeholder = "请选择",
    class: className,
    name,
    id,
  } = props;
  const flat = flattenOptions(options);
  const sizeCls = sizeClasses[size];
  return () => (
    <select
      id={id}
      name={name}
      value={value}
      disabled={disabled}
      class={twMerge(base, sizeCls, className)}
      onChange={onChange}
    >
      <option value="">{placeholder}</option>
      {flat.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}
