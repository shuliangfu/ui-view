/**
 * ContextMenu 右键菜单（View）。
 * 在触发区 `contextmenu` 时弹出菜单；Portal 挂 body。
 */

import {
  createEffect,
  createPortal,
  createSignal,
  type JSXRenderable,
  onCleanup,
} from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { getBrowserBodyPortalHost } from "../../shared/feedback/portal-host.ts";

export interface ContextMenuItem {
  key: string;
  label: unknown;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
  divider?: boolean;
}

export interface ContextMenuProps {
  /** 菜单项 */
  items: ContextMenuItem[];
  /** 触发区域（包一层）；在其上监听 contextmenu */
  children?: unknown;
  class?: string;
  /** 菜单面板 class */
  menuClass?: string;
}

export function ContextMenu(props: ContextMenuProps): JSXRenderable {
  const { items, children, class: className, menuClass } = props;
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
    const close = () => {
      open.value = false;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    globalThis.addEventListener?.("mousedown", close, true);
    globalThis.addEventListener?.("keydown", onKey);
    onCleanup(() => {
      globalThis.removeEventListener?.("mousedown", close, true);
      globalThis.removeEventListener?.("keydown", onKey);
    });
  });

  const menu = () => {
    if (!open.value) return null;
    const { x, y } = pos.value;
    return (
      <div
        class={twMerge(
          "fixed z-400 min-w-40 rounded-lg border border-slate-200 dark:border-slate-600",
          "bg-white dark:bg-slate-800 py-1 shadow-xl text-sm",
          menuClass,
        )}
        style={{ left: `${x}px`, top: `${y}px` }}
        role="menu"
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
                  it.danger && "text-red-600 dark:text-red-400",
                )}
                onClick={() => {
                  if (it.disabled) return;
                  it.onClick?.();
                  open.value = false;
                }}
              >
                {it.label}
              </button>
            )
        )}
      </div>
    );
  };

  const host = getBrowserBodyPortalHost();
  if (host) {
    createPortal(() => menu(), host);
  }

  return (
    <div class={twMerge("contents", className)} onContextMenu={(e: Event) => onContext(e as MouseEvent)}>
      {children}
      {!host ? () => menu() : null}
    </div>
  );
}
