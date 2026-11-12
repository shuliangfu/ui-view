/**
 * Tree 树形（View）。
 * 目录、结构数据；支持展开／选中／勾选（默认父子联动＋半选；`checkStrictly` 时严格独立）。
 *
 * `expandedKeys`／`selectedKeys`／`checkedKeys` 请传 Signal 或 getter；勿传 `signal.value` 快照，
 * 否则回调写回后组件仍读旧数组，表现为展开／勾选「点了没反应」。
 *
 * 交互分流（勿混用）：
 * - 箭头：仅展开／收起（expandedKeys）
 * - checkbox：仅勾选（checkedKeys；默认 cascade／半选，checkStrictly 关闭联动）
 * - 标题／行空白：仅选中本节点（selectedKeys），绝不改父级 selected、绝不写 checkedKeys
 */

import {
  createEffect,
  createSignal,
  type JSXRenderable,
  untrack,
} from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import {
  focusSelectAllHost,
  isSelectAllHotkey,
  preventSelectAllDefault,
  setSelectAllHost,
  toggleSelectAllKeys,
} from "../select-all-hotkey.ts";
import { IconChevronRight } from "../basic/icons/ChevronRight.tsx";
import {
  readSignalValue,
  safeIsSignal,
  writeSignalValue,
} from "../safe-signal.ts";

export interface TreeNode {
  /** 唯一 key */
  key: string;
  /** 标题 */
  title: string | unknown;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否可选（不传则默认 true） */
  selectable?: boolean;
  /** 是否可勾选（显示 checkbox）；节点级可覆盖 */
  checkable?: boolean;
  /** 是否叶子节点（无 children 时自动为 true） */
  isLeaf?: boolean;
  /** 子节点 */
  children?: TreeNode[];
}

export interface TreeMessages {
  /** 展开按钮 aria-label */
  expand: string;
  /** 收起按钮 aria-label */
  collapse: string;
}

export const defaultTreeMessages: TreeMessages = {
  expand: "展开",
  collapse: "收起",
};

export interface TreeProps {
  /** 树数据 */
  treeData: TreeNode[];
  /** 当前展开的 key 列表（受控）；请传 Signal／getter，勿传 `.value` 快照 */
  expandedKeys?: string[] | (() => string[]) | unknown;
  /** 默认展开的 key 列表 */
  defaultExpandedKeys?: string[];
  /** 展开/收起回调 */
  onExpand?: (expandedKeys: string[]) => void;
  /** 当前选中的 key（受控） */
  selectedKeys?: string[] | (() => string[]) | unknown;
  /** 选中回调 */
  onSelect?: (
    selectedKeys: string[],
    info: { node: TreeNode; selected: boolean },
  ) => void;
  /** 当前勾选的 key 列表（受控，当 checkable 时） */
  checkedKeys?: string[] | (() => string[]) | unknown;
  /** 勾选回调 */
  onCheck?: (checkedKeys: string[]) => void;
  /** 是否显示 checkbox */
  checkable?: boolean;
  /**
   * 勾选是否父子独立。
   * - `false`（默认）：勾选父级联动子孙；子孙部分勾选时父级半选
   * - `true`：仅切换自身
   */
  checkStrictly?: boolean;
  /** 是否允许多选 */
  multiple?: boolean;
  /** 是否块级 */
  blockNode?: boolean;
  /** 是否显示连接线 */
  showLine?: boolean;
  /** 额外 class */
  class?: string;
  /** 多语言／自定义文案；未传字段走 {@link defaultTreeMessages} */
  messages?: Partial<TreeMessages>;
}

function getNodeByKey(nodes: TreeNode[], key: string): TreeNode | undefined {
  for (const n of nodes) {
    if (n.key === key) return n;
    const found = n.children ? getNodeByKey(n.children, key) : undefined;
    if (found) return found;
  }
  return undefined;
}

function collectDescendantKeys(node: TreeNode): string[] {
  const out: string[] = [];
  const walk = (n: TreeNode) => {
    if (!n.children) return;
    for (const c of n.children) {
      out.push(c.key);
      walk(c);
    }
  };
  walk(node);
  return out;
}

