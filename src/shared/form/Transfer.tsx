/**
 * Transfer 穿梭框（View，归类为表单组件）。
 * 双列选择；支持搜索、自定义渲染、禁用项、方向。列表项可选中（高亮）后通过中间按钮穿梭。
 *
 * **避免整块重挂载：**
 * 1. 外层 `return ()` **不读取** `leftSearchRef` / `rightSearchRef`，也**不读取** `selectedKeysRef.value`，
 *    仅追踪 `targetKeys`（及 dataSource 等），否则每点选一项或每键入一字都会重建整棵 `div.transfer`（含中间箭头区），导致失焦。
 * 2. **整行一条 MountFn**：左右列 + 中间箭头在同一次 `markMountFn` 内顺序 `appendChild`，避免「两列各包一层
 *    `insertReactiveForVnodeSubtree`、中间是本征 div」时浏览器先绘出中间再补齐两侧的分段感。列内仍用 `insertReactive`
 *    只更新列表+页脚；`div.contents` 单根策略不变。
 * 3. 列表的 insertReactive **不订阅** `searchRef`：用列内 `listQueryLocal` 保存关键词、`listVersion` 作刷新节拍，
 *    输入时只 bump `listVersion`；仍把 `searchRef.value` 同步给中间箭头 onClick。避免「写 searchRef → 与多层 effect
 *    交织」导致异常重挂；`onSearch` 用 `queueMicrotask` 推迟，减轻父级同步重绘整棵 Transfer 的几率。
 */

import { getDocument, insertReactive, markMountFn } from "@dreamer/view";
import { createSignal, type SignalRef } from "@dreamer/view/signal";
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
 *
 * @param items - 当前列原始项（未按搜索过滤）
 * @param q - 搜索框文案
 * @param filterOption - 自定义匹配函数，与 props.filterOption 一致
 * @returns 过滤后的列表
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

/** 列表外壳与列表区共用的边框圆角类名 */
const transferListShellCls =
  "border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden flex flex-col";

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

  /** 左右列搜索文案：外层 getter 不读这两个 ref，仅列表内 insertReactive 与按钮 onClick 读取 */
  const leftSearchRef = createSignal(searchValue?.[0] ?? "");
  const rightSearchRef = createSignal(searchValue?.[1] ?? "");

  /** 外层 getter 禁止读 `.value`，改由列内 `insertReactive` 读 `selectedKeysRef`，避免点选即重建整棵 transfer */
  const leftSelectedKeysRef = createSignal<string[]>([]);
  const rightSelectedKeysRef = createSignal<string[]>([]);

  /**
   * 在内部和点击时读取当前 targetKeys，支持 getter 避免闭包陈旧。
   *
   * @returns 当前已选 key 列表
   */
  const getTargetKeys = () =>
    typeof targetKeys === "function" ? targetKeys() : targetKeys;

  /**
   * 将指定 key 从左侧移到右侧（已选）。
   *
   * @param keys - 要移动的 key
   */
  const moveToRight = (keys: string[]) => {
    if (keys.length === 0) return;
    const current = getTargetKeys();
    onChange?.([...new Set([...current, ...keys])]);
    leftSelectedKeysRef.value = [];
  };

  /**
   * 将指定 key 从右侧移回左侧。
   *
   * @param keys - 要移回的 key
   */
  const moveToLeft = (keys: string[]) => {
    if (keys.length === 0) return;
    const current = getTargetKeys();
    onChange?.(current.filter((k) => !keys.includes(k)));
    rightSelectedKeysRef.value = [];
  };

  /**
   * 仅追踪 targetKeys / dataSource 等；不读 searchRef、不读 selectedKeysRef.value，
   * 中间箭头区与列外壳不因搜索或列内选中而整段替换。
   */
  return () => {
    const currentTargetKeys = getTargetKeys();
    const targetSet = new Set(currentTargetKeys);
    const leftRaw = dataSource.filter((i) => !targetSet.has(i.key));
    const rightRaw = dataSource.filter((i) => targetSet.has(i.key));

    const btnCls =
      "px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed";

    return (
      <div
        class={twMerge(
          "transfer flex items-stretch gap-4",
          disabled && "opacity-60 pointer-events-none",
          className,
        )}
      >
        {markMountFn((rowParent: Node) => {
          const doc = rowParent.ownerDocument ?? getDocument();
          if (doc == null) return;

          mountTransferListColumn(doc, rowParent, {
            title: titles[0],
            items: leftRaw,
            searchPlaceholder: searchPlaceholder[0],
            showSearch,
            searchRef: leftSearchRef,
            selectedKeysRef: leftSelectedKeysRef,
            filterOption,
            onSearch: (v) => onSearch?.("left", v),
            render,
            listStyle,
            onToggleSelect: (key) => {
              leftSelectedKeysRef.value = (prev: string[]) =>
                prev.includes(key)
                  ? prev.filter((k: string) => k !== key)
                  : [...prev, key];
            },
            onTransfer: (keys) => moveToRight(keys),
            disabled,
          });

          const mid = doc.createElement("div");
          mid.className = "flex shrink-0 flex-col justify-center gap-2";

          const btnToRight = doc.createElement("button");
          btnToRight.type = "button";
          btnToRight.className = btnCls;
          btnToRight.disabled = disabled;
          btnToRight.setAttribute("aria-label", "右移");
          btnToRight.textContent = "→";
          btnToRight.addEventListener("click", () => {
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
          });
          mid.appendChild(btnToRight);

          const btnToLeft = doc.createElement("button");
          btnToLeft.type = "button";
          btnToLeft.className = btnCls;
          btnToLeft.disabled = disabled;
          btnToLeft.setAttribute("aria-label", "左移");
          btnToLeft.textContent = "←";
          btnToLeft.addEventListener("click", () => {
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
          });
          mid.appendChild(btnToLeft);
          rowParent.appendChild(mid);

          mountTransferListColumn(doc, rowParent, {
            title: titles[1],
            items: rightRaw,
            searchPlaceholder: searchPlaceholder[1],
            showSearch,
            searchRef: rightSearchRef,
            selectedKeysRef: rightSelectedKeysRef,
            filterOption,
            onSearch: (v) => onSearch?.("right", v),
            render,
            listStyle,
            onToggleSelect: (key) => {
              rightSelectedKeysRef.value = (prev: string[]) =>
                prev.includes(key)
                  ? prev.filter((k: string) => k !== key)
                  : [...prev, key];
            },
            onTransfer: (keys) => moveToLeft(keys),
            disabled,
          });
        })}
      </div>
    );
  };
}

