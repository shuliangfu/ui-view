/**
 * Tree 树形（View）。
 * 目录、结构数据；支持展开/选中/勾选、异步加载、多选、可拖拽（可选）。
 * expandedKeys/selectedKeys/checkedKeys 可传 getter（如 signal）；用 untrack 读 getter 避免订阅导致整树重跑，
 * 用 createEffect 同步 DOM 更新勾选/展开/选中状态。
 */

import { createEffect, untrack } from "@dreamer/view";
import type { JSXRenderable } from "@dreamer/view";
import { createSignal } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
/** 按需：单文件图标，避免经 icons/mod 拉入全表 */
import { IconChevronRight } from "../basic/icons/ChevronRight.tsx";

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
  /** 当前展开的 key 列表（受控）；可传 getter 如 signal 以减少整树重渲染 */
  expandedKeys?: string[] | (() => string[]);
  /** 默认展开的 key 列表 */
  defaultExpandedKeys?: string[];
  /** 展开/收起回调 */
  onExpand?: (expandedKeys: string[]) => void;
  /** 当前选中的 key（受控）；可传 getter 以减少整树重渲染 */
  selectedKeys?: string[] | (() => string[]);
  /** 选中回调 */
  onSelect?: (
    selectedKeys: string[],
    info: { node: TreeNode; selected: boolean },
  ) => void;
  /** 当前勾选的 key 列表（受控，当 checkable 时）；可传 getter 以减少整树重渲染 */
  checkedKeys?: string[] | (() => string[]);
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

  // 直接返回 JSX，不包一层函数，避免父组件重跑时整树被当作新子组件替换导致「整树沉浸」、无法展开/选中/勾选
  return () => (
    <div key={node.key} class="tree-node">
      <div
        data-tree-node-key={node.key}
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
          data-tree-expand-key={node.key}
          class={twMerge(
            "shrink-0 w-4 h-4 p-0 flex items-center justify-center rounded",
            !isLeaf && "hover:bg-slate-200 dark:hover:bg-slate-600",
            isLeaf && "invisible",
          )}
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
            data-tree-check-key={node.key}
            class="shrink-0 w-4 h-4 rounded border-slate-300 dark:border-slate-600 cursor-pointer"
            checked={isChecked}
            disabled={disabled}
          />
        )}
        <span
          data-tree-select-key={node.key}
          class="flex-1 min-w-0 truncate select-none"
        >
          {node.title}
        </span>
      </div>
      {hasChildren && (
        <div
          class="tree-children"
          data-tree-children-key={node.key}
          style={{ display: isExpanded ? "" : "none" }}
        >
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

/** 将 array 或 getter 规范为 getter */
function asGetter(
  value: string[] | (() => string[]) | undefined,
  fallback: string[],
): () => string[] {
  if (typeof value === "function") return value as () => string[];
  return () => (value ?? fallback);
}

export function Tree(props: TreeProps): JSXRenderable {
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

  const getExpandedKeys = asGetter(controlledExpanded, defaultExpandedKeys);
  const getSelectedKeys = asGetter(selectedKeys, []);
  const getCheckedKeys = asGetter(checkedKeys, []);

  /** 用 untrack 读 getter，拿当前值做首屏且不订阅，避免 signal 更新时整树重跑 */
  const expandedSet = new Set(
    untrack(() =>
      typeof controlledExpanded === "function"
        ? (controlledExpanded as () => string[])()
        : (controlledExpanded ?? defaultExpandedKeys)
    ),
  );
  const selectedSet = new Set(
    untrack(() =>
      typeof selectedKeys === "function"
        ? (selectedKeys as () => string[])()
        : (selectedKeys ?? [])
    ),
  );
  const checkedSet = new Set(
    untrack(() =>
      typeof checkedKeys === "function"
        ? (checkedKeys as () => string[])()
        : (checkedKeys ?? [])
    ),
  );

  const handleExpand = (key: string) => {
    const cur = new Set(getExpandedKeys());
    if (cur.has(key)) cur.delete(key);
    else cur.add(key);
    onExpand?.(Array.from(cur));
  };

  const handleSelect = (key: string) => {
    const cur = new Set(getSelectedKeys());
    let next: string[];
    if (multiple) {
      next = cur.has(key) ? [...cur].filter((k) => k !== key) : [...cur, key];
    } else {
      next = cur.has(key) ? [] : [key];
    }
    const node = getNodeByKey(treeData, key);
    onSelect?.(next, { node: node!, selected: next.includes(key) });
  };

  const handleCheck = (key: string) => {
    const cur = new Set(getCheckedKeys());
    if (cur.has(key)) cur.delete(key);
    else cur.add(key);
    onCheck?.(Array.from(cur));
  };

  const handleTreeClick = (e: Event) => {
    const me = e as MouseEvent;
    const root = rootElRef.value;
    if (!root || !root.contains(me.target as Node)) return;
    const clientX = me.clientX;
    const clientY = me.clientY;
    if (typeof clientX !== "number" || typeof clientY !== "number") return;
    const doc = globalThis.document;
    const elementsAtPoint = doc?.elementsFromPoint?.(clientX, clientY) ?? [];
    let row: Element | null = null;
    for (const el of elementsAtPoint) {
      if (!root.contains(el)) break;
      const r = (el as HTMLElement).closest?.("[data-tree-node-key]");
      if (r && root.contains(r)) row = r;
    }
    const key = row?.getAttribute("data-tree-node-key");
    if (!key || !row) return;
    const node = getNodeByKey(treeData, key);
    if (!node || (node.disabled ?? false)) return;
    const topEl = (elementsAtPoint[0] as HTMLElement) ?? row;
    const raw = topEl?.nodeType === 3
      ? (topEl as unknown as Text).parentElement
      : topEl;
    if (!raw?.closest) return;
    if (row.contains(raw) && raw.closest("button[data-tree-expand-key]")) {
      const isLeaf = node.isLeaf ??
        !(node.children != null && node.children.length > 0);
      if (!isLeaf) {
        e.preventDefault();
        e.stopPropagation();
        handleExpand(key);
      }
      return;
    }
    if (row.contains(raw) && raw.closest("input[data-tree-check-key]")) {
      e.preventDefault();
      e.stopPropagation();
      handleCheck(key);
      if (node.selectable !== false) handleSelect(key);
      return;
    }
    if (
      row.contains(raw) &&
      (raw.closest("span[data-tree-select-key]") || raw === row)
    ) {
      e.preventDefault();
      e.stopPropagation();
      if (checkable) handleCheck(key);
      if (node.selectable !== false) handleSelect(key);
    }
  };

  const rootElRef = createSignal<HTMLDivElement | null>(null);

  createEffect(() => {
    // 先读 getter 建立订阅，再读 root `Signal`，这样 ref 挂上或 keys 变化时都会重跑并同步 DOM
    const expanded = new Set(getExpandedKeys());
    const selected = new Set(getSelectedKeys());
    const checked = new Set(getCheckedKeys());
    const root = rootElRef.value;
    // SSR 时 ref 可能为占位对象，无 DOM API；仅在有真实 Element 时同步勾选/展开态
    if (!root || typeof root.querySelectorAll !== "function") return;
    root.querySelectorAll<HTMLInputElement>("input[data-tree-check-key]")
      .forEach((input) => {
        const key = input.getAttribute("data-tree-check-key");
        if (key) input.checked = checked.has(key);
      });
    root.querySelectorAll<HTMLButtonElement>("button[data-tree-expand-key]")
      .forEach((btn) => {
        const key = btn.getAttribute("data-tree-expand-key");
        if (key) {
          const open = expanded.has(key);
          btn.setAttribute("aria-expanded", String(open));
          const icon = btn.querySelector("[class*='transition-transform']");
          if (icon) (icon as HTMLElement).classList.toggle("rotate-90", open);
        }
      });
    root.querySelectorAll<HTMLElement>("[data-tree-node-key]").forEach(
      (row) => {
        const key = row.getAttribute("data-tree-node-key");
        if (!key) return;
        const isSelected = selected.has(key);
        row.classList.toggle("bg-blue-50", isSelected);
        row.classList.toggle("dark:bg-blue-900/30", isSelected);
        row.classList.toggle("text-blue-700", isSelected);
        row.classList.toggle("dark:text-blue-300", isSelected);
      },
    );
    root.querySelectorAll<HTMLElement>(".tree-children").forEach((wrap) => {
      const key = wrap.getAttribute("data-tree-children-key");
      wrap.style.display = key && expanded.has(key) ? "" : "none";
    });
  });

  /**
   * 渲染 getter：配合 `createEffect` 内读 `rootElRef.value` 与受控 keys getter，同步 DOM 勾选/展开态。
   */
  return () => (
    <div
      ref={(el: unknown) => {
        rootElRef.value = el as HTMLDivElement | null;
      }}
      class={twMerge("tree text-sm", className)}
      role="tree"
      onClick={handleTreeClick}
    >
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