function collectSelectableTreeKeys(
  nodes: TreeNode[],
  mode: "check" | "select",
): string[] {
  const out: string[] = [];
  const walk = (node: TreeNode) => {
    const allowed = mode === "check"
      ? !node.disabled && node.checkable !== false
      : !node.disabled;
    if (allowed) out.push(node.key);
    node.children?.forEach(walk);
  };
  nodes.forEach(walk);
  return out;
}

/** 更直观的找父：返回父节点 */
function getParentNode(nodes: TreeNode[], key: string): TreeNode | null {
  for (const n of nodes) {
    if (n.children?.some((c) => c.key === key)) return n;
    if (n.children) {
      const p = getParentNode(n.children, key);
      if (p) return p;
    }
  }
  return null;
}

type CheckVisual = "checked" | "unchecked" | "indeterminate";

function visualCheckState(
  node: TreeNode,
  checked: Set<string>,
  checkStrictly: boolean,
): CheckVisual {
  if (checkStrictly || !node.children?.length) {
    return checked.has(node.key) ? "checked" : "unchecked";
  }
  const childStates = node.children.map((c) =>
    visualCheckState(c, checked, false)
  );
  const allChecked = childStates.every((s) => s === "checked");
  const allUnchecked = childStates.every((s) => s === "unchecked");
  if (allChecked) return "checked";
  if (allUnchecked) {
    return checked.has(node.key) ? "checked" : "unchecked";
  }
  return "indeterminate";
}

/** 联动后根据子孙校正祖先：全选则加入，否则移出（半选仅 DOM indeterminate） */
function reconcileAncestors(
  treeData: TreeNode[],
  fromKey: string,
  checked: Set<string>,
): void {
  let parent = getParentNode(treeData, fromKey);
  while (parent) {
    const children = parent.children ?? [];
    const allOn = children.every((c) =>
      visualCheckState(c, checked, false) === "checked"
    );
    if (allOn) checked.add(parent.key);
    else checked.delete(parent.key);
    parent = getParentNode(treeData, parent.key);
  }
}

function asGetter(
  value: unknown,
  fallback: string[],
): () => string[] {
  if (typeof value === "function") return value as () => string[];
  if (safeIsSignal(value)) {
    return () => {
      const v = readSignalValue(value as never);
      return Array.isArray(v) ? (v as string[]) : fallback;
    };
  }
  if (Array.isArray(value)) {
    // 字面量快照：仅作初始／非响应；文档应改传 Signal／getter
    const snap = value as string[];
    return () => snap;
  }
  return () => fallback;
}

