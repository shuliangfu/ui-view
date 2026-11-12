/**
 * Transfer 穿梭框（View，归类为表单组件）。
 * 双列选择；支持搜索、自定义渲染、禁用项、方向。单击只选一项；Ctrl／Command+单击切换多选；Ctrl／Command+A 全选当前列（再按一次清空）。选中后通过中间按钮穿梭。
 *
 * **避免整块重挂载：**
 * 1. 外层 `return ()` **不读取** `leftSearchRef` / `rightSearchRef`，也**不读取** `selectedKeysRef.value`，
 *    仅追踪 `targetKeys`（及 dataSource 等），否则每点选一项或每键入一字都会重建整棵 `div.transfer`（含中间箭头区），导致失焦。
 * 2. 左右列 + 中间箭头为**同级 JSX**（flex 一行），避免「两列各包一层 **函数子响应式插入**、中间是本征 div」时浏览器分段绘制。
 * 3. 列表区用 **JSX 函数子** `{() => …}` + `listVersion`（在 {@link Transfer} 顶层 `createSignal`，勿在列函数内新建）作刷新节拍；
 *    搜索文案只用传入的 `searchRef`（与 {@link Transfer} 同源），列内**禁止** `createSignal` 否则父级 getter 重跑会新建信号、输入框重挂载失焦。
 *    `onSearch` 用 `queueMicrotask` 推迟。
 */

import {
  createSignal,
  getDocument,
  type JSXRenderable,
  type Signal,
  useContext,
} from "@dreamer/view";
import { readSignalValue, writeSignalValue } from "../safe-signal.ts";
import { twMerge } from "tailwind-merge";
import type { SizeVariant } from "../types.ts";
import { resolveFormControlSize } from "./form-control-context.ts";
import { FormItemControlIdContext } from "./form-item-control-id.ts";
import { controlErrorBorder } from "./input-focus-ring.ts";
import { commitMaybeSignal, type MaybeSignal } from "./maybe-signal.ts";
import {
  focusSelectAllHost,
  isSelectAllHotkey,
  preventSelectAllDefault,
  setSelectAllHost,
  toggleSelectAllKeys,
} from "../select-all-hotkey.ts";

