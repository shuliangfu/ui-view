/**
 * DropdownMenu 下拉菜单（移动）（View）。
 * 顶栏多列筛选／菜单：点击标题展开选项面板（非桌面 Hover Dropdown）。
 *
 * 遮罩：在 {@link ../MobilePortalHostScope.tsx} 内 Portal 到机内宿主并用 `absolute` 盖宿主；
 * 无 Scope 时用 `fixed` 盖视口（产品默认）。
 *
 * 注意：组件 setup 经 jsx 的 `untrack` 执行，交互状态须用子树 thunk / Effect 订阅 Signal，
 * 勿依赖「整段 `return () =>`」作为唯一订阅点（在部分插入路径下易丢观察者）。
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
    openKey.set(null);
  };

  /**
   * 有 Scope：遮罩 Portal 到机内宿主，`absolute inset-0` 盖示意框。
   */
  createRenderEffect(() => {
    const key = openKey.value;
    if (key == null) return;
    if (getScopedHost == null) return;
    const host = getScopedHost();
    if (host == null) return;
    const root = createPortal(
      () => (
        <button
          type="button"
          class="absolute inset-0 z-10 bg-slate-900/30 pointer-events-auto"
          aria-label="关闭"
          data-dreamer-dropdown-mask="scoped"
          onClick={close}
        />
      ),
      host,
    );
    onCleanup(() => {
      root.unmount();
    });
  });

  return (
    <div
      class={twMerge("dropdown-menu relative z-20", className)}
      data-open={() => (openKey.value != null ? "true" : "false")}
      data-open-key={() => openKey.value ?? ""}
      style={() =>
        openKey.value != null && getScopedHost != null
          ? { zIndex: "130" }
          : undefined
      }
    >
      <div class="relative z-20 flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        {() =>
          items.map((it) => {
            const active = openKey.value === it.key;
            return (
              <button
                type="button"
                key={it.key}
                data-menu-key={it.key}
                class={twMerge(
                  "flex-1 py-2.5 text-sm",
                  active
                    ? "text-blue-600 font-medium"
                    : "text-slate-700 dark:text-slate-200",
                )}
                onClick={() => {
                  /** 必须在点击时读 Signal：勿闭包渲染期 active（委托/__onclick 路径下易踩到过期闭包） */
                  const cur = openKey.value;
                  openKey.set(cur === it.key ? null : it.key);
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
      {() => {
        const key = openKey.value;
        if (key == null) return null;
        const scoped = getScopedHost != null;
        return (
          <>
            {!scoped && (
              <button
                type="button"
                class="fixed inset-0 z-10 bg-slate-900/30"
                aria-label="关闭"
                data-dreamer-dropdown-mask="fixed"
                onClick={close}
              />
            )}
            <div class="absolute left-0 right-0 z-20 max-h-64 overflow-auto border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
              {items
                .find((i) => i.key === key)
                ?.options.map((opt) => {
                  const selected = valueOf(key) === opt.value;
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
                        local.set({ ...local.value, [key]: opt.value });
                        onChange?.(key, opt.value);
                        openKey.set(null);
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
            </div>
          </>
        );
      }}
    </div>
  );
}
