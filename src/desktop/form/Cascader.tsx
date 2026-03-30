/**
 * Cascader 级联选择（桌面版）。
 * 支持**任意层级**（含 3 级及以上）：自绘触发条 + **多列**浮层（横向可滚动），非原生 `<select>`。
 * `value` 为从根到选中节点的 `value` 路径；`onChange` 回传同结构数组；清空为 `[]`。
 *
 * **动态加载**：传入 `loadChildren` 后，未写 `children` 且未标记 `isLeaf` 的节点会在展开该级时请求子节点；
 * 结果缓存在组件内并与 `options` 合并展示；也可在回调里自行合并到 `options` 后回传以持久化。
 */

import { createEffect, createSignal } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { IconChevronDown } from "../../shared/basic/icons/ChevronDown.tsx";
import {
  controlBlueFocusRing,
  pickerTriggerSurface,
} from "../../shared/form/input-focus-ring.ts";
import type { SizeVariant } from "../../shared/types.ts";

export interface CascaderOption {
  value: string;
  label: string;
  children?: CascaderOption[];
  /**
   * 与 `loadChildren` 联用：为 `true` 表示确定无下级，不再请求。
   * 未传 `loadChildren` 时，省略 `children` 即视为叶子（与原先行为一致）。
   */
  isLeaf?: boolean;
}

export interface CascaderProps {
  options: CascaderOption[];
  /** 选中路径（每段为对应层级的 value）；可为 getter */
  value?: string[] | (() => string[]);
  size?: SizeVariant;
  disabled?: boolean;
  onChange?: (value: string[]) => void;
  placeholder?: string;
  class?: string;
  name?: string;
  id?: string;
  /** 为 true 时隐藏聚焦激活态边框；默认 false 显示 ring */
  hideFocusRing?: boolean;
  /**
   * 按当前路径异步加载**该路径节点**的直接子节点；返回的子项会写入内部缓存并触发重绘。
   * 路径含义：`[]` 不使用（根列表始终来自 `options`）；`["zhejiang"]` 表示加载「浙江」下的市/区列表。
   */
  loadChildren?: (path: string[]) => Promise<CascaderOption[]>;
  /** `loadChildren` 失败时回调；组件会将该路径缓存为空数组，列内显示为无下级 */
  onLoadError?: (path: string[], error: unknown) => void;
}

const sizeClasses: Record<SizeVariant, string> = {
  xs: "px-2.5 py-1 text-xs rounded-md",
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-3 py-2 text-sm rounded-lg",
  lg: "px-4 py-2.5 text-base rounded-lg",
};

const colBtnBase =
  "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/80";

const colBtnActive =
  "bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200";

const DROPDOWN_ESC_KEY = "__lastDropdownClose" as const;

/** 将路径编码为缓存键，避免段值含分隔符冲突 */
function pathKey(path: string[]): string {
  return path.join("\u0001");
}

/**
 * 沿 `options` 树查找路径对应节点（仅看 props 上的 `children`，不看动态缓存）。
 */
function getNodeAtPath(
  opts: CascaderOption[],
  path: string[],
): CascaderOption | null {
  let level = opts;
  let found: CascaderOption | null = null;
  for (const key of path) {
    found = level.find((o) => o.value === key) ?? null;
    if (!found) return null;
    level = found.children ?? [];
  }
  return found;
}

/**
 * 已知合并视图中的节点及其路径，解析其直接子列表（props.children / isLeaf / 懒加载缓存）。
 */
function getChildrenOfResolvedNode(
  node: CascaderOption | null,
  nodePath: string[],
  loadChildren: CascaderProps["loadChildren"],
  cache: Record<string, CascaderOption[]>,
): CascaderOption[] {
  if (!node) return [];
  if (Array.isArray(node.children)) return node.children;
  if (node.isLeaf) return [];
  if (!loadChildren) return [];
  const key = pathKey(nodePath);
  if (Object.prototype.hasOwnProperty.call(cache, key)) {
    return cache[key]!;
  }
  return [];
}

/**
 * 在 `options` + 懒加载缓存的**合并视图**中解析路径对应节点。
 * 子级仅存在于 `childCache` 时（如市不在 props 树里）也能定位，否则第三级永远无法加载。
 */
