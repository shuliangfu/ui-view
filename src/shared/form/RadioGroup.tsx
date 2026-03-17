/**
 * RadioGroup 单选组（View）。
 * 选项列表、统一 name、当前选中 value，onChange 回传新 value；支持横向/纵向布局。
 */

import { twMerge } from "tailwind-merge";
import { Radio } from "./Radio.tsx";

export interface RadioGroupOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/** 布局方向：横向（默认）或纵向 */
export type RadioGroupDirection = "vertical" | "horizontal";

export interface RadioGroupProps {
  /** 选项列表 */
  options: RadioGroupOption[];
  /** 同组 name（必填则互斥） */
  name: string;
  /** 当前选中的 value；可为 getter 以配合 View 细粒度更新 */
  value?: string | (() => string);
  /** 是否整组禁用 */
  disabled?: boolean;
  /** 错误状态（传递给每个 Radio） */
  error?: boolean;
  /** 变更回调，回传新选中的 value */
  onChange?: (value: string) => void;
  /** 布局方向：horizontal 横向、vertical 纵向，默认 "horizontal" */
  direction?: RadioGroupDirection;
  /** 额外 class（作用于容器） */
  class?: string;
}

export function RadioGroup(props: RadioGroupProps) {
  const {
    options,
    name,
    value = "",
    disabled = false,
    error = false,
    onChange,
    direction = "horizontal",
    class: className,
  } = props;

  const directionCls = direction === "horizontal"
    ? "flex-row flex-wrap gap-x-4 gap-y-2"
    : "flex-col gap-2";

  return () => {
    const resolvedValue = typeof value === "function" ? value() : (value ?? "");
    return (
      <div
        class={twMerge("flex", directionCls, className)}
        role="radiogroup"
        aria-label={name}
        aria-invalid={error}
      >
        {options.map((opt) => (
          <span key={opt.value}>
            <Radio
              name={name}
              value={opt.value}
              checked={resolvedValue === opt.value}
              disabled={disabled || opt.disabled}
              error={error}
              onChange={() => onChange?.(opt.value)}
            >
              {opt.label}
            </Radio>
          </span>
        ))}
      </div>
    );
  };
}
