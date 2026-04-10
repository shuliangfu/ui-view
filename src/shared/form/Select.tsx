/**
 * Select 单选：支持 `appearance` 在**自定义下拉**与**原生 select**之间切换。
 * - `dropdown`（默认）：`options` 时自绘浮层；无 `options` 时走原生 select + `children`。
 * - `native`：原生 select，加大触控区，适合移动端；`options` 或 `children` 均可。
 */

import { createSignal, Show } from "@dreamer/view";
import type { JSXRenderable } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { IconChevronDown } from "../basic/icons/ChevronDown.tsx";
import {
  controlBlueFocusRing,
  nativeSelectSurface,
  pickerTriggerSurface,
} from "./input-focus-ring.ts";
import {
  commitMaybeSignal,
  type MaybeSignal,
  readMaybeSignal,
} from "./maybe-signal.ts";
import type { SizeVariant } from "../types.ts";

/** 展示形态：`dropdown` 浮层；`native` 原生大触控 */
export type SelectAppearance = "dropdown" | "native";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  size?: SizeVariant;
  disabled?: boolean;
  options?: SelectOption[];
  /** 当前值；见 {@link MaybeSignal} */
  value?: MaybeSignal<string>;
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
  /**
   * `dropdown`：桌面默认同，自定义浮层。
   * `native`：原生 select + 大最小高度，便于移动触控。
   */
  appearance?: SelectAppearance;
}

/** 浮层模式下的尺寸（桌面） */
const sizeClassesDropdown: Record<SizeVariant, string> = {
  xs: "px-2.5 py-1 text-xs rounded-md",
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-3 py-2 text-sm rounded-lg",
  lg: "px-4 py-2.5 text-base rounded-lg",
};

/** 原生模式下的尺寸（移动友好最小高度） */
const sizeClassesNative: Record<SizeVariant, string> = {
  xs: "px-3 py-2 text-sm rounded-md min-h-[44px]",
  sm: "px-4 py-2.5 text-sm rounded-lg min-h-[44px]",
  md: "px-4 py-3 text-base rounded-lg min-h-[48px]",
  lg: "px-5 py-3.5 text-base rounded-lg min-h-[52px]",
};

const optionBase =
  "px-3 py-2 text-sm text-left w-full cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed first:rounded-t-lg last:rounded-b-lg";

/** 与 Dropdown 共用 Esc 关闭注册键，需配合 initDropdownEsc 使用 */
const DROPDOWN_ESC_KEY = "__lastDropdownClose" as const;

/**
 * 原生 select 分支（`appearance="native"`）。
 *
 * @param props - 与 {@link Select} 相同字段（不含 appearance）
 */
function SelectNativeBranch(props: Omit<SelectProps, "appearance">) {
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
  const sizeCls = sizeClassesNative[size];

  /**
   * `value` 为 Signal 时在组件内写回，无需在 `onChange` 里再赋值。
   *
   * @param e - change 事件
   */
  const handleChange = (e: Event) => {
    commitMaybeSignal(value, (e.target as HTMLSelectElement).value);
    onChange?.(e);
  };

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
      onChange={handleChange}
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

/**
 * 自定义下拉分支（`appearance="dropdown"`），逻辑同原 desktop/form/Select。
 */
function SelectDropdownBranch(props: Omit<SelectProps, "appearance">) {
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

  const openState = createSignal(false);
  const sizeCls = sizeClassesDropdown[size];

  const triggerChange = (newValue: string) => {
    commitMaybeSignal(value, newValue);
    const synthetic = { target: { value: newValue } } as unknown as Event;
    onChange?.(synthetic);
    openState.value = false;
  };

  const handleBackdropClick = () => {
    openState.value = false;
  };

  if (!options) {
    return () => {
      const resolvedValue = typeof value === "function"
        ? (value as () => string)()
        : value;
      /**
       * 原生 select：`value` 为 Signal 时在组件内写回，无需在 `onChange` 里再赋值。
       *
       * @param e - change 事件
       */
      const handleNativeChange = (e: Event) => {
        commitMaybeSignal(value, (e.target as HTMLSelectElement).value);
        onChange?.(e);
      };
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
          onChange={handleNativeChange}
        >
          {children}
        </select>
      );
    };
  }

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
          const opt = options.find((o) => o.value === rv);
          const labelText = opt?.label ?? (placeholder ?? "");
          return labelText || placeholder || "选择";
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
            const opt = options.find((o) => o.value === rv);
            return opt
              ? "text-slate-900 dark:text-slate-100"
              : "text-slate-400 dark:text-slate-500";
          }}
        >
          {() => {
            const rv = readMaybeSignal(value);
            const opt = options.find((o) => o.value === rv);
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
              return options.find((o) => o.value === rv)?.value;
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
            {options.map((opt) => (
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
 * 单选下拉：默认浮层；`appearance="native"` 时走原生大触控 select。
 */
export function Select(props: SelectProps): JSXRenderable {
  const { appearance = "dropdown", ...rest } = props;
  if (appearance === "native") {
    return SelectNativeBranch(rest);
  }
  return SelectDropdownBranch(rest);
}
