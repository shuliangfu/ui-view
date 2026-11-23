/**
 * MultiSelect 多选：`appearance` 切换**自定义浮层**与**原生 multiple + 全选/清空**（移动友好）。
 */

import {
  createEffect,
  createSignal,
  type JSXRenderable,
  onCleanup,
  useContext,
} from "@dreamer/view";
import {
  bindFixedDropdownPanelWhenOpen,
  installInlineDropdownOutsideClickClose,
  pickInlineDropdownOption,
  syncInlineDropdownPanelVisibility,
} from "./inline-dropdown-outside-click.ts";
import {
  pickerPortalZClass,
  resolvePickerViewportAttach,
} from "./picker-portal-utils.ts";
import { twMerge } from "tailwind-merge";
import { IconChevronDown } from "../basic/icons/ChevronDown.tsx";
import {
  controlBlueFocusRing,
  controlErrorBorder,
  controlErrorFocusRing,
  nativeSelectSurface,
  pickerTriggerSurface,
} from "./input-focus-ring.ts";
import {
  resolveFormControlDisabled,
  resolveFormControlSize,
} from "./form-control-context.ts";
import { FieldClearSlot } from "./field-clear-button.tsx";
import { FormItemControlIdContext } from "./form-item-control-id.ts";
import { createOptionalValueState, type MaybeSignal } from "./maybe-signal.ts";
import {
  focusSelectAllHost,
  isSelectAllHotkey,
  preventSelectAllDefault,
  setSelectAllHost,
  toggleSelectAllKeys,
} from "../select-all-hotkey.ts";
import type { SizeVariant } from "../types.ts";
import { autoFocusAttr, bindAutoFocusRef } from "./auto-focus.ts";

/** 与 Select 共用 Esc 关闭注册键，需配合文档站 initDropdownEsc */
const DROPDOWN_ESC_KEY = "__lastDropdownClose" as const;

/** 展示形态 */
export type MultiSelectAppearance = "dropdown" | "native";

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * MultiSelect 内置文案。
 */
export interface MultiSelectMessages {
  /** 占位默认文案；与 {@link MultiSelectProps.placeholder} 同义，后者优先 */
  placeholder: string;
  /** 全选按钮 */
  selectAll: string;
  /** 清空按钮 */
  clear: string;
  /** 完成按钮 */
  done: string;
  /** 触发条 `aria-label` 摘要文案，参数为已选 label 拼接（如「上海、北京」） */
  selectedSummary: (summary: string) => string;
  /** 下拉列表 `aria-label` */
  listbox: string;
  /** 搜索框占位 */
  searchPlaceholder: string;
  /** 无匹配选项 */
  noMatch: string;
  /** 加载中文案 */
  loading: string;
}

/** 默认中文文案 */
export const defaultMultiSelectMessages: MultiSelectMessages = {
  placeholder: "请选择",
  selectAll: "全选",
  clear: "清空",
  done: "完成",
  selectedSummary: (summary) => `已选：${summary}`,
  listbox: "多选列表",
  searchPlaceholder: "搜索",
  noMatch: "无匹配选项",
  loading: "加载中…",
};

