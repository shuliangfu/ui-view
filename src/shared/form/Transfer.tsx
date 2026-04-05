/**
 * Transfer 穿梭框（View，归类为表单组件）。
 * 双列选择；支持搜索、自定义渲染、禁用项、方向。列表项可选中（高亮）后通过中间按钮穿梭。
 *
 * **避免整块重挂载：**
 * 1. 外层 `return ()` **不读取** `leftSearchRef` / `rightSearchRef`，也**不读取** `selectedKeysRef.value`，
 *    仅追踪 `targetKeys`（及 dataSource 等），否则每点选一项或每键入一字都会重建整棵 `div.transfer`（含中间箭头区），导致失焦。
 * 2. 左右列 + 中间箭头为**同级 JSX**（flex 一行），避免「两列各包一层 **函数子响应式插入**、中间是本征 div」时浏览器分段绘制。
 * 3. 列表的 **函数子响应式插入** **不订阅** `searchRef`：列内 `localQuery` + `listVersion` 作刷新节拍，
 *    输入时 bump `listVersion`；仍把 `searchRef.value` 同步给中间箭头 onClick。`onSearch` 用 `queueMicrotask` 推迟。
 */

import {
  createEffect,
  createRef,
  createRenderEffect,
  createRoot,
  createSignal,
  getDocument,
  insert,
  type InsertCurrent,
  type InsertValue,
  onCleanup,
  type Signal,
} from "@dreamer/view";
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
  /**
   * 可选：左右列搜索框的**初始**文案（仅在组件实例首次创建时生效）。
   * 勿与「每键更新」的受控 state 绑定，否则父级重绘会重建整块 DOM 导致输入失焦。
   */
  searchValue?: [string, string];
  /** 搜索输入回调（用户输入时通知父级，不参与受控绑定） */
  onSearch?: (direction: "left" | "right", value: string) => void;
  /** 自定义筛选（不传则按 title 字符串包含过滤） */
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

/**
 * 按关键词筛选穿梭项（默认匹配 title 子串，忽略大小写）。
 */
function filterTransferItems(
  items: TransferItem[],
  q: string,
  filterOption?: (inputValue: string, item: TransferItem) => boolean,
): TransferItem[] {
  if (!q.trim()) return items;
  const fn = filterOption ??
    ((input: string, item: TransferItem) =>
      String(item.title).toLowerCase().includes(input.toLowerCase()));
  return items.filter((i) => fn(q, i));
}

const transferListShellCls =
  "border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden flex flex-col";

/** 穿梭列参数 */
type TransferColumnProps = {
  title: string;
  items: TransferItem[];
  searchPlaceholder: string;
  showSearch: boolean;
  searchRef: Signal<string>;
  selectedKeysRef: Signal<string[]>;
  filterOption?: (inputValue: string, item: TransferItem) => boolean;
  onSearch?: (value: string) => void;
  render?: (item: TransferItem) => unknown;
  listStyle: { width?: number; height?: number };
  onToggleSelect: (key: string) => void;
  onTransfer: (keys: string[]) => void;
  disabled?: boolean;
};

/**
 * 单列：标题、可选搜索、列表+页脚由 **函数子响应式插入** 注入，避免在外层 getter 订阅搜索文案。
 */
