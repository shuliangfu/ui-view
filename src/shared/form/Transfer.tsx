/**
 * Transfer 穿梭框（View，归类为表单组件）。
 * 双列选择；支持搜索、自定义渲染、禁用项、方向。列表项可选中（高亮）后通过中间按钮穿梭。
 */

import { createSignal } from "@dreamer/view/signal";
import { twMerge } from "tailwind-merge";

export interface TransferItem {
  /** 唯一 key */
  key: string;
  /** 标题 */
  title: string | unknown;
  /** 是否禁用 */
  disabled?: boolean;
}

export interface TransferProps {
  /** 数据源 */
  dataSource: TransferItem[];
  /** 右侧（已选）key 列表（受控）；可为 getter 以在点击时读到最新值，避免闭包陈旧 */
  targetKeys: string[] | (() => string[]);
  /** 变更回调（targetKeys 更新后） */
  onChange?: (targetKeys: string[]) => void;
  /** 左侧标题 */
  titles?: [string, string];
  /** 是否显示搜索框 */
  showSearch?: boolean;
  /** 搜索框占位 */
  searchPlaceholder?: [string, string];
  /** 受控搜索值 [左, 右]；需配合 onSearch 由父级更新以过滤列表 */
  searchValue?: [string, string];
  /** 搜索输入回调 */
  onSearch?: (direction: "left" | "right", value: string) => void;
  /** 自定义筛选（不传则按 title 字符串包含过滤）；与 searchValue 配合使用 */
  filterOption?: (inputValue: string, item: TransferItem) => boolean;
  /** 自定义列表项渲染 */
  render?: (item: TransferItem) => unknown;
  /** 列表样式（宽、高） */
  listStyle?: { width?: number; height?: number };
  /** 是否禁用 */
  disabled?: boolean;
  /** 额外 class */
  class?: string;
}

export function Transfer(props: TransferProps) {
  const {
    dataSource,
    targetKeys,
    onChange,
    titles = ["源列表", "目标列表"],
    showSearch = false,
    searchPlaceholder = ["搜索", "搜索"],
    searchValue,
    onSearch,
    filterOption,
    render,
    listStyle = { width: 200, height: 200 },
    disabled = false,
    class: className,
  } = props;

  const filterFn = (items: TransferItem[], q: string) => {
    if (!q.trim()) return items;
    const fn = filterOption ??
      ((input: string, item: TransferItem) =>
        String(item.title).toLowerCase().includes(input.toLowerCase()));
    return items.filter((i) => fn(q, i));
  };

  const leftSelectedKeysRef = createSignal<string[]>([]);
  const rightSelectedKeysRef = createSignal<string[]>([]);

  /** 在内部和点击时读取当前 targetKeys，支持 getter 避免闭包陈旧 */
  const getTargetKeys = () =>
    typeof targetKeys === "function" ? targetKeys() : targetKeys;

  const moveToRight = (keys: string[]) => {
    if (keys.length === 0) return;
    const current = getTargetKeys();
    onChange?.([...new Set([...current, ...keys])]);
    leftSelectedKeysRef.value = [];
  };
  const moveToLeft = (keys: string[]) => {
    if (keys.length === 0) return;
    const current = getTargetKeys();
    onChange?.(current.filter((k) => !keys.includes(k)));
    rightSelectedKeysRef.value = [];
  };

  /**
   * 渲染 getter：读 `getTargetKeys()`（可为父级 getter）与两侧选中 SignalRef，保证穿梭后列表与选中态更新。
   */
  return () => {
    const currentTargetKeys = getTargetKeys();
    const targetSet = new Set(currentTargetKeys);
    const leftRaw = dataSource.filter((i) => !targetSet.has(i.key));
    const rightRaw = dataSource.filter((i) => targetSet.has(i.key));
    const leftItems = filterFn(leftRaw, searchValue?.[0] ?? "");
    const rightItems = filterFn(rightRaw, searchValue?.[1] ?? "");

    return (
      <div
        class={twMerge(
          "transfer flex items-stretch gap-4",
          disabled && "opacity-60 pointer-events-none",
          className,
        )}
      >
        <TransferList
          title={titles[0]}
          items={leftItems}
          searchPlaceholder={searchPlaceholder[0]}
          showSearch={showSearch}
          searchValue={searchValue?.[0]}
          onSearch={(v) => onSearch?.("left", v)}
          render={render}
          listStyle={listStyle}
          selectedKeys={leftSelectedKeysRef.value}
          onToggleSelect={(key) => {
            leftSelectedKeysRef.value = (prev: string[]) =>
              prev.includes(key)
                ? prev.filter((k: string) => k !== key)
                : [...prev, key];
          }}
          onTransfer={(keys) => moveToRight(keys)}
          disabled={disabled}
        />
        <div class="flex flex-col justify-center gap-2">
          <button
            type="button"
            class="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
            onClick={() =>
              moveToRight(
                leftSelectedKeysRef.value.length > 0
                  ? leftSelectedKeysRef.value
                  : leftItems.filter((i) => !i.disabled).map((i) => i.key),
              )}
            aria-label="右移"
          >
            →
          </button>
          <button
            type="button"
            class="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
            onClick={() =>
              moveToLeft(
                rightSelectedKeysRef.value.length > 0
                  ? rightSelectedKeysRef.value
                  : rightItems.filter((i) => !i.disabled).map((i) => i.key),
              )}
            aria-label="左移"
          >
            ←
          </button>
        </div>
        <TransferList
          title={titles[1]}
          items={rightItems}
          searchPlaceholder={searchPlaceholder[1]}
          showSearch={showSearch}
          searchValue={searchValue?.[1]}
          onSearch={(v) => onSearch?.("right", v)}
          render={render}
          listStyle={listStyle}
          selectedKeys={rightSelectedKeysRef.value}
          onToggleSelect={(key) => {
            rightSelectedKeysRef.value = (prev: string[]) =>
              prev.includes(key)
                ? prev.filter((k: string) => k !== key)
                : [...prev, key];
          }}
          onTransfer={(keys) => moveToLeft(keys)}
          disabled={disabled}
        />
      </div>
    );
  };
}

