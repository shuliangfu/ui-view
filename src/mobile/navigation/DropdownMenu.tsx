/**
 * DropdownMenu 下拉菜单（移动）（View）。
 * 顶栏多列筛选／菜单：点击标题展开选项面板（非桌面 Hover Dropdown）。
 *
 * 遮罩：在 {@link ../MobilePortalHostScope.tsx} 内 Portal 到机内宿主并用 `absolute` 盖宿主；
 * 无 Scope 时用 `fixed` 盖视口（产品默认）。
 */

import {
  createPortal,
  createRenderEffect,
  createSignal,
  onCleanup,
  useContext,
  type JSXRenderable,
} from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { MobilePortalHostContext } from "../MobilePortalHostScope.tsx";

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

  /** 机内 Portal：Context 为 `{ getHost }`，勿当成 HTMLElement */
  const portalHostScope = useContext(MobilePortalHostContext);
  const getScopedHost = portalHostScope?.getHost;

  const valueOf = (key: string, fallback?: string) =>
    props.value?.[key] ?? local.value[key] ?? fallback ??
      items.find((i) => i.key === key)?.options[0]?.value ?? "";

  const labelOf = (item: DropdownMenuItem) => {
    const v = valueOf(item.key);
    return item.options.find((o) => o.value === v)?.label ?? item.title;
  };

  const close = () => {
    openKey.value = null;
  };

  /**
   * 有 Scope：遮罩 Portal 到机内宿主，`absolute inset-0` 盖示意框；
   * 无 Scope：不走 Portal，下方内联 `fixed` 盖视口。
   */
  createRenderEffect(() => {
    if (openKey.value == null) return;
    if (getScopedHost == null) return;
    const host = getScopedHost();
    if (host == null) return;
    const root = createPortal(
      () => (
        <button
          type="button"
          class="absolute inset-0 z-10 bg-slate-900/30 pointer-events-auto"
          aria-label="关闭"
          onClick={close}
        />
      ),
      host,
    );
    onCleanup(() => {
      root.unmount();
    });
  });

  return () => {
    const open = openKey.value != null;
    const scoped = getScopedHost != null;
    return (
      <div
        class={twMerge(
          "dropdown-menu relative",
          // 机内打开时抬到宿主 z-120 之上，保证顶栏／选项面板不被遮罩盖住
          open && scoped ? "z-[130]" : "z-20",
          className,
        )}
        style={open && scoped ? { zIndex: "130" } : undefined}
      >
        <div class="relative z-20 flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          {items.map((it) => {
            const active = openKey.value === it.key;
            return (
              <button
                type="button"
                key={it.key}
                class={twMerge(
                  "flex-1 py-2.5 text-sm",
                  active
                    ? "text-blue-600 font-medium"
                    : "text-slate-700 dark:text-slate-200",
                )}
                onClick={() => {
                  openKey.value = active ? null : it.key;
                }}
              >
                {labelOf(it)}
                <span class="ml-1 text-[10px] opacity-60">
                  {active ? "▲" : "▼"}
                </span>
              </button>
            );
          })}
        </div>
        {open && (
          <>
            {!scoped && (
              <button
                type="button"
                class="fixed inset-0 z-10 bg-slate-900/30"
                aria-label="关闭"
                onClick={close}
              />
            )}
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
  };
}
