/**
 * Menu 菜单列表（View）。
 * 桌面多级、移动可单层/折叠；支持 selectedKeys、onClick、vertical/horizontal、
 * 水平子菜单弹出层（usePopoverSubmenu）、键盘上下键导航（focusedKey/onFocusChange）。
 */

import { createSignal } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { IconChevronRight } from "../basic/icons/mod.ts";

export interface MenuItem {
  /** 唯一 key */
  key: string;
  /** 显示文案或节点 */
  label: string | unknown;
  /** 是否禁用 */
  disabled?: boolean;
  /** 子菜单（多级） */
  children?: MenuItem[];
}

export interface MenuProps {
  /** 菜单项（支持多级 children） */
  items: MenuItem[];
  /** 当前选中的 key 列表；可为 getter 以配合 View 细粒度更新（点击子项后选中态会正确更新） */
  selectedKeys?: string[] | (() => string[]);
  /** 点击项回调（key） */
  onClick?: (key: string) => void;
  /** 模式：垂直 或 水平，默认 "vertical" */
  mode?: "vertical" | "horizontal";
  /** 水平模式下子菜单是否以弹出层展示（否则内联），默认 false */
  usePopoverSubmenu?: boolean;
  /** 是否展开所有子菜单（vertical 时），默认 false */
  defaultOpenKeys?: string[];
  /** 受控展开的子菜单 key 列表；可为 getter 以配合 View 细粒度更新（点击子菜单可收起/展开） */
  openKeys?: string[] | (() => string[]);
  /** 展开/收起子菜单回调（可选，受控时用） */
  onOpenChange?: (openKeys: string[]) => void;
  /** 键盘导航：当前焦点的 key（由父级维护） */
  focusedKey?: string;
  /** 键盘上下键切换焦点时回调 */
  onFocusChange?: (key: string) => void;
  /** 额外 class */
  class?: string;
}

/** 扁平化可聚焦 key 顺序（先顶层，再各展开子菜单内项） */
function getOrderedKeys(items: MenuItem[], openKeys: Set<string>): string[] {
  const out: string[] = [];
  function walk(list: MenuItem[]) {
    for (const item of list) {
      out.push(item.key);
      if (item.children?.length && openKeys.has(item.key)) walk(item.children);
    }
  }
  walk(items);
  return out;
}

function renderItem(
  item: MenuItem,
  selectedKeys: Set<string>,
  openKeys: Set<string>,
  onOpenChange: (key: string) => void,
  onClick: ((key: string) => void) | undefined,
  depth: number,
  mode: "vertical" | "horizontal",
  usePopoverSubmenu: boolean,
  focusedKey: string | undefined,
  onFocusChange: ((key: string) => void) | undefined,
  /** 水平弹出层下点击叶子项后关闭弹出层（如 onOpenChange([])） */
  onCloseSubmenu?: () => void,
) {
  const hasChildren = item.children != null && item.children.length > 0;
  const isOpen = hasChildren && openKeys.has(item.key);
  const isSelected = selectedKeys.has(item.key);
  const isHorizontalPopover = mode === "horizontal" && usePopoverSubmenu;

  const toggleOpen = () => {
    if (hasChildren) onOpenChange(item.key);
  };

  const submenuContent = hasChildren && (
    <div
      class={twMerge(
        "min-w-[120px] py-1 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg",
        isHorizontalPopover
          ? "absolute top-full left-0 mt-1 z-50 py-1 px-1.5"
          : "px-1 border-l border-slate-200 dark:border-slate-600 ml-2 my-1",
      )}
    >
      {item.children!.map((child) =>
        renderItem(
          child,
          selectedKeys,
          openKeys,
          onOpenChange,
          onClick,
          depth + 1,
          mode,
          usePopoverSubmenu,
          focusedKey,
          onFocusChange,
        )
      )}
    </div>
  );

  if (hasChildren) {
    const trigger = (
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="true"
        data-menu-key={item.key}
        tabIndex={focusedKey === item.key ? 0 : -1}
        class={twMerge(
          mode === "horizontal"
            ? "flex items-center gap-1 px-3 py-2"
            : "w-full flex items-center justify-between gap-2 px-3 py-2 text-left",
          "text-sm rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700",
          item.disabled && "opacity-50 cursor-not-allowed",
        )}
        disabled={item.disabled}
        onClick={toggleOpen}
      >
        <span>{item.label}</span>
        <IconChevronRight
          class={twMerge(
            "shrink-0 w-4 h-4",
            mode === "vertical" && isOpen && "rotate-90",
          )}
        />
      </button>
    );
    return (
      <div
        key={item.key}
        class={twMerge(
          "border-slate-100 dark:border-slate-700",
          isHorizontalPopover && "relative inline-block",
        )}
      >
        {trigger}
        {isOpen && submenuContent}
      </div>
    );
  }

  // 子菜单项（depth > 0）或垂直模式：按钮撑满宽度，选中背景才能铺满整行；子菜单内用直角，避免药丸状
  const fullWidth = mode !== "horizontal" || depth > 0;
  const isInSubmenu = depth > 0;
  return (
    <button
      key={item.key}
      type="button"
      data-menu-key={item.key}
      tabIndex={focusedKey === item.key ? 0 : -1}
      class={twMerge(
        fullWidth
          ? "w-full flex items-center gap-2 px-3 py-2 text-left"
          : "flex items-center px-3 py-2",
        isInSubmenu ? "rounded-xs" : "rounded-md",
        "text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700",
        isSelected &&
          "bg-blue-50 dark:bg-blue-800/50 text-blue-600 dark:text-blue-300 font-medium",
        item.disabled && "opacity-50 cursor-not-allowed",
      )}
      disabled={item.disabled}
      onClick={() => {
        if (item.disabled) return;
        onClick?.(item.key);
        if (isHorizontalPopover && depth > 0) onCloseSubmenu?.();
      }}
    >
      {item.label}
    </button>
  );
}

