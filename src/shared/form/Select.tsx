/**
 * Select 单选：**仅**自绘下拉（触发按钮 + listbox 浮层），不渲染原生 `<select>`。
 * 须通过 {@link SelectProps.options} 传入选项；未传时视为空列表。
 */

import { createSignal, Show } from "@dreamer/view";
import type { JSXRenderable } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { IconChevronDown } from "../basic/icons/ChevronDown.tsx";
import {
  controlBlueFocusRing,
  pickerTriggerSurface,
} from "./input-focus-ring.ts";
import { resolveFormControlSize } from "./form-control-context.ts";
import {
  commitMaybeSignal,
  type MaybeSignal,
  readMaybeSignal,
} from "./maybe-signal.ts";
import type { SizeVariant } from "../types.ts";

/** 保留类型别名以便兼容导出；仅支持自绘下拉 */
export type SelectAppearance = "dropdown";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Select 内置文案。
 */
export interface SelectMessages {
  /** 触发按钮 `aria-label` 的兜底文案（无选中、无 placeholder 时使用） */
  triggerFallback: string;
}

/** 默认中文文案 */
export const defaultSelectMessages: SelectMessages = {
  triggerFallback: "选择",
};

export interface SelectProps {
  size?: SizeVariant;
  disabled?: boolean;
  /** 选项列表；与自绘下拉必选 */
  options?: SelectOption[];
  /** 当前值；见 {@link MaybeSignal} */
  value?: MaybeSignal<string>;
  /** 占位选项文案（对应 value=""） */
  placeholder?: string;
  class?: string;
  onChange?: (e: Event) => void;
  name?: string;
  id?: string;
  /**
   * 已废弃：不再支持通过 children 挂载原生 `<option>`。
   * 请改用 {@link SelectProps.options}。
   */
  children?: unknown;
  /** 为 true 时隐藏聚焦激活态边框；默认 false 显示 ring */
  hideFocusRing?: boolean;
  /** @deprecated 已无其它形态，可省略 */
  appearance?: SelectAppearance;
  /** 多语言/自定义文案；未传字段走 {@link defaultSelectMessages} */
  messages?: Partial<SelectMessages>;
}

/** 浮层模式下的尺寸 */
const sizeClassesDropdown: Record<SizeVariant, string> = {
  xs: "px-2.5 py-1 text-xs rounded-md",
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-3 py-2 text-sm rounded-lg",
  lg: "px-4 py-2.5 text-base rounded-lg",
};

/** 选项行：直角条，避免每项单独大圆角造成「胶囊」观感（外框圆角见下方 listbox 容器）。 */
const optionBase =
  "rounded-none px-3 py-2 text-sm text-left w-full cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed";

/** 与 Dropdown 共用 Esc 关闭注册键，需配合 initDropdownEsc 使用 */
const DROPDOWN_ESC_KEY = "__lastDropdownClose" as const;

/**
 * 自绘下拉分支：`button` 触发、`hidden input` 同步表单提交、`listbox` 浮层选值。
 * 与 {@link MultiSelect} 一致注册 Esc 关闭键 {@link DROPDOWN_ESC_KEY}。
 *
 * @param props 与 {@link SelectProps} 相同；无有效 `options` 时列表为空，若仍传入 `children` 会在控制台告警。
 */
