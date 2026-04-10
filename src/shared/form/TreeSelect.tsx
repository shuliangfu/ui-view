/** 树选择展示形态：`dropdown` 缩进浮层；`native` 单原生 select，选项文案为完整路径（移动触控） */
export type TreeSelectAppearance = "dropdown" | "native";

/**
 * TreeSelect 树选择（共享实现，桌面/移动由 `appearance` 区分）。
 *
 * **和 {@link Select} 的差别：**
 * - **Select**：`options` 已是**平铺**列表，每项一条 `{ value, label }`。
 * - **TreeSelect**：`options` 是**嵌套树**（`children`），适合接口直接返回部门树、类目树；组件负责展平，并在**下拉内用缩进 + 节点名**表现层级；**触发条**上仍显示完整路径（如 `研发 / 前端`），避免只显示「前端」时语义不清。
 *
 * 选中后对外 `value` 仍是节点 `value`（如 `fe`），`onChange` 与 Select 一样可用 `target.value`。
 */

import { createSignal, Show } from "@dreamer/view";
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

export interface TreeSelectOption {
  value: string;
  label: string;
  children?: TreeSelectOption[];
}

export interface TreeSelectProps {
  options: TreeSelectOption[];
  /** 当前选中节点的 value；见 {@link MaybeSignal} */
  value?: MaybeSignal<string>;
  size?: SizeVariant;
  disabled?: boolean;
  onChange?: (e: Event) => void;
  placeholder?: string;
  class?: string;
  name?: string;
  id?: string;
  /** 为 true 时隐藏聚焦激活态边框；默认 false 显示 ring */
  hideFocusRing?: boolean;
  /** `native` 时用原生 select + 大触控区，选项文案为展平后的完整路径 */
  appearance?: TreeSelectAppearance;
}

/** 展平后的每一项：下拉里用 nodeLabel + depth，触发条用 fullPath */
interface FlatTreeItem {
  value: string;
  nodeLabel: string;
  fullPath: string;
  depth: number;
}

/**
 * 前序展平树：记录深度供缩进，并生成完整路径供触发条与无障碍文案。
 *
 * @param opts - 当前层节点
 * @param ancestors - 祖先节点的展示名（不含当前节点）
 */
function flattenTreeSelectOptions(
  opts: TreeSelectOption[],
  ancestors: string[] = [],
): FlatTreeItem[] {
  const out: FlatTreeItem[] = [];
  const depth = ancestors.length;
  for (const o of opts) {
    const fullPath = ancestors.length > 0
      ? `${ancestors.join(" / ")} / ${o.label}`
      : o.label;
    out.push({
      value: o.value,
      nodeLabel: o.label,
      fullPath,
      depth,
    });
    if (o.children?.length) {
      out.push(
        ...flattenTreeSelectOptions(o.children, [...ancestors, o.label]),
      );
    }
  }
  return out;
}

const sizeClassesDropdown: Record<SizeVariant, string> = {
  xs: "px-2.5 py-1 text-xs rounded-md",
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-3 py-2 text-sm rounded-lg",
  lg: "px-4 py-2.5 text-base rounded-lg",
};

const sizeClassesNative: Record<SizeVariant, string> = {
  xs: "px-3 py-2 text-sm rounded-md min-h-[44px]",
  sm: "px-4 py-2.5 text-sm rounded-lg min-h-[44px]",
  md: "px-4 py-3 text-base rounded-lg min-h-[48px]",
  lg: "px-5 py-3.5 text-base rounded-lg min-h-[52px]",
};

/** 选项行：左右内边距由 depth 与内联 paddingLeft 控制（子层左侧递增缩进） */
const optionRowCls =
  "py-2 pr-3 text-sm text-left w-full cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed first:rounded-t-lg last:rounded-b-lg";

/** 与 Select / Dropdown 共用 Esc 关闭 */
const DROPDOWN_ESC_KEY = "__lastDropdownClose" as const;

/**
 * 原生单 select：展平树为 option，展示完整路径，适合移动端。
 *
 * @param props - 树选择 props（不含 appearance）
 */
function TreeSelectNativeBranch(props: Omit<TreeSelectProps, "appearance">) {
  const {
    options,
    size = "md",
    disabled = false,
    onChange,
    placeholder = "请选择",
    class: className,
    name,
    id,
    hideFocusRing = false,
    value,
  } = props;
  const flat = flattenTreeSelectOptions(options);
  const sizeCls = sizeClassesNative[size];

  /**
   * 选中值变更：写回 Signal 并触发 `onChange`。
   *
   * @param e - change 事件
   */
  const handleChange = (e: Event) => {
    const v = (e.target as HTMLSelectElement).value;
    commitMaybeSignal(value, v);
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
      <option value="">{placeholder}</option>
      {flat.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.fullPath}
        </option>
      ))}
    </select>
  );
}