function TransferList(
  listProps: {
    title: string;
    items: TransferItem[];
    searchPlaceholder: string;
    showSearch: boolean;
    searchValue?: string;
    onSearch?: (value: string) => void;
    render?: (item: TransferItem) => unknown;
    listStyle: { width?: number; height?: number };
    selectedKeys: string[];
    onToggleSelect: (key: string) => void;
    onTransfer: (keys: string[]) => void;
    disabled?: boolean;
  },
) {
  const {
    title,
    items,
    searchPlaceholder,
    showSearch,
    searchValue = "",
    onSearch,
    render,
    listStyle,
    selectedKeys,
    onToggleSelect,
    onTransfer,
    disabled = false,
  } = listProps;

  return (
    <div
      class="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden flex flex-col"
      style={{ width: listStyle.width ?? 200 }}
    >
      <div class="px-3 py-2 border-b border-slate-200 dark:border-slate-600 font-medium text-slate-700 dark:text-slate-300">
        {title}
      </div>
      {showSearch && (
        <input
          type="search"
          class="m-2 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 w-[calc(100%-1rem)]"
          placeholder={searchPlaceholder}
          value={searchValue}
          onInput={(e: Event) =>
            onSearch?.((e.target as HTMLInputElement).value)}
        />
      )}
      <ul
        class="overflow-auto flex-1 list-none m-0 p-1"
        style={{ height: listStyle.height ?? 200 }}
      >
        {items.map((item) => {
          const selected = selectedKeys.includes(item.key);
          return (
            <li key={item.key} class="list-none m-0 p-0">
              <button
                type="button"
                class={twMerge(
                  "w-full text-left px-2 py-1.5 rounded text-sm cursor-pointer border-0 bg-transparent",
                  item.disabled || disabled
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:bg-slate-100 dark:hover:bg-slate-700",
                  selected &&
                    "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200",
                )}
                data-key={item.key}
                disabled={item.disabled || disabled}
                onClick={() => {
                  if (item.disabled || disabled) return;
                  onToggleSelect(item.key);
                }}
                onDoubleClick={() => {
                  if (item.disabled || disabled) return;
                  onTransfer([item.key]);
                }}
              >
                {render ? render(item) : item.title}
              </button>
            </li>
          );
        })}
      </ul>
      <div class="px-2 py-1 text-xs text-slate-500 dark:text-slate-400">
        {items.length} 项
        {selectedKeys.length > 0 && `，已选 ${selectedKeys.length}`}
      </div>
    </div>
  );
}
