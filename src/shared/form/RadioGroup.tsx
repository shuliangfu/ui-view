/**
 * RadioGroup 单选组（View）。
 * 选项列表、统一 name、当前选中 value，onChange 回传新 value。
 */

import { twMerge } from "tailwind-merge";
import { Radio } from "./Radio.tsx";

export interface RadioGroupOption {
  value: string;
  label: string;
  disabled?: boolean;
}

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
    class: className,
  } = props;

  return () => (
    <div
      class={twMerge("flex flex-col gap-2", className)}
      role="radiogroup"
      aria-label={name}
      aria-invalid={error}
    >
      {options.map((opt) => (
        <span key={opt.value}>
          <Radio
            name={name}
            value={opt.value}
            checked={value === opt.value}
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
}
