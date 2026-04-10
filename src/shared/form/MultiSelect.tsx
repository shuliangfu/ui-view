/**
 * MultiSelect 多选：`appearance` 切换**自定义浮层**与**原生 multiple + 全选/清空**（移动友好）。
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

/** 与 Select 共用 Esc 关闭注册键，需配合文档站 initDropdownEsc */
const DROPDOWN_ESC_KEY = "__lastDropdownClose" as const;

/** 展示形态 */
export type MultiSelectAppearance = "dropdown" | "native";

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  /** 当前选中值；见 {@link MaybeSignal} */
  value?: MaybeSignal<string[]>;
  size?: SizeVariant;
  disabled?: boolean;
  onChange?: (e: Event) => void;
  class?: string;
  name?: string;
  id?: string;
  /** 未选任何项时触发器上显示的占位文案（仅 dropdown） */
  placeholder?: string;
  /** 为 true 时隐藏触发器聚焦 ring */
  hideFocusRing?: boolean;
  /** `dropdown`：浮层多选；`native`：原生 multiple + 大触控区 */
  appearance?: MultiSelectAppearance;
}

const sizeClassesDropdown: Record<SizeVariant, string> = {
  xs: "px-2.5 py-1 text-xs rounded-md",
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-3 py-2 text-sm rounded-lg",
  lg: "px-4 py-2.5 text-base rounded-lg",
};

const sizeClassesNative: Record<SizeVariant, string> = {
  xs: "px-3 py-2 text-sm rounded-md min-h-[80px]",
  sm: "px-4 py-2.5 text-sm rounded-lg min-h-[80px]",
  md: "px-4 py-3 text-base rounded-lg min-h-[88px]",
  lg: "px-5 py-3.5 text-base rounded-lg min-h-[96px]",
};

const btnCls =
  "text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

const doneBtnCls =
  "text-xs px-3 py-1 rounded border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 dark:border-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0";

const optionRowBase =
  "flex items-center gap-2 px-3 py-2 text-sm text-left w-full cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors";

/**
 * 原生 multiple 分支；返回渲染函数以便 `value` 为 Signal 时随订阅更新。
 *
 * @param props - 与 {@link MultiSelect} 相同（不含 appearance）
 */
function MultiSelectNativeBranch(props: Omit<MultiSelectProps, "appearance">) {
  const {
    options,
    value: valueProp,
    size = "md",
    disabled = false,
    onChange,
    class: className,
    name,
    id,
    hideFocusRing = false,
  } = props;
  const sizeCls = sizeClassesNative[size];

  const triggerChange = (newVal: string[]) => {
    commitMaybeSignal(valueProp, newVal);
    const synthetic = { target: { value: newVal } } as unknown as Event;
    onChange?.(synthetic);
  };

  return () => {
    const value = readMaybeSignal(valueProp) ?? [];
    const allValues = options.map((o) => o.value);
    const allSelected = allValues.length > 0 &&
      allValues.every((v) => value.includes(v));

    return (
      <span class="block">
        <div class="flex gap-1 mb-1">
          <button
            type="button"
            class={btnCls}
            disabled={disabled || allSelected}
            onClick={() => triggerChange([...allValues])}
          >
            全选
          </button>
          <button
            type="button"
            class={btnCls}
            disabled={disabled || value.length === 0}
            onClick={() => triggerChange([])}
          >
            清空
          </button>
        </div>
        <select
          multiple
          id={id}
          name={name}
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
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
              selected={value.includes(opt.value)}
            >
              {opt.label}
            </option>
          ))}
        </select>
      </span>
    );
  };
}

/**
 * 桌面浮层多选（原 desktop/form/MultiSelect）。
 */
