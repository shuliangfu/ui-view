/**
 * DropdownMenu 下拉菜单（移动）（View）。
 * 顶栏多列筛选／菜单：点击标题展开选项面板（非桌面 Hover Dropdown）。
 */

import {
  createSignal,
  type JSXRenderable,
} from "@dreamer/view";
import { twMerge } from "tailwind-merge";

export interface DropdownMenuOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface DropdownMenuItem {
  key: string;
  title: string;
  options: DropdownMenuOption[];
}

export interface DropdownMenuProps {
  items: DropdownMenuItem[];
  /** 各列当前值 value map */
  value?: Record<string, string>;
  onChange?: (key: string, value: string) => void;
  class?: string;
}

export function DropdownMenu(props: DropdownMenuProps): JSXRenderable {
  const { items, onChange, class: className } = props;
  const openKey = createSignal<string | null>(null);
  const local = createSignal<Record<string, string>>({});

  const valueOf = (key: string, fallback?: string) =>
    props.value?.[key] ?? local.value[key] ?? fallback ?? items.find((i) => i.key === key)?.options[0]?.value ?? "";

  const labelOf = (item: DropdownMenuItem) => {
    const v = valueOf(item.key);
    return item.options.find((o) => o.value === v)?.label ?? item.title;
  };

  return () => (
    <div class={twMerge("dropdown-menu relative z-20", className)}>
      <div class="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        {items.map((it) => {
          const active = openKey.value === it.key;
          return (
            <button
              type="button"
              key={it.key}
              class={twMerge(
                "flex-1 py-2.5 text-sm",
                active ? "text-blue-600 font-medium" : "text-slate-700 dark:text-slate-200",
              )}
              onClick={() => {
                openKey.value = active ? null : it.key;
              }}
            >
              {labelOf(it)}
              <span class="ml-1 text-[10px] opacity-60">{active ? "▲" : "▼"}</span>
            </button>
          );
        })}
      </div>
      {openKey.value != null && (
        <>
          <button
            type="button"
            class="fixed inset-0 z-10 bg-slate-900/30"
            aria-label="关闭"
            onClick={() => {
              openKey.value = null;
            }}
          />
          <div class="absolute left-0 right-0 z-20 max-h-64 overflow-auto border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
            {items
              .find((i) => i.key === openKey.value)
              ?.options.map((opt) => {
                const selected = valueOf(openKey.value!) === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    disabled={opt.disabled}
                    class={twMerge(
                      "w-full text-left px-4 py-2.5 text-sm disabled:opacity-40",
                      selected
                        ? "text-blue-600 bg-blue-50/80 dark:bg-blue-950/30"
                        : "text-slate-700 dark:text-slate-200",
                    )}
                    onClick={() => {
                      const key = openKey.value!;
                      local.value = { ...local.value, [key]: opt.value };
                      onChange?.(key, opt.value);
                      openKey.value = null;
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