function renderNode(
  node: TreeNode,
  depth: number,
  ctx: {
    getExpanded: () => Set<string>;
    getSelected: () => Set<string>;
    getChecked: () => Set<string>;
    checkStrictly: boolean;
    checkable: boolean;
    showLine: boolean;
    blockNode: boolean;
    messages: TreeMessages;
    onExpand: (key: string) => void;
    onSelect: (key: string) => void;
    onCheck: (key: string) => void;
  },
): unknown {
  const hasChildren = node.children != null && node.children.length > 0;
  const isLeaf = node.isLeaf ?? !hasChildren;
  const disabled = node.disabled ?? false;
  const nodeCheckable = ctx.checkable && (node.checkable !== false);

  return (
    <div key={node.key} class="tree-node" data-tree-node-wrap={node.key}>
      {() => {
        const expandedSet = ctx.getExpanded();
        const selectedSet = ctx.getSelected();
        const checkedSet = ctx.getChecked();
        const isExpanded = expandedSet.has(node.key);
        const isSelected = selectedSet.has(node.key);
        const vcheck = nodeCheckable
          ? visualCheckState(node, checkedSet, ctx.checkStrictly)
          : "unchecked";
        return (
          <div
            data-tree-node-key={node.key}
            role="treeitem"
            tabIndex={disabled ? -1 : 0}
            aria-expanded={hasChildren ? isExpanded : undefined}
            aria-selected={isSelected}
            class={twMerge(
              "flex items-center gap-1 py-1 pr-2 outline-none relative",
              ctx.blockNode ? "rounded-none w-full" : "rounded-md",
              "text-slate-700 dark:text-slate-300",
              "focus-visible:ring-2 focus-visible:ring-blue-500/60",
              isSelected &&
                "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
              !disabled &&
                "hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer",
              disabled && "opacity-60 cursor-not-allowed",
            )}
            style={{
              paddingLeft: ctx.showLine
                ? `${depth * 20 + 12}px`
                : `${depth * 16 + 4}px`,
            }}
            data-tree-show-line={ctx.showLine ? "true" : undefined}
            data-tree-block-node={ctx.blockNode ? "true" : undefined}
            data-tree-selected={isSelected ? "true" : undefined}
            data-tree-check-visual={nodeCheckable ? vcheck : undefined}
            onClick={(e: Event) => {
              // 行空白：仅选中本节点（不展开、不勾选）；子控件已 stopPropagation
              e.stopPropagation();
              if (disabled) return;
              if (node.selectable !== false) ctx.onSelect(node.key);
            }}
            onKeyDown={(e: KeyboardEvent) => {
              if (disabled) return;
              const key = e.key;
              if (key === "ArrowRight") {
                e.preventDefault();
                if (hasChildren && !isExpanded) ctx.onExpand(node.key);
              } else if (key === "ArrowLeft") {
                e.preventDefault();
                if (hasChildren && isExpanded) ctx.onExpand(node.key);
              } else if (key === "Enter") {
                e.preventDefault();
                if (node.selectable !== false) ctx.onSelect(node.key);
              } else if (key === " " || key === "Spacebar") {
                e.preventDefault();
                if (nodeCheckable) ctx.onCheck(node.key);
                else if (node.selectable !== false) ctx.onSelect(node.key);
              }
            }}
          >
            <button
              type="button"
              data-tree-expand-key={node.key}
              class={twMerge(
                "shrink-0 w-4 h-4 p-0 flex items-center justify-center rounded",
                !isLeaf && "hover:bg-slate-200 dark:hover:bg-slate-600",
                isLeaf && "invisible pointer-events-none",
              )}
              aria-expanded={hasChildren ? isExpanded : undefined}
              aria-label={isExpanded
                ? ctx.messages.collapse
                : ctx.messages.expand}
              disabled={disabled || isLeaf}
              onClick={(e: Event) => {
                e.preventDefault();
                e.stopPropagation();
                if (!disabled && !isLeaf) ctx.onExpand(node.key);
              }}
            >
              <IconChevronRight
                class={twMerge(
                  "w-4 h-4 transition-transform",
                  isExpanded && "rotate-90",
                )}
              />
            </button>
            {nodeCheckable && (
              <input
                type="checkbox"
                data-tree-check-key={node.key}
                class="shrink-0 w-4 h-4 rounded border-slate-300 dark:border-slate-600 cursor-pointer"
                checked={vcheck === "checked"}
                disabled={disabled}
                aria-checked={vcheck === "indeterminate"
                  ? "mixed"
                  : vcheck === "checked"}
                onClick={(e: Event) => {
                  // 拦冒泡，避免行 onClick 写入 selected；同步触发勾选（兼容仅绑定 click 的运行时）
                  e.preventDefault();
                  e.stopPropagation();
                  if (!disabled) ctx.onCheck(node.key);
                }}
                onChange={(e: Event) => {
                  // 受控：忽略原生切换；勾选已在 onClick 处理，避免双触发
                  e.preventDefault();
                  e.stopPropagation();
                }}
              />
            )}
            <span
              data-tree-select-key={node.key}
              class="flex-1 min-w-0 truncate select-none"
              onClick={(e: Event) => {
                e.stopPropagation();
                if (disabled) return;
                // 标题：仅 selectedKeys（本 key）；勾选只走 checkbox；展开只走箭头
                if (node.selectable !== false) ctx.onSelect(node.key);
              }}
            >
              {node.title}
            </span>
          </div>
        );
      }}
      {hasChildren && (
        <div
          class={twMerge(
            "tree-children",
            ctx.showLine &&
              "ml-2.75 border-l border-slate-200 dark:border-slate-600",
          )}
          data-tree-children-key={node.key}
          data-tree-show-line={ctx.showLine ? "true" : undefined}
        >
          {() => {
            const open = ctx.getExpanded().has(node.key);
            if (!open) return null;
            return node.children!.map((child) => (
              <div
                class={twMerge(
                  ctx.showLine && "relative",
                )}
                data-tree-line-item={ctx.showLine ? "true" : undefined}
              >
                {ctx.showLine && (
                  <span
                    aria-hidden="true"
                    class="pointer-events-none absolute left-0 top-3.5 w-3 border-t border-slate-200 dark:border-slate-600"
                  />
                )}
                {renderNode(child, depth + 1, ctx)}
              </div>
            ));
          }}
        </div>
      )}
    </div>
  );
}

