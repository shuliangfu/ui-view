/**
 * Transfer 穿梭框（桌面版，D）。
 * 双列：左侧候选、右侧已选；通过按钮或单项操作移动。无内部选中状态，由 targetKeys + onChange 受控。
 */

import { twMerge } from "tailwind-merge";

export interface TransferItem {
  key: string;
  label: string;
  disabled?: boolean;
}

/** 筛选函数：关键词与当前项，返回是否保留 */
export type TransferFilterOption = (
  keyword: string,
  item: TransferItem,
) => boolean;

export interface TransferProps {
  /** 数据源，每项 key 唯一 */
  dataSource: TransferItem[];
  /** 当前已选中的 key 列表（右侧）；可为 getter 以配合 View 细粒度更新 */
  targetKeys: string[] | (() => string[]);
  /** 选中变化回调 */
  onChange?: (targetKeys: string[]) => void;
  /** 左右两列标题 [左侧, 右侧] */
  titles?: [string, string];
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否显示左右列搜索框（需配合 filterLeft/filterRight 受控） */
  showSearch?: boolean;
  /** 左侧列搜索关键词（受控）；可为 getter */
  filterLeft?: string | (() => string);
  /** 右侧列搜索关键词（受控）；可为 getter */
  filterRight?: string | (() => string);
  /** 左侧搜索输入回调 */
  onFilterLeftChange?: (e: Event) => void;
  /** 右侧搜索输入回调 */
  onFilterRightChange?: (e: Event) => void;
  /** 自定义筛选逻辑，默认按 label 包含关键词（不区分大小写） */
  filterOption?: TransferFilterOption;
  /** 搜索框占位文案 [左侧, 右侧] */
  searchPlaceholder?: [string, string];
  /** 额外 class（作用于容器） */
  class?: string;
}

/** 默认按 label 包含关键词（不区分大小写） */
const defaultFilterOption: TransferFilterOption = (keyword, item) =>
  !keyword.trim() ||
  item.label.toLowerCase().includes(keyword.trim().toLowerCase());

const panelCls =
  "border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 overflow-hidden flex flex-col min-w-[200px] max-w-[280px]";
const headerCls =
  "px-3 py-2 border-b border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800";
const searchInputCls =
  "w-full mt-1 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500";
const listCls = "flex-1 overflow-auto p-1 max-h-[240px]";
const itemCls =
  "flex items-center justify-between gap-2 px-2 py-1.5 rounded text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700";
const btnCls =
  "shrink-0 p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500";
const centerCls = "flex flex-col justify-center gap-2 px-2";

export function Transfer(props: TransferProps) {
  const {
    dataSource,
    targetKeys,
    onChange,
    titles = ["源列表", "目标列表"],
    disabled = false,
    showSearch = false,
    filterLeft,
    filterRight,
    onFilterLeftChange,
    onFilterRightChange,
    filterOption = defaultFilterOption,
    searchPlaceholder = ["搜索", "搜索"],
    class: className,
  } = props;

  const moveToRight = (keys: string[]) => {
    if (disabled || keys.length === 0 || !onChange) return;
    const current = typeof targetKeys === "function"
      ? targetKeys()
      : (targetKeys ?? []);
    const set = new Set(current);
    keys.forEach((k) => set.add(k));
    onChange([...set]);
  };

  const moveToLeft = (keys: string[]) => {
    if (disabled || keys.length === 0 || !onChange) return;
    const current = typeof targetKeys === "function"
      ? targetKeys()
      : (targetKeys ?? []);
    onChange(current.filter((k) => !keys.includes(k)));
  };

  return () => {
    const keys = typeof targetKeys === "function"
      ? targetKeys()
      : (targetKeys ?? []);
    const fl = typeof filterLeft === "function"
      ? filterLeft()
      : (filterLeft ?? "");
    const fr = typeof filterRight === "function"
      ? filterRight()
      : (filterRight ?? "");
    const leftSource = dataSource.filter((item) => !keys.includes(item.key));
    const rightSource = dataSource.filter((item) => keys.includes(item.key));
    const leftItems = showSearch
      ? leftSource.filter((item) => filterOption(fl, item))
      : leftSource;
    const rightItems = showSearch
      ? rightSource.filter((item) => filterOption(fr, item))
      : rightSource;

    return (
      <div
        class={twMerge("inline-flex items-stretch gap-2", className)}
        role="listbox"
        aria-label="穿梭框"
      >
        {/* 左侧：候选 */}
        <div class={panelCls}>
          <div class={headerCls}>
            {titles[0]}
            {showSearch && (
              <input
                type="search"
                class={searchInputCls}
                placeholder={searchPlaceholder[0]}
                value={fl}
                disabled={disabled}
                onInput={onFilterLeftChange}
                aria-label={`筛选${titles[0]}`}
              />
            )}
          </div>
          <div class={listCls}>
            {leftItems.length === 0
              ? (
                <div class="px-2 py-4 text-sm text-slate-400 dark:text-slate-500 text-center">
                  暂无数据
                </div>
              )
              : (
                leftItems.map((item) => (
                  <div key={item.key} class={itemCls}>
                    <span>{item.label}</span>
                    <button
                      type="button"
                      class={btnCls}
                      disabled={disabled || item.disabled}
                      onClick={() => moveToRight([item.key])}
                      aria-label={`将 ${item.label} 移至右侧`}
                    >
                      →
                    </button>
                  </div>
                ))
              )}
          </div>
        </div>

        {/* 中间：批量操作按钮 */}
        <div class={centerCls}>
          <button
            type="button"
            class={btnCls}
            disabled={disabled || leftItems.length === 0}
            onClick={() =>
              moveToRight(
                leftItems.filter((i) => !i.disabled).map((i) => i.key),
              )}
            aria-label="全部移至右侧"
          >
            »
          </button>
          <button
            type="button"
            class={btnCls}
            disabled={disabled || rightItems.length === 0}
            onClick={() => moveToLeft(rightItems.map((i) => i.key))}
            aria-label="全部移至左侧"
          >
            «
          </button>
        </div>

        {/* 右侧：已选 */}
        <div class={panelCls}>
          <div class={headerCls}>
            {titles[1]}
            {showSearch && (
              <input
                type="search"
                class={searchInputCls}
                placeholder={searchPlaceholder[1]}
                value={fr}
                disabled={disabled}
                onInput={onFilterRightChange}
                aria-label={`筛选${titles[1]}`}
              />
            )}
          </div>
          <div class={listCls}>
            {rightItems.length === 0
              ? (
                <div class="px-2 py-4 text-sm text-slate-400 dark:text-slate-500 text-center">
                  暂无数据
                </div>
              )
              : (
                rightItems.map((item) => (
                  <div key={item.key} class={itemCls}>
                    <span>{item.label}</span>
                    <button
                      type="button"
                      class={btnCls}
                      disabled={disabled || item.disabled}
                      onClick={() => moveToLeft([item.key])}
                      aria-label={`将 ${item.label} 移至左侧`}
                    >
                      ←
                    </button>
                  </div>
                ))
              )}
          </div>
        </div>
      </div>
    );
  };
}