/** 穿梭列挂载参数（与原先 TransferList 一致） */
type TransferColumnProps = {
  title: string;
  items: TransferItem[];
  searchPlaceholder: string;
  showSearch: boolean;
  searchRef: SignalRef<string>;
  selectedKeysRef: SignalRef<string[]>;
  filterOption?: (inputValue: string, item: TransferItem) => boolean;
  onSearch?: (value: string) => void;
  render?: (item: TransferItem) => unknown;
  listStyle: { width?: number; height?: number };
  onToggleSelect: (key: string) => void;
  onTransfer: (keys: string[]) => void;
  disabled?: boolean;
};

/**
 * 挂载单列外壳（标题、可选搜索框）并在列根上注册列表+页脚的 `insertReactive`。
 * 由 {@link Transfer} 的**单行** `markMountFn` 内调用，保证与中间箭头在同一同步段内挂到 flex 父节点。
 *
 * @param doc - 所属文档
 * @param parent - 穿梭 flex 容器（`.transfer`）
 * @param listProps - 列配置
 */
function mountTransferListColumn(
  doc: Document,
  parent: Node,
  listProps: TransferColumnProps,
): void {
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
  } = listProps;

  const root = doc.createElement("div");
  root.className = twMerge(transferListShellCls, "min-w-0 shrink-0");
  root.style.width = `${listStyle.width ?? 200}px`;

  const header = doc.createElement("div");
  header.className =
    "px-3 py-2 border-b border-slate-200 dark:border-slate-600 font-medium text-slate-700 dark:text-slate-300";
  header.textContent = title;
  root.appendChild(header);

  /**
   * 列内查询字符串：与列表 insertReactive 共用闭包；列表 getter 不读 `searchRef`（见 `listVersion`）。
   * 初始值可读 `searchRef.value`：外层 MountFn 在 `insertReactive` 内执行时已 `untrack`，不会把整行误订阅搜索。
   */
  let listQueryLocal = searchRef.value;
  /** 仅用于触发列表+页脚重算；与 searchRef 解耦 */
  const listVersion = createSignal(0);

  if (showSearch) {
    const input = doc.createElement("input");
    /** 使用 text，减少部分浏览器对 type=search 在邻近 DOM 替换时的异常行为 */
    input.type = "text";
    input.setAttribute("role", "searchbox");
    input.setAttribute("autocomplete", "off");
    input.className =
      "m-2 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 w-[calc(100%-1rem)]";
    input.placeholder = searchPlaceholder;
    input.value = listQueryLocal;
    input.addEventListener("input", () => {
      const v = input.value;
      listQueryLocal = v;
      searchRef.value = v;
      listVersion.value = listVersion.value + 1;
      const notify = onSearch;
      if (notify != null) {
        queueMicrotask(() => notify(v));
      }
    });
    root.appendChild(input);
  }

  parent.appendChild(root);

  insertReactive(root, () => {
    listVersion.value;
    const filtered = filterTransferItems(
      items,
      listQueryLocal,
      filterOption,
    );
    const selectedKeys = selectedKeysRef.value;
    const listHeight = listStyle.height ?? 200;

    /* 单根 + contents：布局上等价于 ul 与页脚两个兄弟；满足 insertReactive 单 VNode patch 路径 */
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
    );
  });
}