export interface MultiSelectProps {
  options: MultiSelectOption[];
  /** 当前选中值；见 {@link MaybeSignal} */
  value?: MaybeSignal<string[]>;
  size?: SizeVariant;
  disabled?: boolean;
  /** 错误状态（触发器红框）；可与 FormItem / createForm bind 联用 */
  error?: boolean;
  onChange?: (e: Event) => void;
  /** 触发器失焦（可用于 blur 校验） */
  onBlur?: (e: Event) => void;
  class?: string;
  name?: string;
  id?: string;
  /**
   * 挂载后自动聚焦触发器或可输入框。会写出原生 `autofocus`，并在插入 DOM 时调用 `focus()`，
   * 以便动态出现的控件也能聚焦。
   */
  autoFocus?: boolean;
  /** 未选任何项时触发器上显示的占位文案（仅 dropdown） */
  placeholder?: string;
  /** 为 true 时隐藏触发器聚焦 ring */
  hideFocusRing?: boolean;
  /** `dropdown`：浮层多选；`native`：原生 multiple + 大触控区 */
  appearance?: MultiSelectAppearance;
  /** 多语言/自定义文案；未传字段走 {@link defaultMultiSelectMessages} */
  messages?: Partial<MultiSelectMessages>;
  /** 有选中值时在触发器上显示清除按钮 */
  allowClear?: boolean;
  /** 在浮层中显示搜索框，按 label / value 过滤 */
  showSearch?: boolean;
  /** 加载中：触发器不可打开 */
  loading?: boolean;
  /**
   * 浮层挂载。默认 `anchored`（相对触发器 absolute）；
   * `viewport` 时改为视口 `fixed`，避免被表格 overflow 裁切。单元格编辑应传 `viewport`。
   * 位于 Modal 正文或其它会裁切的 overflow 祖先内时，即使未传也会自动升级为 `viewport`，避免被底栏挡住。
   */
  panelAttach?: "anchored" | "viewport";
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
 * 原生 multiple 分支。
 * 外壳与 `<select>` 稳定；全选/清空按钮与 option `selected` 用局部 getter 订阅 value，
 * 避免外层 `return () => { readMaybeSignal(value) }` 整段重建（列表滚动/焦点丢失）。
 *
 * @param props - 与 {@link MultiSelect} 相同（不含 appearance）
 */
function MultiSelectNativeBranch(props: Omit<MultiSelectProps, "appearance">) {
  const {
    options,
    value: valueProp,
    size: sizeProp,
    error = false,
    onChange,
    onBlur,
    class: className,
    name,
    id,
    autoFocus = false,
    hideFocusRing = false,
    messages,
  } = props;
  const disabled = resolveFormControlDisabled(props.disabled);
  const selected = createOptionalValueState(valueProp, [] as string[]);
  const m = { ...defaultMultiSelectMessages, ...messages };
  const size = resolveFormControlSize(sizeProp);
  const sizeCls = sizeClassesNative[size];
  const fromFormItem = useContext(FormItemControlIdContext);
  const resolvedId = id ?? fromFormItem;
  const allValues = options.map((o) => o.value);

  const triggerChange = (newVal: string[]) => {
    selected.commit(newVal);
    const synthetic = { target: { value: newVal } } as unknown as Event;
    onChange?.(synthetic);
  };

  const selectAllOptions = (event: KeyboardEvent) => {
    if (disabled || !isSelectAllHotkey(event)) return;
    preventSelectAllDefault(event);
    const all = options.filter((opt) => !opt.disabled).map((opt) => opt.value);
    const current = selected.read();
    triggerChange(toggleSelectAllKeys(current, all));
  };

  return (
    <span
      ref={(el: HTMLElement | null) => {
        if (!el || disabled) return;
        setSelectAllHost(el, () => {
          const all = options.filter((opt) => !opt.disabled).map((opt) =>
            opt.value
          );
          const current = selected.read();
          triggerChange(toggleSelectAllKeys(current, all));
        });
      }}
      class="block"
      tabindex="-1"
      data-select-all-host=""
      onMouseDown={focusSelectAllHost}
      onKeyDown={selectAllOptions}
    >
      {() => {
        const value = selected.read();
        const allSelected = allValues.length > 0 &&
          allValues.every((v) => value.includes(v));
        return (
          <div class="flex gap-1 mb-1">
            <button
              type="button"
              class={btnCls}
              disabled={disabled || allSelected}
              onClick={() => triggerChange([...allValues])}
            >
              {m.selectAll}
            </button>
            <button
              type="button"
              class={btnCls}
              disabled={disabled || value.length === 0}
              onClick={() => triggerChange([])}
            >
              {m.clear}
            </button>
          </div>
        );
      }}
      <select
        multiple
        ref={bindAutoFocusRef(undefined, autoFocus)}
        id={resolvedId}
        name={name}
        disabled={disabled}
        {...autoFocusAttr(autoFocus)}
        aria-invalid={error}
        class={twMerge(
          "w-full touch-manipulation",
          nativeSelectSurface,
          controlBlueFocusRing(!hideFocusRing && !error),
          error && controlErrorBorder,
          error && !hideFocusRing && controlErrorFocusRing(true),
          sizeCls,
          className,
        )}
        onChange={onChange}
        onBlur={onBlur}
      >
        {() => {
          const value = selected.read();
          return options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
              selected={value.includes(opt.value)}
            >
              {opt.label}
            </option>
          ));
        }}
      </select>
    </span>
  );
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
    size: sizeProp,
    error = false,
    onChange,
    onBlur,
    class: className,
    name,
    id,
    autoFocus = false,
    hideFocusRing = false,
    messages,
    allowClear = false,
    showSearch = false,
    loading = false,
    panelAttach = "anchored",
  } = props;
  const disabled = resolveFormControlDisabled(props.disabled);
  const selected = createOptionalValueState(value, [] as string[]);
  const m = { ...defaultMultiSelectMessages, ...messages };
  const placeholder = props.placeholder ?? m.placeholder;
  const size = resolveFormControlSize(sizeProp);
  const fromFormItem = useContext(FormItemControlIdContext);
  const resolvedId = id ?? fromFormItem;

  const openState = createSignal(false);
  const searchQuery = createSignal("");
  const sizeCls = sizeClassesDropdown[size];
  let rootEl: HTMLElement | null = null;
  let panelEl: HTMLElement | null = null;
  let listboxEl: HTMLElement | null = null;
  const triggerRef: { current: HTMLElement | null } = { current: null };
  const viewportPanel = createSignal(panelAttach === "viewport");
  const useViewportPanel = () =>
    resolvePickerViewportAttach(
      panelAttach === "viewport" || viewportPanel.value
        ? "viewport"
        : "anchored",
      triggerRef.current ?? rootEl,
    );
  const refreshViewportAttach = () => {
    viewportPanel.value = resolvePickerViewportAttach(
      panelAttach,
      triggerRef.current ?? rootEl,
    );
  };
  /** 已在 pointerdown 提交的选项；直到对应 click 才消费，不能按时间过期。 */
  let pointerPickedValue: string | undefined;

  const triggerChange = (newVal: string[]) => {
    selected.commit(newVal);
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
    pointerPickedValue = undefined;
    openState.value = false;
    searchQuery.value = "";
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

  bindFixedDropdownPanelWhenOpen(
    useViewportPanel,
    () => openState.value,
    () => listboxEl,
    triggerRef,
    closePanel,
    216,
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

  const selectableValues = options
    .filter((o) => !o.disabled)
    .map((o) => o.value);

  const selectAllOptions = (event: KeyboardEvent) => {
    if (disabled || !isSelectAllHotkey(event)) return;
    preventSelectAllDefault(event);
    const current = selected.read();
    triggerChange(toggleSelectAllKeys(current, selectableValues));
  };

  return (
    <span
      ref={(el: HTMLElement | null) => {
        rootEl = el;
        if (el) refreshViewportAttach();
        if (!el || disabled) return;
        setSelectAllHost(el, () => {
          const current = selected.read();
          triggerChange(toggleSelectAllKeys(current, selectableValues));
        });
      }}
      class={twMerge("relative block w-full min-w-0", className)}
      tabindex="-1"
      data-select-all-host=""
      onMouseDown={focusSelectAllHost}
      onKeyDown={selectAllOptions}
    >
      {() => {
        const nm = name;
        if (!nm) return null;
        const rv = selected.read();
        return rv.map((v) => (
          <input
            key={v}
            type="hidden"
            name={nm}
            value={v}
          />
        ));
      }}
      <span class="relative block w-full">
        <button
          type="button"
          ref={(el: HTMLButtonElement | null) => {
            triggerRef.current = el;
            const af = bindAutoFocusRef(undefined, autoFocus);
            if (typeof af === "function") af(el);
          }}
          id={resolvedId}
          disabled={disabled || loading}
          aria-busy={loading || undefined}
          aria-invalid={error}
          aria-haspopup="listbox"
          aria-expanded={() => openState.value}
          {...autoFocusAttr(autoFocus)}
          aria-label={() => {
            const rv = selected.read();
            const selectedLabels = rv
              .map((v) => options.find((o) => o.value === v)?.label ?? v)
              .filter(Boolean);
            const summaryText = selectedLabels.length > 0
              ? selectedLabels.join("、")
              : "";
            return summaryText ? m.selectedSummary(summaryText) : placeholder;
          }}
          class={twMerge(
            "w-full flex items-center justify-between gap-2 text-left min-w-0",
            pickerTriggerSurface,
            controlBlueFocusRing(!hideFocusRing && !error),
            error && controlErrorBorder,
            error && !hideFocusRing && controlErrorFocusRing(true),
            sizeCls,
          )}
          onBlur={onBlur}
          onClick={() => {
            if (disabled || loading) return;
            if (openState.value) {
              closePanel();
              return;
            }
            queueMicrotask(() => {
              if (!disabled && !loading && !openState.value) {
                refreshViewportAttach();
                openState.value = true;
              }
            });
          }}
        >
          <span
            class={() => {
              const rv = selected.read();
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
              const rv = selected.read();
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
                !loading && openState.value && "rotate-180",
              )}
          >
            {loading
              ? (
                <span
                  class="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                  aria-hidden
                />
              )
              : <IconChevronDown size="sm" />}
          </span>
        </button>
        {allowClear && !disabled && (
          <FieldClearSlot
            class="absolute right-8 top-1/2 z-1 -translate-y-1/2"
            visible={() => selected.read().length > 0 && !loading}
            label={m.clear}
            onClear={() => triggerChange([])}
          />
        )}
      </span>
      <div
        ref={(el: HTMLElement | null) => {
          panelEl = el;
        }}
        class="hidden"
        aria-hidden="true"
        data-ui-multiselect-panel=""
      >
        {() =>
          useViewportPanel() ? null : (
            <div
              class="fixed inset-0 z-40"
              aria-hidden="true"
              onClick={closePanel}
            />
          )}
        <div
          ref={(el: HTMLElement | null) => {
            listboxEl = el;
          }}
          role="listbox"
          aria-label={m.listbox}
          aria-multiselectable="true"
          class={() =>
            twMerge(
              "flex max-h-72 w-max flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800",
              useViewportPanel()
                ? twMerge("fixed", pickerPortalZClass)
                : "absolute top-full left-0 z-50 mt-1 min-w-[max(100%,13.5rem)]",
            )}
        >
          <div class="flex w-full shrink-0 items-center justify-between gap-2 border-b border-slate-100 p-2 dark:border-slate-700">
            <div class="flex gap-1">
              <button
                type="button"
                class={btnCls}
                disabled={() => {
                  const rv = selected.read();
                  const allSelected = selectableValues.length > 0 &&
                    selectableValues.every((v) => rv.includes(v));
                  return disabled || allSelected;
                }}
                onClick={() => triggerChange([...selectableValues])}
              >
                {m.selectAll}
              </button>
              <button
                type="button"
                class={btnCls}
                disabled={() => {
                  const rv = selected.read();
                  return disabled || rv.length === 0;
                }}
                onClick={() => triggerChange([])}
              >
                {m.clear}
              </button>
            </div>
            <button
              type="button"
              class={doneBtnCls}
              disabled={disabled}
              onClick={closePanel}
            >
              {m.done}
            </button>
          </div>
          {showSearch && (
            <div
              class="shrink-0 border-b border-slate-100 px-2 py-1 dark:border-slate-700"
              onPointerDown={(e: Event) => e.stopPropagation()}
            >
              <input
                type="search"
                class="w-full rounded-md border border-slate-200 dark:border-slate-600 bg-transparent px-2 py-1 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                placeholder={m.searchPlaceholder}
                value={() => searchQuery.value}
                onInput={(e: Event) => {
                  searchQuery.value = (e.target as HTMLInputElement).value;
                }}
              />
            </div>
          )}
          <div
            class={twMerge(
              "max-h-60 overflow-y-auto",
              disabled && "pointer-events-none opacity-50",
            )}
          >
            {() => {
              const q = searchQuery.value.trim().toLowerCase();
              const filtered = q
                ? options.filter((opt) =>
                  opt.label.toLowerCase().includes(q) ||
                  opt.value.toLowerCase().includes(q)
                )
                : options;
              if (filtered.length === 0) {
                return (
                  <div class="px-3 py-2 text-sm text-slate-400 dark:text-slate-500">
                    {loading ? m.loading : m.noMatch}
                  </div>
                );
              }
              return filtered.map((opt) => (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={() => (selected.read()).includes(opt.value)}
                  aria-disabled={opt.disabled}
                  class={() => {
                    const rv = selected.read();
                    const isSelected = rv.includes(opt.value);
                    return twMerge(
                      optionRowBase,
                      isSelected &&
                        "bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
                      opt.disabled &&
                        "cursor-not-allowed opacity-50 hover:bg-transparent dark:hover:bg-transparent",
                    );
                  }}
                  onPointerDown={(e: Event) => {
                    pickInlineDropdownOption(e, () => {
                      pointerPickedValue = opt.value;
                      toggleOption(
                        opt.value,
                        opt.disabled,
                        selected.read(),
                      );
                    }, opt.disabled);
                  }}
                  onPointerCancel={() => {
                    pointerPickedValue = undefined;
                  }}
                  onClick={(e: Event) => {
                    // 物理 click 的 detail > 0；键盘/辅助技术的 detail=0 仍可独立激活。
                    // 按住鼠标可以跨任意多个 task，绝不能用 timer 或 microtask 清旗。
                    const alreadyPicked = pointerPickedValue === opt.value &&
                      (e as MouseEvent).detail > 0;
                    pointerPickedValue = undefined;
                    if (alreadyPicked) return;
                    toggleOption(
                      opt.value,
                      opt.disabled,
                      selected.read(),
                    );
                  }}
                >
                  <span
                    class={() => {
                      const rv = selected.read();
                      const isSelected = rv.includes(opt.value);
                      return twMerge(
                        "flex size-4 shrink-0 items-center justify-center rounded border",
                        isSelected
                          ? "border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500"
                          : "border-slate-300 dark:border-slate-500",
                        opt.disabled && "opacity-50",
                      );
                    }}
                    aria-hidden="true"
                  >
                    {() => {
                      const rv = selected.read();
                      const isSelected = rv.includes(opt.value);
                      return isSelected
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
              ));
            }}
          </div>
        </div>
      </div>
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