function MultiSelectDropdownBranch(
  props: Omit<MultiSelectProps, "appearance">,
) {
  const {
    options,
    value = [],
    size = "md",
    disabled = false,
    onChange,
    class: className,
    name,
    id,
    placeholder = "请选择",
    hideFocusRing = false,
  } = props;

  const openState = createSignal(false);
  const sizeCls = sizeClassesDropdown[size];

  const triggerChange = (newVal: string[]) => {
    commitMaybeSignal(value, newVal);
    const synthetic = { target: { value: newVal } } as unknown as Event;
    onChange?.(synthetic);
  };

  const toggleOption = (
    optValue: string,
    optDisabled: boolean | undefined,
    resolvedValue: string[],
  ) => {
    if (disabled || optDisabled) return;
    const next = resolvedValue.includes(optValue)
      ? resolvedValue.filter((v) => v !== optValue)
      : [...resolvedValue, optValue];
    triggerChange(next);
  };

  const closePanel = () => {
    openState.value = false;
  };

  const selectableValues = options
    .filter((o) => !o.disabled)
    .map((o) => o.value);

  return (
    <span class={twMerge("relative block w-full min-w-0", className)}>
      {() => {
        const nm = name;
        if (!nm) return null;
        const rv = readMaybeSignal(value) ?? [];
        return rv.map((v) => (
          <input
            key={v}
            type="hidden"
            name={nm}
            value={v}
          />
        ));
      }}
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={() => openState.value}
        aria-label={() => {
          const rv = readMaybeSignal(value) ?? [];
          const selectedLabels = rv
            .map((v) => options.find((o) => o.value === v)?.label ?? v)
            .filter(Boolean);
          const summaryText = selectedLabels.length > 0
            ? selectedLabels.join("、")
            : "";
          return summaryText ? `已选：${summaryText}` : placeholder;
        }}
        class={twMerge(
          "w-full flex items-center justify-between gap-2 text-left min-w-0",
          pickerTriggerSurface,
          controlBlueFocusRing(!hideFocusRing),
          sizeCls,
        )}
        onClick={() => {
          if (!disabled) openState((prev) => !prev);
        }}
      >
        <span
          class={() => {
            const rv = readMaybeSignal(value) ?? [];
            const selectedLabels = rv
              .map((v) => options.find((o) => o.value === v)?.label ?? v)
              .filter(Boolean);
            const summaryText = selectedLabels.length > 0
              ? selectedLabels.join("、")
              : "";
            return twMerge(
              "truncate min-w-0",
              summaryText
                ? "text-slate-900 dark:text-slate-100"
                : "text-slate-400 dark:text-slate-500",
            );
          }}
        >
          {() => {
            const rv = readMaybeSignal(value) ?? [];
            const selectedLabels = rv
              .map((v) => options.find((o) => o.value === v)?.label ?? v)
              .filter(Boolean);
            const summaryText = selectedLabels.length > 0
              ? selectedLabels.join("、")
              : "";
            return summaryText || placeholder;
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
        /* 同 {@link Select}：避免 `display: contents` 导致下拉 `absolute` 锚点错乱 */
      }
      <Show when={() => openState.value}>
        {[
          typeof globalThis !== "undefined" &&
          (() => {
            const g = globalThis as unknown as Record<
              string,
              (() => void) | undefined
            >;
            g[DROPDOWN_ESC_KEY] = closePanel;
            return null;
          })(),
          <div
            key="multiselect-dd-backdrop"
            class="fixed inset-0 z-40"
            aria-hidden="true"
            onClick={closePanel}
          />,
          <div
            key="multiselect-dd-list"
            role="listbox"
            aria-label="多选列表"
            aria-multiselectable="true"
            class="absolute z-50 top-full left-0 right-0 mt-1 flex max-h-72 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800"
          >
            <div class="flex w-full shrink-0 items-center justify-between gap-2 border-b border-slate-100 p-2 dark:border-slate-700">
              <div class="flex flex-wrap gap-1">
                <button
                  type="button"
                  class={btnCls}
                  disabled={() => {
                    const rv = readMaybeSignal(value) ?? [];
                    const allSelected = selectableValues.length > 0 &&
                      selectableValues.every((v) => rv.includes(v));
                    return disabled || allSelected;
                  }}
                  onClick={() => triggerChange([...selectableValues])}
                >
                  全选
                </button>
                <button
                  type="button"
                  class={btnCls}
                  disabled={() => {
                    const rv = readMaybeSignal(value) ?? [];
                    return disabled || rv.length === 0;
                  }}
                  onClick={() => triggerChange([])}
                >
                  清空
                </button>
              </div>
              <button
                type="button"
                class={doneBtnCls}
                disabled={disabled}
                onClick={closePanel}
              >
                完成
              </button>
            </div>
            <div
              class={twMerge(
                "max-h-60 overflow-y-auto",
                disabled && "pointer-events-none opacity-50",
              )}
            >
              {options.map((opt) => (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={() =>
                    (readMaybeSignal(value) ?? []).includes(opt.value)}
                  aria-disabled={opt.disabled}
                  class={() => {
                    const rv = readMaybeSignal(value) ?? [];
                    const selected = rv.includes(opt.value);
                    return twMerge(
                      optionRowBase,
                      selected &&
                        "bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
                      opt.disabled &&
                        "cursor-not-allowed opacity-50 hover:bg-transparent dark:hover:bg-transparent",
                    );
                  }}
                  onClick={() =>
                    toggleOption(
                      opt.value,
                      opt.disabled,
                      readMaybeSignal(value) ?? [],
                    )}
                >
                  <span
                    class={() => {
                      const rv = readMaybeSignal(value) ?? [];
                      const selected = rv.includes(opt.value);
                      return twMerge(
                        "flex size-4 shrink-0 items-center justify-center rounded border",
                        selected
                          ? "border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500"
                          : "border-slate-300 dark:border-slate-500",
                        opt.disabled && "opacity-50",
                      );
                    }}
                    aria-hidden="true"
                  >
                    {() => {
                      const rv = readMaybeSignal(value) ?? [];
                      const selected = rv.includes(opt.value);
                      return selected
                        ? (
                          <svg
                            class="size-3"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )
                        : null;
                    }}
                  </span>
                  <span class="flex-1">{opt.label}</span>
                </div>
              ))}
            </div>
          </div>,
        ]}
      </Show>
    </span>
  );
}

/**
 * 多选：默认浮层；`appearance="native"` 时原生 multiple + 全选/清空。
 */
export function MultiSelect(props: MultiSelectProps): JSXRenderable {
  const { appearance = "dropdown", ...rest } = props;
  if (appearance === "native") {
    return MultiSelectNativeBranch(rest);
  }
  return MultiSelectDropdownBranch(rest);
}
