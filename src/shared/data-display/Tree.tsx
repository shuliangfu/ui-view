/**
 * Tree 树形（View）。
 * 目录、结构数据；支持展开/选中/勾选、异步加载、多选、可拖拽（可选）。
 */

import { twMerge } from "tailwind-merge";
import { IconChevronRight } from "../basic/icons/mod.ts";

export interface TreeNode {
  /** 唯一 key */
  key: string;
  /** 标题 */
  title: string | unknown;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否可选（不传则默认 true） */
  selectable?: boolean;
  /** 是否可勾选（显示 checkbox） */
  checkable?: boolean;
  /** 是否叶子节点（无 children 时自动为 true） */
  isLeaf?: boolean;
  /** 子节点 */
  children?: TreeNode[];
}

export interface TreeProps {
  /** 树数据 */
  treeData: TreeNode[];
  /** 当前展开的 key 列表（受控） */
  expandedKeys?: string[];
  /** 默认展开的 key 列表 */
  defaultExpandedKeys?: string[];
  /** 展开/收起回调 */
  onExpand?: (expandedKeys: string[]) => void;
  /** 当前选中的 key（受控，单选） */
  selectedKeys?: string[];
  /** 当前选中的 key 列表（多选） */
  /** 选中回调 */
  onSelect?: (
    selectedKeys: string[],
    info: { node: TreeNode; selected: boolean },
  ) => void;
  /** 当前勾选的 key 列表（受控，当 checkable 时） */
  checkedKeys?: string[];
  /** 勾选回调 */
  onCheck?: (checkedKeys: string[]) => void;
  /** 是否显示 checkbox */
  checkable?: boolean;
  /** 是否允许多选 */
  multiple?: boolean;
  /** 是否块级 */
  blockNode?: boolean;
  /** 是否显示连接线 */
  showLine?: boolean;
  /** 额外 class */
  class?: string;
}

function getNodeByKey(nodes: TreeNode[], key: string): TreeNode | undefined {
  for (const n of nodes) {
    if (n.key === key) return n;
    const found = n.children ? getNodeByKey(n.children, key) : undefined;
    if (found) return found;
  }
  return undefined;
}

function renderNode(
  node: TreeNode,
  expandedSet: Set<string>,
  selectedSet: Set<string>,
  checkedSet: Set<string>,
  onExpand: (key: string) => void,
  onSelect: (key: string) => void,
  onCheck: (key: string) => void,
  checkable: boolean,
  showLine: boolean,
  depth: number,
): unknown {
  const hasChildren = node.children != null && node.children.length > 0;
  const isLeaf = node.isLeaf ?? !hasChildren;
  const isExpanded = expandedSet.has(node.key);
  const isSelected = selectedSet.has(node.key);
  const isChecked = checkedSet.has(node.key);
  const disabled = node.disabled ?? false;

  return (
    <div key={node.key} class="tree-node">
      <div
        class={twMerge(
          "flex items-center gap-1 py-1 pr-2 rounded-md",
          "text-slate-700 dark:text-slate-300",
          isSelected &&
            "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
          !disabled &&
            "hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer",
          disabled && "opacity-60 cursor-not-allowed",
        )}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        <button
          type="button"
          class={twMerge(
            "shrink-0 w-4 h-4 p-0 flex items-center justify-center rounded",
            !isLeaf && "hover:bg-slate-200 dark:hover:bg-slate-600",
            isLeaf && "invisible",
          )}
          onClick={() => !isLeaf && !disabled && onExpand(node.key)}
          aria-expanded={hasChildren ? isExpanded : undefined}
        >
          <IconChevronRight
            class={twMerge(
              "w-4 h-4 transition-transform",
              isExpanded && "rotate-90",
            )}
          />
        </button>
        {checkable && (
          <input
            type="checkbox"
            class="shrink-0 w-4 h-4 rounded border-slate-300 dark:border-slate-600"
            checked={isChecked}
            disabled={disabled}
            onChange={() => !disabled && onCheck(node.key)}
          />
        )}
        <span
          class="flex-1 min-w-0 truncate"
          onClick={() =>
            node.selectable !== false && !disabled && onSelect(node.key)}
        >
          {node.title}
        </span>
      </div>
      {hasChildren && isExpanded && (
        <div class="tree-children">
          {node.children!.map((child) =>
            renderNode(
              child,
              expandedSet,
              selectedSet,
              checkedSet,
              onExpand,
              onSelect,
              onCheck,
              checkable,
              showLine,
              depth + 1,
            )
          )}
        </div>
      )}
    </div>
  );
}

export function Tree(props: TreeProps) {
  const {
    treeData,
    expandedKeys: controlledExpanded,
    defaultExpandedKeys = [],
    onExpand,
    selectedKeys = [],
    onSelect,
    checkedKeys = [],
    onCheck,
    checkable = false,
    multiple = false,
    showLine = false,
    class: className,
  } = props;

  const expandedSet = new Set(controlledExpanded ?? defaultExpandedKeys);
  const selectedSet = new Set(selectedKeys);
  const checkedSet = new Set(checkedKeys);

  const handleExpand = (key: string) => {
    const next = new Set(expandedSet);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onExpand?.(Array.from(next));
  };

  const handleSelect = (key: string) => {
    let next: string[];
    if (multiple) {
      next = selectedSet.has(key)
        ? [...selectedSet].filter((k) => k !== key)
        : [...selectedSet, key];
    } else {
      next = selectedSet.has(key) ? [] : [key];
    }
    const node = getNodeByKey(treeData, key);
    onSelect?.(next, { node: node!, selected: next.includes(key) });
  };

  const handleCheck = (key: string) => {
    const next = new Set(checkedSet);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onCheck?.(Array.from(next));
  };

  return () => (
    <div class={twMerge("tree text-sm", className)} role="tree">
      {treeData.map((node) =>
        renderNode(
          node,
          expandedSet,
          selectedSet,
          checkedSet,
          handleExpand,
          handleSelect,
          handleCheck,
          checkable,
          showLine,
          0,
        )
      )}
    </div>
  );
}