function SelectDropdownBranch(props: SelectProps) {
  const {
    size: sizeProp,
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
    messages,
  } = props;

  const resolvedOptions = options ?? [];
  if (
    children != null && children !== false && children !== true &&
    children !== "" && (options == null || options.length === 0)
  ) {
    console.warn(
      "[@dreamer/ui-view Select] 已移除原生 <select>；请传入 options，勿仅使用 children。",
    );
  }

  const m = { ...defaultSelectMessages, ...messages };
  const size = resolveFormControlSize(sizeProp);

  const openState = createSignal(false);
  const sizeCls = sizeClassesDropdown[size];

  /** 选中某项：写回 Signal、派发合成 change、收起浮层 */
  const triggerChange = (newValue: string) => {
    commitMaybeSignal(value, newValue);
    const synthetic = { target: { value: newValue } } as unknown as Event;
    onChange?.(synthetic);
    openState.value = false;
  };

  /** 点击遮罩关闭下拉 */
  const handleBackdropClick = () => {
    openState.value = false;
  };

  return (
    <span
      class={twMerge(
        "relative block w-full min-w-0",
        className,
      )}
    >
      <input
        type="hidden"
        name={name}
        value={() => readMaybeSignal(value) ?? ""}
      />
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={() => openState.value}
        aria-label={() => {
          const rv = readMaybeSignal(value);
          const opt = resolvedOptions.find((o) => o.value === rv);
          const labelText = opt?.label ?? (placeholder ?? "");
          return labelText || placeholder || m.triggerFallback;
        }}
        class={twMerge(
          "w-full",
          pickerTriggerSurface,
          controlBlueFocusRing(!hideFocusRing),
          sizeCls,
        )}
        onClick={() => {
          if (!disabled) openState.value = !openState.value;
        }}
      >
        <span
          class={() => {
            const rv = readMaybeSignal(value);
            const opt = resolvedOptions.find((o) => o.value === rv);
            return opt
              ? "text-slate-900 dark:text-slate-100"
              : "text-slate-400 dark:text-slate-500";
          }}
        >
          {() => {
            const rv = readMaybeSignal(value);
            const opt = resolvedOptions.find((o) => o.value === rv);
            return opt?.label ?? (placeholder ?? "");
          }}
        </span>
        <span
          class={() =>
            twMerge(
              "inline-flex shrink-0 text-slate-400 dark:text-slate-500 transition-transform",
              openState.value && "rotate-180",
            )}
        >
          <IconChevronDown size="sm" />
        </span>
      </button>
      {
        /*
         * 勿用 `display: contents` 包裹：会破坏 `absolute` 相对外层 `relative` 的包含块，列表易飘到视口顶部。
         * 用数组子节点让遮罩与列表作为 `span` 的并列子 DOM（不用 Fragment，避免 lint jsx-no-useless-fragment）。
         */
      }
      <Show when={() => openState.value}>
        {[
          typeof globalThis !== "undefined" &&
          (() => {
            const g = globalThis as unknown as Record<
              string,
              (() => void) | undefined
            >;
            g[DROPDOWN_ESC_KEY] = () => {
              openState.value = false;
            };
            return null;
          })(),
          <div
            key="select-dd-backdrop"
            class="fixed inset-0 z-40"
            aria-hidden
            onClick={handleBackdropClick}
          />,
          <div
            key="select-dd-list"
            role="listbox"
            aria-activedescendant={() => {
              const rv = readMaybeSignal(value);
              return resolvedOptions.find((o) => o.value === rv)?.value;
            }}
            class="absolute z-50 top-full left-0 right-0 mt-1 py-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg max-h-60 overflow-auto"
          >
            {placeholder != null && (
              <button
                type="button"
                role="option"
                aria-selected={() => !readMaybeSignal(value)}
                class={() =>
                  twMerge(
                    optionBase,
                    !readMaybeSignal(value) &&
                      "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
                  )}
                onClick={() => triggerChange("")}
              >
                {placeholder}
              </button>
            )}
            {resolvedOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={() => readMaybeSignal(value) === opt.value}
                disabled={opt.disabled}
                class={() =>
                  twMerge(
                    optionBase,
                    readMaybeSignal(value) === opt.value &&
                      "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
                  )}
                onClick={() => !opt.disabled && triggerChange(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>,
        ]}
      </Show>
    </span>
  );
}

/**
 * 单选下拉：始终为自绘浮层（无原生 `<select>`）。
 *
 * @param props 选项须通过 `options` 提供；`appearance` 仅保留兼容。
 */
export function Select(props: SelectProps): JSXRenderable {
  return SelectDropdownBranch(props);
}