export interface TransferItem {
  /** 唯一 key */
  key: string;
  /** 标题 */
  title: string | unknown;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * Transfer 内置文案。
 */
export interface TransferMessages {
  /** 左侧标题默认文案；与 {@link TransferProps.titles}[0] 同义，后者优先 */
  sourceTitle: string;
  /** 右侧标题默认文案；与 {@link TransferProps.titles}[1] 同义，后者优先 */
  targetTitle: string;
  /** 搜索框默认占位；与 {@link TransferProps.searchPlaceholder} 同义，后者优先 */
  searchPlaceholder: string;
  /** 列表底部「N 项」文案，参数为过滤后总数 */
  count: (n: number) => string;
  /** 列表底部「，已选 N」文案，参数为已选数；要求开头自带分隔符 */
  selectedSuffix: (n: number) => string;
  /** 中间向右移动按钮 `aria-label` */
  moveRight: string;
  /** 中间向左移动按钮 `aria-label` */
  moveLeft: string;
}

/** 默认中文文案 */
export const defaultTransferMessages: TransferMessages = {
  sourceTitle: "源列表",
  targetTitle: "目标列表",
  searchPlaceholder: "搜索",
  count: (n) => `${n} 项`,
  selectedSuffix: (n) => `，已选 ${n}`,
  moveRight: "右移",
  moveLeft: "左移",
};

export interface TransferProps {
  /** 控件尺寸，与 Input 相同；也可由外层 Form 的 size 注入 */
  size?: SizeVariant;
  /** 数据源 */
  dataSource: TransferItem[];
  /** 右侧（已选）key 列表（受控）；见 {@link MaybeSignal} */
  targetKeys: MaybeSignal<string[]>;
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
  /** 错误状态（外框红边）；可与 FormItem / createForm bindTargetKeys 联用 */
  error?: boolean;
  /** 控件 id（label for）；未传时取 FormItemControlIdContext */
  id?: string;
  /** 额外 class */
  class?: string;
  /** 多语言/自定义文案；未传字段走 {@link defaultTransferMessages} */
  messages?: Partial<TransferMessages>;
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
  "border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden flex flex-col bg-slate-100 shadow-inner dark:shadow-[inset_0_2px_5px_rgb(0_0_0_/_0.55),inset_0_-1px_0_rgb(255_255_255_/_0.06)] dark:bg-slate-900/70";

const transferTitleCls: Record<SizeVariant, string> = {
  xs: "px-2 py-1 text-xs",
  sm: "px-2.5 py-1.5 text-sm",
  md: "px-3 py-2 text-sm",
  lg: "px-3 py-2.5 text-base",
};
const transferSearchCls: Record<SizeVariant, string> = {
  xs: "px-2 py-0.5 text-xs",
  sm: "px-2 py-1 text-sm",
  md: "px-2 py-1 text-sm",
  lg: "px-2.5 py-1.5 text-base",
};
const transferItemCls: Record<SizeVariant, string> = {
  xs: "px-1.5 py-1 text-xs",
  sm: "px-2 py-1 text-sm",
  md: "px-2 py-1.5 text-sm",
  lg: "px-2.5 py-2 text-base",
};
const transferBtnCls: Record<SizeVariant, string> = {
  xs: "px-1.5 py-0.5 text-xs",
  sm: "px-2 py-1 text-sm",
  md: "px-2 py-1 text-sm",
  lg: "px-2.5 py-1.5 text-base",
};

/** 穿梭列参数 */
type TransferColumnProps = {
  title: string;
  items: TransferItem[];
  searchPlaceholder: string;
  showSearch: boolean;
  searchRef: Signal<string>;
  /** 与 {@link searchRef} 配套：仅在输入时自增，驱动列表函数子重算，须在 Transfer 顶层创建 */
  listVersion: Signal<number>;
  selectedKeysRef: Signal<string[]>;
  filterOption?: (inputValue: string, item: TransferItem) => boolean;
  onSearch?: (value: string) => void;
  render?: (item: TransferItem) => unknown;
  listStyle: { width?: number; height?: number };
  onToggleSelect: (key: string) => void;
  onTransfer: (keys: string[]) => void;
  disabled?: boolean;
  /** 列底部「N 项」格式化函数 */
  countFormatter: (n: number) => string;
  /** 列底部「，已选 N」格式化函数 */
  selectedSuffixFormatter: (n: number) => string;
  size: SizeVariant;
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
    listVersion,
    selectedKeysRef,
    filterOption,
    onSearch,
    render,
    listStyle,
    onToggleSelect,
    onTransfer,
    disabled = false,
    countFormatter,
    selectedSuffixFormatter,
    size,
  } = props;

  // 搜索框绑定上层 searchRef（非列内 createSignal），父级 getter 重跑时仍为同一信号，避免输入框重挂载失焦。
  const selectAllInColumn = (event: KeyboardEvent) => {
    if (disabled || !isSelectAllHotkey(event)) return;
    preventSelectAllDefault(event);
    const filtered = filterTransferItems(
      items,
      readSignalValue(searchRef) ?? "",
      filterOption,
    ).filter((item) => !item.disabled).map((item) => item.key);
    const current = readSignalValue(selectedKeysRef) ?? [];
    writeSignalValue(selectedKeysRef, toggleSelectAllKeys(current, filtered));
  };