function getMergedNode(
  baseOptions: CascaderOption[],
  path: string[],
  loadChildren: CascaderProps["loadChildren"],
  cache: Record<string, CascaderOption[]>,
): CascaderOption | null {
  if (!loadChildren || path.length === 0) return null;
  let level: CascaderOption[] = baseOptions;
  let current: CascaderOption | null = null;
  for (let i = 0; i < path.length; i++) {
    const seg = path[i]!;
    current = level.find((o) => o.value === seg) ?? null;
    if (!current) return null;
    if (i === path.length - 1) return current;
    const pathToCurrent = path.slice(0, i + 1);
    level = getChildrenOfResolvedNode(
      current,
      pathToCurrent,
      loadChildren,
      cache,
    );
  }
  return current;
}

/**
 * 解析某路径节点在界面上的子列表：无懒加载时等同 `options` 树；有懒加载时合并缓存解析父节点。
 */
function getEffectiveChildren(
  baseOptions: CascaderOption[],
  parentPath: string[],
  loadChildren: CascaderProps["loadChildren"],
  cache: Record<string, CascaderOption[]>,
): CascaderOption[] {
  if (!loadChildren) {
    const node = getNodeAtPath(baseOptions, parentPath);
    return node?.children ?? [];
  }
  if (parentPath.length === 0) {
    return baseOptions;
  }
  const node = getMergedNode(baseOptions, parentPath, loadChildren, cache);
  return getChildrenOfResolvedNode(node, parentPath, loadChildren, cache);
}

/**
 * 是否应对 `parentPath` 节点发起懒加载（已打开面板、有 loadChildren、未缓存、非叶子）。
 */
function needsLazyFetch(
  baseOptions: CascaderOption[],
  parentPath: string[],
  loadChildren: CascaderProps["loadChildren"],
  cache: Record<string, CascaderOption[]>,
  loadingKey: string | null,
): boolean {
  if (!loadChildren || parentPath.length === 0) return false;
  const node = getMergedNode(baseOptions, parentPath, loadChildren, cache);
  if (!node || node.isLeaf) return false;
  if (Array.isArray(node.children)) return false;
  const key = pathKey(parentPath);
  if (Object.prototype.hasOwnProperty.call(cache, key)) return false;
  if (loadingKey === key) return false;
  return true;
}

/**
 * 列数：已选路径长度 + 1，但若最后一级已确定为叶子且无进行中的加载，则不再多出一列「无下级」。
 */
function computeNumCols(
  baseOptions: CascaderOption[],
  panelPath: string[],
  loadChildren: CascaderProps["loadChildren"],
  cache: Record<string, CascaderOption[]>,
  loadingKey: string | null,
): number {
  if (panelPath.length === 0) return 1;
  const key = pathKey(panelPath);
  const kids = getEffectiveChildren(
    baseOptions,
    panelPath,
    loadChildren,
    cache,
  );
  const pending = needsLazyFetch(
    baseOptions,
    panelPath,
    loadChildren,
    cache,
    loadingKey,
  );
  const loadingHere = loadingKey === key;
  if (kids.length === 0 && !pending && !loadingHere) {
    return panelPath.length;
  }
  return panelPath.length + 1;
}

/**
 * 第 `c` 列展示的列表：`pathPrefix = panelPath.slice(0, c)` 对应节点的子项（含动态缓存）。
 */
function columnItemsMerged(
  baseOptions: CascaderOption[],
  pathPrefix: string[],
  loadChildren: CascaderProps["loadChildren"],
  cache: Record<string, CascaderOption[]>,
): CascaderOption[] {
  if (pathPrefix.length === 0) return baseOptions;
  return getEffectiveChildren(
    baseOptions,
    pathPrefix,
    loadChildren,
    cache,
  );
}

/**
 * 触发条文案：沿路径在「根列表 + 各级有效子列表」中解析 label。
 */
function displayLabelsMerged(
  baseOptions: CascaderOption[],
  path: string[],
  loadChildren: CascaderProps["loadChildren"],
  cache: Record<string, CascaderOption[]>,
): string {
  if (path.length === 0) return "";
  const labels: string[] = [];
  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    const parentPath = path.slice(0, i);
    const level = parentPath.length === 0 ? baseOptions : getEffectiveChildren(
      baseOptions,
      parentPath,
      loadChildren,
      cache,
    );
    const node = level.find((o) => o.value === key);
    if (!node) {
      labels.push(key);
      break;
    }
    labels.push(node.label);
  }
  return labels.join(" / ");
}

