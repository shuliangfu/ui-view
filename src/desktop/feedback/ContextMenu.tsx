/**
 * ContextMenu 右键菜单（View）。
 * 在触发区 `contextmenu` 时弹出；经 {@link Portal} 挂 `document.body` + `fixed` + 行内高 z-index，
 * 避免祖先 `overflow`／层叠上下文裁切（docs `main` 为 `overflow-y-auto`）。
 * 旧实现用无效 Tailwind `z-400`（未进 CSS）+ 命令式 `createPortal` 时机不稳，菜单常落在触发区内被裁切。
 */

import {
  createEffect,
  createSignal,
  Portal,
  Show,
  type JSXRenderable,
  onCleanup,
} from "@dreamer/view";
import { twMerge } from "tailwind-merge";

/** 高于文档站 sticky 顶栏／main `z-10`、与 Dropdown 浮层同级 */
const CONTEXT_MENU_Z_INDEX = "99999";

export interface ContextMenuItem {
  key: string;
  label: unknown;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
  divider?: boolean;
  /** 可选图标（VNode，显示在 label 左侧；对齐 ActionSheetAction.icon） */
  icon?: unknown;
}

export interface ContextMenuMessages {
  /** 菜单面板 aria-label */
  menu: string;
}

export const defaultContextMenuMessages: ContextMenuMessages = {
  menu: "上下文菜单",
};

export interface ContextMenuProps {
  /** 菜单项 */
  items: ContextMenuItem[];
  /** 触发区域（包一层）；在其上监听 contextmenu */
  children?: unknown;
  class?: string;
  /** 菜单面板 class */
  menuClass?: string;
  /** 多语言／自定义文案；未传字段走 {@link defaultContextMenuMessages} */
  messages?: Partial<ContextMenuMessages>;
}

export function ContextMenu(props: ContextMenuProps): JSXRenderable {
  const { items, children, class: className, menuClass } = props;
  const m: ContextMenuMessages = {
    ...defaultContextMenuMessages,
    ...(props.messages ?? {}),
  };
  const open = createSignal(false);
  const pos = createSignal({ x: 0, y: 0 });

  const onContext = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    pos.value = { x: e.clientX, y: e.clientY };
    open.value = true;
  };

  createEffect(() => {
    if (!open.value) return;
    // Ignore mousedown inside the menu so item onClick can fire.
    // Document listener is capture-phase; stopPropagation on the menu cannot help.
    const close = (e?: Event) => {
      if (e) {
        const t = e.target as Element | null;
        if (t && typeof t.closest === "function" && t.closest("[data-dreamer-context-menu]")) {
          return;
        }
      }
      open.value = false;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    // 下一宏任务再听 mousedown，避免本次右键事件链立刻关掉
    const t = globalThis.setTimeout?.(() => {
      globalThis.addEventListener?.("mousedown", close as EventListener, true);
    }, 0);
    globalThis.addEventListener?.("keydown", onKey);
    onCleanup(() => {
      if (t != null) globalThis.clearTimeout?.(t);
      globalThis.removeEventListener?.("mousedown", close as EventListener, true);
      globalThis.removeEventListener?.("keydown", onKey);
    });
  });

  const menu = (
    <div
      class={twMerge(
        "fixed min-w-40 rounded-lg border border-slate-200 dark:border-slate-600",
        "bg-white dark:bg-slate-800 py-1 shadow-xl text-sm",
        menuClass,
      )}
      style={() => ({
        left: `${pos.value.x}px`,
        top: `${pos.value.y}px`,
        zIndex: CONTEXT_MENU_Z_INDEX,
      })}
      role="menu"
        aria-label={m.menu}
      data-dreamer-context-menu=""
      onMouseDown={(e: Event) => e.stopPropagation()}
    >
      {items.map((it) =>
        it.divider
          ? (
            <div
              key={it.key}
              class="my-1 border-t border-slate-100 dark:border-slate-700"
              role="separator"
            />
          )
          : (
            <button
              type="button"
              key={it.key}
              role="menuitem"
              disabled={it.disabled}
              class={twMerge(
                "w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40",
                "flex items-center gap-2",
                it.danger && "text-red-600 dark:text-red-400",
              )}
              onClick={() => {
                if (it.disabled) return;
                it.onClick?.();
                open.value = false;
              }}
            >
              {it.icon != null && (
                <span class="shrink-0 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">
                  {it.icon}
                </span>
              )}
              <span class="flex-1 min-w-0">{it.label}</span>
            </button>
          )
      )}
    </div>
  );

  const body = typeof globalThis.document !== "undefined"
    ? globalThis.document.body
    : null;

  return (
    <div
      class={twMerge("block", className)}
      onContextMenu={(e: Event) => onContext(e as MouseEvent)}
    >
      {children}
      <Show when={() => open.value}>
        {body
          ? <Portal mount={body}>{menu}</Portal>
          : menu}
      </Show>
    </div>
  );
}
