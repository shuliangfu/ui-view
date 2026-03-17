/**
 * CheckboxGroup 多选组（View）。
 * 选项列表、统一 name、选中值 value 为字符串数组，onChange 回传新数组；支持横向/纵向布局。
 */

import { twMerge } from "tailwind-merge";
import { Checkbox } from "./Checkbox.tsx";

export interface CheckboxGroupOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/** 布局方向：横向（默认）或纵向 */
export type CheckboxGroupDirection = "vertical" | "horizontal";

export interface CheckboxGroupProps {
  /** 选项列表 */
  options: CheckboxGroupOption[];
  /** 同组 name */
  name?: string;
  /** 当前选中的 value 数组；可为 getter 以配合 View 细粒度更新 */
  value?: string[] | (() => string[]);
  /** 是否整组禁用 */
  disabled?: boolean;
  /** 错误状态（传递给每个 Checkbox） */
  error?: boolean;
  /** 变更回调，回传新选中的 value 数组 */
  onChange?: (value: string[]) => void;
  /** 布局方向：horizontal 横向、vertical 纵向，默认 "horizontal" */
  direction?: CheckboxGroupDirection;
  /** 额外 class（作用于容器） */
  class?: string;
}

export function CheckboxGroup(props: CheckboxGroupProps) {
  const {
    options,
    name,
    value = [],
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
    const resolvedValue = typeof value === "function" ? value() : (value ?? []);
    return (
      <div
        class={twMerge("flex", directionCls, className)}
        role="group"
        aria-label={name}
        aria-invalid={error}
      >
        {options.map((opt) => {
          const checked = resolvedValue.includes(opt.value);
          return (
            <span key={opt.value}>
              <Checkbox
                name={name}
                value={opt.value}
                checked={checked}
                disabled={disabled || opt.disabled}
                error={error}
                onChange={(e: Event) => {
                  const el = e.target as HTMLInputElement;
                  const next = el.checked
                    ? [...resolvedValue, opt.value]
                    : resolvedValue.filter((v: string) => v !== opt.value);
                  onChange?.(next);
                }}
              >
                {opt.label}
              </Checkbox>
            </span>
          );
        })}
      </div>
    );
  };
}