  return (
    <div
      ref={(el: HTMLElement | null) => {
        if (!el) return;
        setSelectAllHost(el, () => {
          if (el.getAttribute("data-transfer-disabled") === "true") return;
          const keys = [...el.querySelectorAll<HTMLElement>("[data-key]")]
            .filter((node) => !(node as HTMLButtonElement).disabled)
            .map((node) => node.getAttribute("data-key") ?? "")
            .filter(Boolean);
          const current = readSignalValue(selectedKeysRef) ?? [];
          writeSignalValue(
            selectedKeysRef,
            toggleSelectAllKeys(current, keys),
          );
        });
      }}
      class={twMerge(transferListShellCls, "min-w-0 flex-1")}
      style={{
        flex: `1 1 ${listStyle.width ?? 200}px`,
        width: "auto",
        minWidth: 0,
      }}
      tabIndex={-1}
      data-select-all-host=""
      data-transfer-disabled={disabled ? "true" : undefined}
      onMouseDown={focusSelectAllHost}
      onKeyDown={selectAllInColumn}
    >
      <div
        class={twMerge(
          "border-b border-slate-200 dark:border-slate-600 font-medium text-slate-700 dark:text-slate-300",
          transferTitleCls[size],
        )}
      >
        {title}
      </div>
      {showSearch && (
        <input
          type="text"
          role="searchbox"
          autocomplete="off"
          class={twMerge(
            "m-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-100 shadow-inner dark:shadow-[inset_0_2px_5px_rgb(0_0_0_/_0.55),inset_0_-1px_0_rgb(255_255_255_/_0.06)] dark:bg-slate-900/70 w-[calc(100%-1rem)]",
            transferSearchCls[size],
          )}
          placeholder={searchPlaceholder}
          value={() => readSignalValue(searchRef) ?? ""}
          onInput={(e: Event) => {
            const v = (e.target as HTMLInputElement).value;
            writeSignalValue(searchRef, v);
            writeSignalValue(listVersion, readSignalValue(listVersion) + 1);
            if (onSearch != null) {
              queueMicrotask(() => onSearch(v));
            }
          }}
        />
      )}
      <div class="flex flex-col flex-1 min-h-0">
        {() => {
          readSignalValue(listVersion);
          const filtered = filterTransferItems(
            items,
            readSignalValue(searchRef) ?? "",
            filterOption,
          );
          const selectedKeys = readSignalValue(selectedKeysRef) ?? [];
          const listHeight = listStyle.height ?? 200;
          return (
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
                          twMerge(
                            "w-full text-left rounded cursor-pointer border-0 bg-transparent",
                            transferItemCls[size],
                          ),
                          item.disabled || disabled
                            ? "opacity-60 cursor-not-allowed"
                            : "hover:bg-slate-200/80 dark:hover:bg-slate-700/80",
                          selected &&
                            "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200",
                        )}
                        data-key={item.key}
                        disabled={item.disabled || disabled}
                        onClick={(event: Event) => {
                          if (item.disabled || disabled) return;
                          const ev = event as MouseEvent;
                          if (ev.ctrlKey || ev.metaKey) {
                            onToggleSelect(item.key);
                            return;
                          }
                          writeSignalValue(selectedKeysRef, [item.key]);
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
                {countFormatter(filtered.length)}
                {selectedKeys.length > 0 &&
                  selectedSuffixFormatter(selectedKeys.length)}
              </div>
            </div>
          );
        }}
      </div>
    </div>
  );
}

export function Transfer(props: TransferProps): JSXRenderable {
  const {
    dataSource,
    targetKeys,
    onChange,
    showSearch = false,
    searchValue,
    onSearch,
    filterOption,
    render,
    listStyle = { width: 200, height: 200 },
    disabled = false,
    error = false,
    id,
    class: className,
    messages,
  } = props;
  const size = resolveFormControlSize(props.size);
  const fromFormItem = useContext(FormItemControlIdContext);
  const resolvedId = id ?? fromFormItem;
  const m = { ...defaultTransferMessages, ...messages };
  const titles: [string, string] = props.titles ??
    [m.sourceTitle, m.targetTitle];
  const searchPlaceholder: [string, string] = props.searchPlaceholder ??
    [m.searchPlaceholder, m.searchPlaceholder];

  const leftSearchRef = createSignal(searchValue?.[0] ?? "");
  const rightSearchRef = createSignal(searchValue?.[1] ?? "");
  /** 左右列表过滤区刷新节拍；必须在 Transfer 内只创建一次，不可放在 TransferColumn 内 */
  const leftListVersion = createSignal(0);
  const rightListVersion = createSignal(0);
  const leftSelectedKeysRef = createSignal<string[]>([]);
  const rightSelectedKeysRef = createSignal<string[]>([]);

  const getTargetKeys = () =>
    typeof targetKeys === "function" ? targetKeys() : targetKeys;

  const moveToRight = (keys: string[]) => {
    if (keys.length === 0) return;
    const current = getTargetKeys();
    const next = [...new Set([...current, ...keys])];
    commitMaybeSignal(targetKeys, next);
    onChange?.(next);
    writeSignalValue(leftSelectedKeysRef, []);
  };

  const moveToLeft = (keys: string[]) => {
    if (keys.length === 0) return;
    const current = getTargetKeys();
    const next = current.filter((k) => !keys.includes(k));
    commitMaybeSignal(targetKeys, next);
    onChange?.(next);
    writeSignalValue(rightSelectedKeysRef, []);
  };

  const btnCls = twMerge(
    "border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed",
    transferBtnCls[size],
  );

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
        id={resolvedId}
        class={twMerge(
          "transfer flex w-full max-w-full min-w-0 items-stretch gap-4 rounded-lg",
          disabled && "opacity-60 pointer-events-none",
          error &&
            twMerge(
              "p-1 ring-1 ring-red-500 dark:ring-red-500",
              controlErrorBorder,
            ),
          className,
        )}
        aria-invalid={error}
      >
        <TransferColumn
          title={titles[0]}
          items={leftRaw}
          searchPlaceholder={searchPlaceholder[0]}
          showSearch={showSearch}
          searchRef={leftSearchRef}
          listVersion={leftListVersion}
          selectedKeysRef={leftSelectedKeysRef}
          filterOption={filterOption}
          onSearch={(v) => onSearch?.("left", v)}
          render={render}
          listStyle={listStyle}
          size={size}
          onToggleSelect={(key) => {
            leftSelectedKeysRef((prev: string[] | undefined) => {
              const cur = prev ?? [];
              return cur.includes(key)
                ? cur.filter((k: string) => k !== key)
                : [...cur, key];
            });
          }}
          onTransfer={(keys) => moveToRight(keys)}
          disabled={disabled}
          countFormatter={m.count}
          selectedSuffixFormatter={m.selectedSuffix}
        />
        <div class="flex shrink-0 flex-col justify-center gap-2">
          <button
            type="button"
            class={btnCls}
            disabled={disabled}
            aria-label={m.moveRight}
            onClick={() => {
              {
                const selected = readSignalValue(leftSelectedKeysRef) ?? [];
                moveToRight(
                  selected.length > 0 ? selected : filterTransferItems(
                    leftRaw,
                    readSignalValue(leftSearchRef) ?? "",
                    filterOption,
                  )
                    .filter((i) => !i.disabled)
                    .map((i) => i.key),
                );
              }
            }}
          >
            →
          </button>
          <button
            type="button"
            class={btnCls}
            disabled={disabled}
            aria-label={m.moveLeft}
            onClick={() => {
              {
                const selected = readSignalValue(rightSelectedKeysRef) ?? [];
                moveToLeft(
                  selected.length > 0 ? selected : filterTransferItems(
                    rightRaw,
                    readSignalValue(rightSearchRef) ?? "",
                    filterOption,
                  )
                    .filter((i) => !i.disabled)
                    .map((i) => i.key),
                );
              }
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
          listVersion={rightListVersion}
          selectedKeysRef={rightSelectedKeysRef}
          filterOption={filterOption}
          onSearch={(v) => onSearch?.("right", v)}
          render={render}
          listStyle={listStyle}
          size={size}
          onToggleSelect={(key) => {
            rightSelectedKeysRef((prev: string[] | undefined) => {
              const cur = prev ?? [];
              return cur.includes(key)
                ? cur.filter((k: string) => k !== key)
                : [...cur, key];
            });
          }}
          onTransfer={(keys) => moveToLeft(keys)}
          disabled={disabled}
          countFormatter={m.count}
          selectedSuffixFormatter={m.selectedSuffix}
        />
      </div>
    );
  };
}