/**
 * 任意层级级联：浮层内列数由 `computeNumCols` 决定；支持 `loadChildren` 动态子项。
 */
export function Cascader(props: CascaderProps) {
  const {
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
  /** 浮层内当前路径，打开时从 value 拷贝，点击列内项时更新 */
  const pathInPanel = createSignal<string[]>([]);
  /** 懒加载子节点缓存：键为 pathKey(父路径) */
  const childCache = createSignal<Record<string, CascaderOption[]>>({});
  /** 当前正在请求的父路径键，用于展示加载态 */
  const loadingPathKey = createSignal<string | null>(null);
  const sizeCls = sizeClasses[size];

  const closePanel = () => {
    openState.value = false;
  };

  const openPanel = () => {
    if (disabled) return;
    const path = typeof value === "function" ? value() : (value ?? []);
    pathInPanel.value = [...path];
    openState.value = true;
  };

  /**
   * 打开且存在 `loadChildren` 时，按当前面板路径自上而下依次补全未缓存的层级（每次最多发起一个请求，完成后 effect 再跑下一层）。
   */
  createEffect(() => {
    const load = props.loadChildren;
    if (!load || !openState.value) return;
    const opts = props.options;
    const pp = pathInPanel.value;
    const cache = childCache.value;
    const n = computeNumCols(
      opts,
      pp,
      load,
      cache,
      loadingPathKey.value,
    );

    for (let c = 1; c < n; c++) {
      const prefix = pp.slice(0, c);
      const key = pathKey(prefix);
      /** 市等节点可能只在 cache 中，必须用合并视图 */
      const node = getMergedNode(opts, prefix, load, cache);
      if (!node || node.isLeaf) continue;
      if (Array.isArray(node.children)) continue;
      if (Object.prototype.hasOwnProperty.call(cache, key)) continue;
      if (loadingPathKey.value === key) continue;

      loadingPathKey.value = key;
      void load(prefix)
        .then((kids) => {
          childCache.value = { ...childCache.value, [key]: kids };
        })
        .catch((err) => {
          props.onLoadError?.(prefix, err);
          childCache.value = { ...childCache.value, [key]: [] };
        })
        .finally(() => {
          if (loadingPathKey.value === key) {
            loadingPathKey.value = null;
          }
        });
      break;
    }
  });

  return () => {
    const opts = props.options;
    const loadChildren = props.loadChildren;
    const path = typeof value === "function" ? value() : (value ?? []);
    const cache = childCache.value;
    const displayText =
      (loadChildren
        ? displayLabelsMerged(opts, path, loadChildren, cache)
        : (() => {
          if (path.length === 0) return "";
          const labels: string[] = [];
          let level = opts;
          for (const key of path) {
            const node = level.find((o) => o.value === key);
            if (!node) {
              labels.push(key);
              break;
            }
            labels.push(node.label);
            level = node.children ?? [];
          }
          return labels.join(" / ");
        })()) || placeholder;
    const hasSelection = path.length > 0 && path[0] !== "";

    const panelPath = pathInPanel.value;
    const loadingKey = loadingPathKey.value;
    const numCols = Math.max(
      1,
      computeNumCols(opts, panelPath, loadChildren, cache, loadingKey),
    );

    /**
     * 在列 `colIndex` 选中 `opt`：截断更深层后追加；叶子或已确认无下级则关闭浮层。
     */
    const pickInColumn = (colIndex: number, opt: CascaderOption) => {
      const current = pathInPanel.value;
      const newPath = [...current.slice(0, colIndex), opt.value];
      pathInPanel.value = newPath;
      onChange?.(newPath);

      /** 点击时刻的最新缓存，避免闭包读到旧 cache */
      const cacheNow = childCache.value;
      const node = loadChildren
        ? getMergedNode(opts, newPath, loadChildren, cacheNow)
        : getNodeAtPath(opts, newPath);
      if (loadChildren) {
        const kids = getEffectiveChildren(
          opts,
          newPath,
          loadChildren,
          cacheNow,
        );
        const k = pathKey(newPath);
        const isLoading = loadingPathKey.value === k;
        if (kids.length > 0) return;
        if (isLoading) return;
        if (node?.isLeaf) {
          closePanel();
          return;
        }
        if (Array.isArray(node?.children) && node.children.length === 0) {
          closePanel();
          return;
        }
        if (
          Object.prototype.hasOwnProperty.call(cacheNow, k) &&
          cacheNow[k].length === 0
        ) {
          closePanel();
          return;
        }
        return;
      }
      if (!node?.children?.length) {
        closePanel();
      }
    };

    const columns: {
      colIndex: number;
      items: CascaderOption[];
      selectedKey: string | undefined;
      showLoading: boolean;
    }[] = [];
    for (let c = 0; c < numCols; c++) {
      const prefix = panelPath.slice(0, c);
      const items = loadChildren
        ? columnItemsMerged(opts, prefix, loadChildren, cache)
        : (() => {
          if (prefix.length === 0) return opts;
          const n0 = getNodeAtPath(opts, prefix);
          return n0?.children ?? [];
        })();
      const pk = pathKey(prefix);
      const showLoading = Boolean(
        loadChildren &&
          c > 0 &&
          items.length === 0 &&
          (loadingKey === pk ||
            needsLazyFetch(
              opts,
              prefix,
              loadChildren,
              cache,
              loadingKey,
            )),
      );
      columns.push({
        colIndex: c,
        items,
        selectedKey: panelPath[c],
        showLoading,
      });
    }

    return (
      <div class={twMerge("relative inline-block w-full min-w-0", className)}>
        {name &&
          path
            .filter((x) =>
              x !== ""
            )
            .map((v, i) => (
              <input key={`${i}-${v}`} type="hidden" name={name} value={v} />
            ))}
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={openState.value}
          aria-label={displayText || placeholder || "级联选择"}
          class={twMerge(
            "w-full min-w-0",
            pickerTriggerSurface,
            controlBlueFocusRing(!hideFocusRing),
            sizeCls,
          )}
          onClick={() => {
            if (disabled) return;
            if (openState.value) closePanel();
            else openPanel();
          }}
        >
          <span
            class={twMerge(
              "truncate min-w-0 text-left",
              hasSelection
                ? "text-slate-900 dark:text-slate-100"
                : "text-slate-400 dark:text-slate-500",
            )}
          >
            {displayText}
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
              role="dialog"
              aria-label="级联选择"
              class="absolute z-50 top-full left-0 mt-1 max-h-72 max-w-[min(100vw-1rem,520px)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800"
              onClick={(e: Event) => e.stopPropagation()}
            >
              <div class="flex max-h-72 overflow-x-auto">
                {columns.map((col, colIdx) => (
                  <div
                    key={col.colIndex}
                    class={twMerge(
                      "flex max-h-72 min-w-[132px] shrink-0 flex-col overflow-y-auto border-slate-200 dark:border-slate-600",
                      colIdx < columns.length - 1 && "border-r",
                    )}
                  >
                    {col.colIndex === 0 && (
                      <button
                        type="button"
                        class={twMerge(
                          colBtnBase,
                          "text-slate-500 dark:text-slate-400",
                          !hasSelection && colBtnActive,
                        )}
                        onClick={() => {
                          pathInPanel.value = [];
                          onChange?.([]);
                          closePanel();
                        }}
                      >
                        {placeholder}
                      </button>
                    )}
                    {col.showLoading
                      ? (
                        <div class="px-3 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                          加载中…
                        </div>
                      )
                      : col.items.length === 0
                      ? (
                        <div class="px-3 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                          {col.colIndex === 0 ? "暂无选项" : "无下级选项"}
                        </div>
                      )
                      : (
                        col.items.map((opt) => (
                          <button
                            type="button"
                            key={opt.value}
                            class={twMerge(
                              colBtnBase,
                              col.selectedKey === opt.value && colBtnActive,
                            )}
                            onClick={() => pickInColumn(col.colIndex, opt)}
                          >
                            {opt.label}
                          </button>
                        ))
                      )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };
}
