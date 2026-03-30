/**
 * Select 单选下拉（桌面版）。
 * 自定义下拉列表（非原生 select），触发区 + 浮层选项；与 D/M 约定一致，桌面实现放 desktop/form。
 */

import { createSignal } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
/** 按需：单文件图标，避免经 icons/mod 拉入全表 */
import { IconChevronDown } from "../../shared/basic/icons/ChevronDown.tsx";
import {
  controlBlueFocusRing,
  nativeSelectSurface,
  pickerTriggerSurface,
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
  /** 当前值；可为 getter 以配合 View 细粒度更新 */
  value?: string | (() => string);
  /** 占位选项文案（对应 value=""） */
  placeholder?: string;
  class?: string;
  onChange?: (e: Event) => void;
  name?: string;
  id?: string;
  /** 仅当未传 options 时使用：渲染原生 select，由 children 提供 option 节点 */
  children?: unknown;
  /** 为 true 时隐藏聚焦激活态边框；默认 false 显示 ring */
  hideFocusRing?: boolean;
}

const sizeClasses: Record<SizeVariant, string> = {
  xs: "px-2.5 py-1 text-xs rounded-md",
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-3 py-2 text-sm rounded-lg",
  lg: "px-4 py-2.5 text-base rounded-lg",
};

const optionBase =
  "px-3 py-2 text-sm text-left w-full cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed first:rounded-t-lg last:rounded-b-lg";

/** 与 Dropdown 共用 Esc 关闭注册键，需配合 initDropdownEsc 使用 */
const DROPDOWN_ESC_KEY = "__lastDropdownClose" as const;

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

  /** 下拉是否展开（SignalRef） */
  const openState = createSignal(false);
  const sizeCls = sizeClasses[size];
  const resolvedValue = typeof value === "function" ? value() : value;
  const selectedOption = options?.find((o) => o.value === resolvedValue);
  const displayText = selectedOption?.label ?? (placeholder ?? "");

  const triggerChange = (newValue: string) => {
    const synthetic = { target: { value: newValue } } as unknown as Event;
    onChange?.(synthetic);
    openState.value = false;
  };

  const handleBackdropClick = () => {
    openState.value = false;
  };

  /** 有 options 时走自定义下拉；否则走原生 select（兼容 children 传 option） */
  if (!options) {
    /** 无内部 open 状态，直接返回 VNode */
    return (
      <select
        id={id}
        name={name}
        value={resolvedValue}
        disabled={disabled}
        class={twMerge(
          nativeSelectSurface,
          controlBlueFocusRing(!hideFocusRing),
          sizeCls,
          className,
        )}
        onChange={onChange}
      >
        {children}
      </select>
    );
  }

  return () => (
    <span class={twMerge("relative inline-block", className)}>
      <input type="hidden" name={name} value={resolvedValue ?? ""} />
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={openState.value}
        aria-label={displayText || placeholder || "选择"}
        class={twMerge(
          "w-full",
          pickerTriggerSurface,
          controlBlueFocusRing(!hideFocusRing),
          sizeCls,
        )}
        onClick={() => {
          if (!disabled) openState.value = (prev) => !prev;
        }}
      >
        <span
          class={selectedOption
            ? "text-slate-900 dark:text-slate-100"
            : "text-slate-400 dark:text-slate-500"}
        >
          {displayText}
        </span>
        <IconChevronDown
          size="sm"
          class={twMerge(
            "shrink-0 text-slate-400 dark:text-slate-500 transition-transform",
            openState.value && "rotate-180",
          )}
        />
      </button>
      {openState.value && (
        <>
          {typeof globalThis !== "undefined" &&
            (() => {
              const g = globalThis as unknown as Record<
                string,
                (() => void) | undefined
              >;
              g[DROPDOWN_ESC_KEY] = () => {
                openState.value = false;
              };
              return null;
            })()}
          <div
            class="fixed inset-0 z-40"
            aria-hidden
            onClick={handleBackdropClick}
          />
          <div
            role="listbox"
            aria-activedescendant={selectedOption?.value}
            class="absolute z-50 top-full left-0 right-0 mt-1 py-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg max-h-60 overflow-auto"
          >
            {placeholder != null && (
              <button
                type="button"
                role="option"
                aria-selected={!resolvedValue}
                class={twMerge(
                  optionBase,
                  !resolvedValue &&
                    "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
                )}
                onClick={() => triggerChange("")}
              >
                {placeholder}
              </button>
            )}
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={resolvedValue === opt.value}
                disabled={opt.disabled}
                class={twMerge(
                  optionBase,
                  resolvedValue === opt.value &&
                    "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
                )}
                onClick={() => !opt.disabled && triggerChange(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </span>
  );
}
