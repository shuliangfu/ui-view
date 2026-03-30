/**
 * Cascader 级联选择（移动版）。
 * 移动可底部滚轮/全屏多级选择；当前为双列下拉 + 触控区加大。
 */

import { twMerge } from "tailwind-merge";
import {
  controlBlueFocusRing,
  nativeSelectSurface,
} from "../../shared/form/input-focus-ring.ts";
import type { SizeVariant } from "../../shared/types.ts";

export interface CascaderOption {
  value: string;
  label: string;
  children?: CascaderOption[];
  /** 与桌面版类型对齐；移动版当前仍仅用静态 children */
  isLeaf?: boolean;
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
  /** 为 true 时隐藏聚焦激活态边框；默认 false 显示 ring */
  hideFocusRing?: boolean;
}

const sizeClasses: Record<SizeVariant, string> = {
  xs: "px-3 py-2 text-sm rounded-md min-h-[44px]",
  sm: "px-4 py-2.5 text-sm rounded-lg min-h-[44px]",
  md: "px-4 py-3 text-base rounded-lg min-h-[48px]",
  lg: "px-5 py-3.5 text-base rounded-lg min-h-[52px]",
};

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
    hideFocusRing = false,
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
        class={twMerge(
          "touch-manipulation",
          nativeSelectSurface,
          controlBlueFocusRing(!hideFocusRing),
          sizeCls,
          "min-w-[120px]",
        )}
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
          class={twMerge(
            "touch-manipulation",
            nativeSelectSurface,
            controlBlueFocusRing(!hideFocusRing),
            sizeCls,
            "min-w-[120px]",
          )}
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