export function Menu(props: MenuProps) {
  const {
    items,
    onClick,
    mode = "vertical",
    usePopoverSubmenu = false,
    defaultOpenKeys = [],
    onOpenChange,
    focusedKey,
    onFocusChange,
    class: className,
  } = props;

  const resolvedInitialOpen = typeof props.openKeys === "function"
    ? props.openKeys()
    : (props.openKeys ?? defaultOpenKeys);
  const [popoverOpenKeys, setPopoverOpenKeys] = createSignal<string[]>(
    resolvedInitialOpen,
  );

  const handleOpenChange = (key: string) => {
    const openVal = usePopoverSubmenu
      ? popoverOpenKeys()
      : (typeof props.openKeys === "function"
        ? props.openKeys()
        : (props.openKeys ?? defaultOpenKeys));
    const next = new Set(openVal);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    const nextArr = Array.from(next);
    if (usePopoverSubmenu) setPopoverOpenKeys(nextArr);
    onOpenChange?.(nextArr);
  };

  const closePopover = () => {
    setPopoverOpenKeys([]);
    onOpenChange?.([]);
  };

  const selectedKeysVal = typeof props.selectedKeys === "function"
    ? props.selectedKeys()
    : (props.selectedKeys ?? []);
  const openKeysVal = usePopoverSubmenu
    ? popoverOpenKeys()
    : (typeof props.openKeys === "function"
      ? props.openKeys()
      : (props.openKeys ?? defaultOpenKeys));
  const selectedSet = new Set(selectedKeysVal);
  const openSet = new Set(openKeysVal);
  const orderedKeys = getOrderedKeys(items, openSet);

  const handleKeyDown = (e: Event) => {
    if (!onFocusChange || orderedKeys.length === 0) return;
    const ev = e as KeyboardEvent;
    if (ev.key !== "ArrowDown" && ev.key !== "ArrowUp") return;
    ev.preventDefault();
    const current = focusedKey != null ? orderedKeys.indexOf(focusedKey) : -1;
    const nextIndex = ev.key === "ArrowDown"
      ? Math.min(orderedKeys.length - 1, current + 1)
      : Math.max(0, current - 1);
    onFocusChange(orderedKeys[nextIndex] ?? orderedKeys[0]!);
  };

  return () => (
    <nav
      class={twMerge(
        "flex flex-col gap-0.5",
        mode === "horizontal" && "flex-row flex-wrap items-center",
        className,
      )}
      role="menu"
      onKeyDown={onFocusChange
        ? (handleKeyDown as (e: Event) => void)
        : undefined}
    >
      {items.map((item) =>
        renderItem(
          item,
          selectedSet,
          openSet,
          handleOpenChange,
          onClick,
          0,
          mode,
          usePopoverSubmenu,
          focusedKey,
          onFocusChange,
          usePopoverSubmenu ? closePopover : undefined,
        )
      )}
    </nav>
  );
}
