/**
 * Select 单选：**仅**自绘下拉（触发按钮 + listbox 浮层），不渲染原生 `<select>`。
 * 须通过 {@link SelectProps.options} 传入选项；未传时视为空列表。
 */

import { createEffect, createSignal, onCleanup } from "@dreamer/view";
import {
  installInlineDropdownOutsideClickClose,
  pickInlineDropdownOption,
  syncInlineDropdownPanelVisibility,
} from "./inline-dropdown-outside-click.ts";
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
  /** 根节点：触发器 + 内联 listbox，供点外部关闭判断 */
  let rootEl: HTMLElement | null = null;
  /** 浮层包裹（backdrop + listbox），用 hidden 控制显隐，避免 Show 卸载后选项 click 失效 */
  let panelEl: HTMLElement | null = null;

  /** 关闭下拉浮层 */
  const closePanel = () => {
    openState.value = false;
  };

  /**
   * 同步关 + 微任务再关一次，避免批处理末尾仍被写成开（与 Cascader 一致）。
   */
  const scheduleClosePanel = () => {
    closePanel();
    queueMicrotask(() => {
      if (openState.value) {
        openState.value = false;
      }
    });
  };

  installInlineDropdownOutsideClickClose(
    () => openState.value,
    () => rootEl,
    closePanel,
  );

  syncInlineDropdownPanelVisibility(
    () => openState.value,
    () => panelEl,
  );

  createEffect(() => {
    if (!openState.value) return;
    const g = globalThis as unknown as Record<
      string,
      (() => void) | undefined
    >;
    g[DROPDOWN_ESC_KEY] = closePanel;
    onCleanup(() => {
      if (g[DROPDOWN_ESC_KEY] === closePanel) {
        delete g[DROPDOWN_ESC_KEY];
      }
    });
  });

  /**
   * 选中某项：写回 Signal、派发合成 change、收起浮层。
   * 同值重复调用（pointerdown + click 双路径）只派发一次 onChange。
   */
  const triggerChange = (newValue: string) => {
    const prev = readMaybeSignal(value) ?? "";
    commitMaybeSignal(value, newValue);
    if (prev !== newValue) {
      const synthetic = { target: { value: newValue } } as unknown as Event;
      onChange?.(synthetic);
    }
    scheduleClosePanel();
  };

  return (
    <span
      ref={(el: HTMLElement | null) => {
        rootEl = el;
      }}
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
          if (disabled) return;
          if (openState.value) {
            closePanel();
            return;
          }
          queueMicrotask(() => {
            if (!disabled && !openState.value) {
              openState.value = true;
            }
          });
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
      <div
        ref={(el: HTMLElement | null) => {
          panelEl = el;
        }}
        class="hidden"
        aria-hidden="true"
        data-ui-select-panel=""
      >
        <div
          class="fixed inset-0 z-40"
          aria-hidden="true"
          onClick={closePanel}
        />
        <div
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
              onPointerDown={(e: Event) => {
                pickInlineDropdownOption(e, () => triggerChange(""));
              }}
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
              onPointerDown={(e: Event) => {
                pickInlineDropdownOption(
                  e,
                  () => triggerChange(opt.value),
                  opt.disabled,
                );
              }}
              onClick={() => {
                if (!opt.disabled) triggerChange(opt.value);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
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