function TransferColumn(props: TransferColumnProps) {
  const {
    title,
    items,
    searchPlaceholder,
    showSearch,
    searchRef,
    selectedKeysRef,
    filterOption,
    onSearch,
    render,
    listStyle,
    onToggleSelect,
    onTransfer,
    disabled = false,
  } = props;

  const localQuery = createSignal(searchRef.value);
  const listVersion = createSignal(0);
  /** 列表挂载点；使用 `createRef` 以便 ref 写入时触发下方 effect（与 ImageViewer 一致） */
  const bodyMountRef = createRef<HTMLDivElement>(null);

  createRenderEffect(() => {
    const mount = bodyMountRef.current;
    if (mount == null) return;
    const dispose = createRoot((disposeRoot) => {
      let current: InsertCurrent;
      createEffect(() => {
        listVersion.value;
        const filtered = filterTransferItems(
          items,
          localQuery.value,
          filterOption,
        );
        const selectedKeys = selectedKeysRef.value;
        const listHeight = listStyle.height ?? 200;
        current = insert(
          mount,
          (
            <div class="contents">
              <ul
                class="overflow-auto flex-1 min-h-0 list-none m-0 p-1"
                style={{ height: listHeight }}
              >
                {filtered.map((item) => {
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
                {filtered.length} 项
                {selectedKeys.length > 0 && `，已选 ${selectedKeys.length}`}
              </div>
            </div>
          ) as InsertValue,
          current,
        );
      });
      return disposeRoot;
    });
    onCleanup(() => dispose());
  });

  return (
    <div
      class={twMerge(transferListShellCls, "min-w-0 shrink-0")}
      style={{ width: `${listStyle.width ?? 200}px` }}
    >
      <div class="px-3 py-2 border-b border-slate-200 dark:border-slate-600 font-medium text-slate-700 dark:text-slate-300">
        {title}
      </div>
      {showSearch && (
        <input
          type="text"
          role="searchbox"
          autocomplete="off"
          class="m-2 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 w-[calc(100%-1rem)]"
          placeholder={searchPlaceholder}
          value={() => localQuery.value}
          onInput={(e: Event) => {
            const v = (e.target as HTMLInputElement).value;
            localQuery.value = v;
            searchRef.value = v;
            listVersion.value = listVersion.value + 1;
            if (onSearch != null) {
              queueMicrotask(() => onSearch(v));
            }
          }}
        />
      )}
      <div class="flex flex-col flex-1 min-h-0" ref={bodyMountRef} />
    </div>
  );
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

  const leftSearchRef = createSignal(searchValue?.[0] ?? "");
  const rightSearchRef = createSignal(searchValue?.[1] ?? "");
  const leftSelectedKeysRef = createSignal<string[]>([]);
  const rightSelectedKeysRef = createSignal<string[]>([]);

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

  const btnCls =
    "px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed";

  return () => {
    if (getDocument() == null) {
      return <span class="hidden" aria-hidden="true" />;
    }

    const currentTargetKeys = getTargetKeys();
    const targetSet = new Set(currentTargetKeys);
    const leftRaw = dataSource.filter((i) => !targetSet.has(i.key));
    const rightRaw = dataSource.filter((i) => targetSet.has(i.key));

    return (
      <div
        class={twMerge(
          "transfer flex items-stretch gap-4",
          disabled && "opacity-60 pointer-events-none",
          className,
        )}
      >
        <TransferColumn
          title={titles[0]}
          items={leftRaw}
          searchPlaceholder={searchPlaceholder[0]}
          showSearch={showSearch}
          searchRef={leftSearchRef}
          selectedKeysRef={leftSelectedKeysRef}
          filterOption={filterOption}
          onSearch={(v) => onSearch?.("left", v)}
          render={render}
          listStyle={listStyle}
          onToggleSelect={(key) => {
            leftSelectedKeysRef((prev: string[]) =>
              prev.includes(key)
                ? prev.filter((k: string) => k !== key)
                : [...prev, key]
            );
          }}
          onTransfer={(keys) => moveToRight(keys)}
          disabled={disabled}
        />
        <div class="flex shrink-0 flex-col justify-center gap-2">
          <button
            type="button"
            class={btnCls}
            disabled={disabled}
            aria-label="右移"
            onClick={() => {
              moveToRight(
                leftSelectedKeysRef.value.length > 0
                  ? leftSelectedKeysRef.value
                  : filterTransferItems(
                    leftRaw,
                    leftSearchRef.value,
                    filterOption,
                  )
                    .filter((i) => !i.disabled)
                    .map((i) => i.key),
              );
            }}
          >
            →
          </button>
          <button
            type="button"
            class={btnCls}
            disabled={disabled}
            aria-label="左移"
            onClick={() => {
              moveToLeft(
                rightSelectedKeysRef.value.length > 0
                  ? rightSelectedKeysRef.value
                  : filterTransferItems(
                    rightRaw,
                    rightSearchRef.value,
                    filterOption,
                  )
                    .filter((i) => !i.disabled)
                    .map((i) => i.key),
              );
            }}
          >
            ←
          </button>
        </div>
        <TransferColumn
          title={titles[1]}
          items={rightRaw}
          searchPlaceholder={searchPlaceholder[1]}
          showSearch={showSearch}
          searchRef={rightSearchRef}
          selectedKeysRef={rightSelectedKeysRef}
          filterOption={filterOption}
          onSearch={(v) => onSearch?.("right", v)}
          render={render}
          listStyle={listStyle}
          onToggleSelect={(key) => {
            rightSelectedKeysRef((prev: string[]) =>
              prev.includes(key)
                ? prev.filter((k: string) => k !== key)
                : [...prev, key]
            );
          }}
          onTransfer={(keys) => moveToLeft(keys)}
          disabled={disabled}
        />
      </div>
    );
  };
}
