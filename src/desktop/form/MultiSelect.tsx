/**
 * MultiSelect 多选下拉（桌面版）。
 * 与 {@link Select} 一致：点击触发器展开浮层，浮层内含全选/清空、「完成」（收起）、选项列表（非整页常显）。
 * 自定义实现（非原生 select multiple），支持 disabled 选项样式。
 */

import { createSignal } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { IconChevronDown } from "../../shared/basic/icons/ChevronDown.tsx";
import {
  controlBlueFocusRing,
  pickerTriggerSurface,
} from "../../shared/form/input-focus-ring.ts";
import type { SizeVariant } from "../../shared/types.ts";

/** 与 Select 共用 Esc 关闭注册键，需配合文档站 initDropdownEsc */
const DROPDOWN_ESC_KEY = "__lastDropdownClose" as const;

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  /** 当前选中值；可为 getter 以配合 View 细粒度更新 */
  value?: string[] | (() => string[]);
  size?: SizeVariant;
  disabled?: boolean;
  onChange?: (e: Event) => void;
  class?: string;
  name?: string;
  id?: string;
  /** 未选任何项时触发器上显示的占位文案 */
  placeholder?: string;
  /** 为 true 时隐藏触发器聚焦 ring */
  hideFocusRing?: boolean;
}

const sizeClasses: Record<SizeVariant, string> = {
  xs: "px-2.5 py-1 text-xs rounded-md",
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-3 py-2 text-sm rounded-lg",
  lg: "px-4 py-2.5 text-base rounded-lg",
};

const btnCls =
  "text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

/** 「完成」：仅关闭浮层；选中项已在点选时即时写入 value，无需再点确定提交 */
const doneBtnCls =
  "text-xs px-3 py-1 rounded border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 dark:border-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0";

const optionRowBase =
  "flex items-center gap-2 px-3 py-2 text-sm text-left w-full cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors";

/**
 * 桌面多选：触发条 + 浮层（全选/清空 + 勾选列表），交互对齐单选 {@link Select}。
 */
export function MultiSelect(props: MultiSelectProps) {
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

  /** 浮层是否展开 */
  const openState = createSignal(false);
  const sizeCls = sizeClasses[size];

  const triggerChange = (newVal: string[]) => {
    const synthetic = { target: { value: newVal } } as unknown as Event;
    onChange?.(synthetic);
  };

  /**
   * 切换某一选项的选中态（不自动关闭浮层，便于连续多选）。
   *
   * @param optValue - 选项 value
   * @param optDisabled - 选项是否禁用
   * @param resolvedValue - 当前已选列表（由调用方传入最新快照）
   */
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

  /** 关闭浮层（点遮罩、再点触发器、Esc） */
  const closePanel = () => {
    openState.value = false;
  };

  return () => {
    const resolvedValue = typeof value === "function" ? value() : (value ?? []);

    const selectableValues = options
      .filter((o) => !o.disabled)
      .map((o) => o.value);
    const allSelected = selectableValues.length > 0 &&
      selectableValues.every((v) => resolvedValue.includes(v));

    const selectedLabels = resolvedValue
      .map((v) => options.find((o) => o.value === v)?.label ?? v)
      .filter(Boolean);
    const summaryText = selectedLabels.length > 0
      ? selectedLabels.join("、")
      : "";

    return (
      <span class={twMerge("relative inline-block w-full", className)}>
        {name &&
          resolvedValue.map((v) => (
            <input key={v} type="hidden" name={name} value={v} />
          ))}
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={openState.value}
          aria-label={summaryText ? `已选：${summaryText}` : placeholder}
          class={twMerge(
            "w-full flex items-center justify-between gap-2 text-left min-w-0",
            pickerTriggerSurface,
            controlBlueFocusRing(!hideFocusRing),
            sizeCls,
          )}
          onClick={() => {
            if (!disabled) openState.value = (prev) => !prev;
          }}
        >
          <span
            class={twMerge(
              "truncate min-w-0",
              summaryText
                ? "text-slate-900 dark:text-slate-100"
                : "text-slate-400 dark:text-slate-500",
            )}
          >
            {summaryText || placeholder}
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
                g[DROPDOWN_ESC_KEY] = closePanel;
                return null;
              })()}
            <div
              class="fixed inset-0 z-40"
              aria-hidden="true"
              onClick={closePanel}
            />
            <div
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
                    disabled={disabled || allSelected}
                    onClick={() => triggerChange([...selectableValues])}
                  >
                    全选
                  </button>
                  <button
                    type="button"
                    class={btnCls}
                    disabled={disabled || resolvedValue.length === 0}
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
                {options.map((opt) => {
                  const selected = resolvedValue.includes(opt.value);
                  return (
                    <div
                      key={opt.value}
                      role="option"
                      aria-selected={selected}
                      aria-disabled={opt.disabled}
                      class={twMerge(
                        optionRowBase,
                        selected &&
                          "bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
                        opt.disabled &&
                          "cursor-not-allowed opacity-50 hover:bg-transparent dark:hover:bg-transparent",
                      )}
                      onClick={() =>
                        toggleOption(opt.value, opt.disabled, resolvedValue)}
                    >
                      <span
                        class={twMerge(
                          "flex size-4 shrink-0 items-center justify-center rounded border",
                          selected
                            ? "border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500"
                            : "border-slate-300 dark:border-slate-500",
                          opt.disabled && "opacity-50",
                        )}
                        aria-hidden="true"
                      >
                        {selected && (
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
                        )}
                      </span>
                      <span class="flex-1">{opt.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </span>
    );
  };
}