/**
 * 树形单选：内部展平 + 自绘下拉（与 Select 视觉与交互一致）。
 * 展开态订阅隔离方式同 {@link Select}，避免双层 thunk + `openState` 导致无法展开。
 */
function TreeSelectDropdownBranch(props: Omit<TreeSelectProps, "appearance">) {
  const {
    options,
    size = "md",
    disabled = false,
    onChange,
    placeholder = "请选择",
    class: className,
    name,
    id,
    hideFocusRing = false,
    value,
  } = props;

  const openState = createSignal(false);
  const sizeCls = sizeClassesDropdown[size];
  /** 展平结果仅随 props.options 变；在同步体中计算即可 */
  const flat = flattenTreeSelectOptions(options);

  const triggerChange = (newValue: string) => {
    commitMaybeSignal(value, newValue);
    const synthetic = { target: { value: newValue } } as unknown as Event;
    onChange?.(synthetic);
    openState.value = false;
  };

  const handleBackdropClick = () => {
    openState.value = false;
  };

  return (
    <span class={twMerge("relative block w-full min-w-0", className)}>
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
          const rv = readMaybeSignal(value) ?? "";
          const selectedOption = flat.find((o) => o.value === rv);
          const displayText = selectedOption?.fullPath ?? placeholder;
          return displayText || placeholder || "树形选择";
        }}
        class={twMerge(
          "w-full min-w-0",
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
            const rv = readMaybeSignal(value) ?? "";
            const selectedOption = flat.find((o) => o.value === rv);
            return twMerge(
              "truncate min-w-0 text-left",
              selectedOption
                ? "text-slate-900 dark:text-slate-100"
                : "text-slate-400 dark:text-slate-500",
            );
          }}
        >
          {() => {
            const rv = readMaybeSignal(value) ?? "";
            const selectedOption = flat.find((o) => o.value === rv);
            return selectedOption?.fullPath ?? placeholder;
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
        /* 同 {@link Select}：避免 `display: contents` 导致下拉锚点错乱 */
      }
      <Show when={() => openState.value}>
        {[
          typeof globalThis !== "undefined" &&
          (() => {
            const g = globalThis as unknown as Record<
              string,
              (() => void) | undefined
            >;
            g[DROPDOWN_ESC_KEY] = handleBackdropClick;
            return null;
          })(),
          <div
            key="treeselect-dd-backdrop"
            class="fixed inset-0 z-40"
            aria-hidden="true"
            onClick={handleBackdropClick}
          />,
          <div
            key="treeselect-dd-list"
            role="listbox"
            aria-label="树形选项"
            class="absolute z-50 top-full left-0 right-0 mt-1 max-h-60 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-800"
          >
            <button
              type="button"
              role="option"
              aria-selected={() => (readMaybeSignal(value) ?? "") === ""}
              class={() =>
                twMerge(
                  optionRowCls,
                  "pl-3",
                  (readMaybeSignal(value) ?? "") === "" &&
                    "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                )}
              onClick={() => triggerChange("")}
            >
              {placeholder}
            </button>
            {flat.map((opt) => (
              <button
                type="button"
                key={opt.value}
                role="option"
                aria-selected={() =>
                  (readMaybeSignal(value) ?? "") === opt.value}
                aria-label={opt.fullPath}
                title={opt.fullPath}
                class={() =>
                  twMerge(
                    optionRowCls,
                    opt.depth === 0 && "pl-3",
                    (readMaybeSignal(value) ?? "") === opt.value &&
                      "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                  )}
                style={opt.depth > 0
                  ? { paddingLeft: `${0.75 + opt.depth * 0.75}rem` }
                  : undefined}
                onClick={() => triggerChange(opt.value)}
              >
                {opt.nodeLabel}
              </button>
            ))}
          </div>,
        ]}
      </Show>
    </span>
  );
}

/**
 * 树形单选：默认自绘下拉；`appearance="native"` 时为原生大触控 select。
 */
export function TreeSelect(props: TreeSelectProps) {
  const { appearance = "dropdown", ...rest } = props;
  if (appearance === "native") {
    return TreeSelectNativeBranch(rest);
  }
  return TreeSelectDropdownBranch(rest);
}