export function Tree(props: TreeProps): JSXRenderable {
  const {
    treeData,
    expandedKeys: controlledExpanded,
    defaultExpandedKeys = [],
    onExpand,
    selectedKeys,
    onSelect,
    checkedKeys,
    onCheck,
    checkable = false,
    checkStrictly = false,
    multiple = false,
    blockNode = false,
    showLine = false,
    class: className,
  } = props;
  const treeMessages: TreeMessages = {
    ...defaultTreeMessages,
    ...(props.messages ?? {}),
  };

  const getExpandedKeys = asGetter(controlledExpanded, defaultExpandedKeys);
  const getSelectedKeysProp = asGetter(
    props.selectedKeys !== undefined ? selectedKeys : undefined,
    [],
  );
  const getCheckedKeysProp = asGetter(
    props.checkedKeys !== undefined ? checkedKeys : undefined,
    [],
  );

  /** 非受控展开兜底（未传 expandedKeys 时） */
  const innerExpanded = createSignal<string[]>(
    untrack(() => [...defaultExpandedKeys]),
  );
  const innerSelected = createSignal<string[]>([]);
  const innerChecked = createSignal<string[]>([]);

  const hasControlledExpanded = controlledExpanded !== undefined &&
    controlledExpanded !== null;
  const hasControlledSelected = props.selectedKeys !== undefined;
  const hasControlledChecked = props.checkedKeys !== undefined;

  const readExpanded = () =>
    hasControlledExpanded ? getExpandedKeys() : innerExpanded.value;
  const readSelected = () =>
    hasControlledSelected ? getSelectedKeysProp() : innerSelected.value;
  const readChecked = () =>
    hasControlledChecked ? getCheckedKeysProp() : innerChecked.value;

  const commitExpanded = (next: string[]) => {
    if (safeIsSignal(props.expandedKeys)) {
      writeSignalValue(props.expandedKeys as never, next);
    } else if (!hasControlledExpanded) {
      innerExpanded.set(next);
    }
    onExpand?.(next);
  };

  const commitSelected = (
    next: string[],
    info: { node: TreeNode; selected: boolean },
  ) => {
    if (safeIsSignal(props.selectedKeys)) {
      writeSignalValue(props.selectedKeys as never, next);
    } else if (!hasControlledSelected) {
      innerSelected.set(next);
    }
    onSelect?.(next, info);
  };

  const commitChecked = (next: string[]) => {
    if (safeIsSignal(props.checkedKeys)) {
      writeSignalValue(props.checkedKeys as never, next);
    } else if (!hasControlledChecked) {
      innerChecked.set(next);
    }
    onCheck?.(next);
  };

  const handleExpand = (key: string) => {
    const cur = new Set(readExpanded());
    if (cur.has(key)) cur.delete(key);
    else cur.add(key);
    commitExpanded(Array.from(cur));
  };

  const handleSelect = (key: string) => {
    const cur = new Set(readSelected());
    let next: string[];
    if (multiple) {
      next = cur.has(key) ? [...cur].filter((k) => k !== key) : [...cur, key];
    } else {
      next = cur.has(key) ? [] : [key];
    }
    const node = getNodeByKey(treeData, key);
    if (!node) return;
    commitSelected(next, { node, selected: next.includes(key) });
  };

  const handleCheck = (key: string) => {
    const node = getNodeByKey(treeData, key);
    if (!node || node.disabled) return;
    const cur = new Set(readChecked());

    if (checkStrictly) {
      if (cur.has(key)) cur.delete(key);
      else cur.add(key);
    } else {
      const desc = collectDescendantKeys(node);
      const fullyOn = cur.has(key) && desc.every((k) => cur.has(k));
      if (fullyOn || visualCheckState(node, cur, false) === "checked") {
        cur.delete(key);
        for (const k of desc) cur.delete(k);
      } else {
        cur.add(key);
        for (const k of desc) cur.add(k);
      }
      reconcileAncestors(treeData, key, cur);
    }

    commitChecked(Array.from(cur));
  };

  const ctx = {
    getExpanded: () => new Set(readExpanded()),
    getSelected: () => new Set(readSelected()),
    getChecked: () => new Set(readChecked()),
    checkStrictly,
    checkable,
    showLine,
    blockNode,
    messages: treeMessages,
    onExpand: handleExpand,
    onSelect: handleSelect,
    onCheck: handleCheck,
  };

  // 同步原生 indeterminate（属性需 DOM 赋值）
  const rootElRef = createSignal<HTMLElement | null>(null);
  createEffect(() => {
    const checked = new Set(readChecked());
    const root = rootElRef.value;
    if (!root || typeof root.querySelectorAll !== "function") return;
    root.querySelectorAll<HTMLInputElement>("input[data-tree-check-key]")
      .forEach((input) => {
        const k = input.getAttribute("data-tree-check-key");
        if (!k) return;
        const n = getNodeByKey(treeData, k);
        if (!n) return;
        const v = visualCheckState(n, checked, checkStrictly);
        input.checked = v === "checked";
        input.indeterminate = v === "indeterminate";
      });
  });

  const selectAllInTree = (event: KeyboardEvent) => {
    if (!isSelectAllHotkey(event)) return;
    if (checkable) {
      preventSelectAllDefault(event);
      const all = collectSelectableTreeKeys(treeData, "check");
      commitChecked(toggleSelectAllKeys(readChecked(), all));
      return;
    }
    if (multiple) {
      preventSelectAllDefault(event);
      const all = collectSelectableTreeKeys(treeData, "select");
      const next = toggleSelectAllKeys(readSelected(), all);
      const infoNode = treeData[0];
      if (!infoNode) return;
      commitSelected(next, {
        node: infoNode,
        selected: next.length > 0,
      });
    }
  };

  return (
    <div
      ref={(el: unknown) => {
        const root = (el as HTMLElement | null) ?? null;
        rootElRef.set(root);
        if (root && (checkable || multiple)) {
          setSelectAllHost(root, () => {
            if (checkable) {
              const all = collectSelectableTreeKeys(treeData, "check");
              commitChecked(toggleSelectAllKeys(readChecked(), all));
              return;
            }
            const all = collectSelectableTreeKeys(treeData, "select");
            const next = toggleSelectAllKeys(readSelected(), all);
            const infoNode = treeData[0];
            if (!infoNode) return;
            commitSelected(next, {
              node: infoNode,
              selected: next.length > 0,
            });
          });
        }
      }}
      class={twMerge(
        "tree text-sm",
        showLine && "tree-show-line",
        blockNode && "tree-block-node",
        className,
      )}
      role="tree"
      data-dreamer-tree=""
      data-tree-check-strictly={checkStrictly ? "true" : "false"}
      data-tree-show-line={showLine ? "true" : undefined}
      data-tree-block-node={blockNode ? "true" : undefined}
      tabIndex={checkable || multiple ? -1 : undefined}
      data-select-all-host={checkable || multiple ? "" : undefined}
      onMouseDown={checkable || multiple ? focusSelectAllHost : undefined}
      onKeyDown={checkable || multiple ? selectAllInTree : undefined}
    >
      {treeData.map((node) => renderNode(node, 0, ctx))}
    </div>
  );
}
