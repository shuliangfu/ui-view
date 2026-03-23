/**
 * Collapse 折叠面板（View）。
 * 与 Accordion 语义接近；支持手风琴/多开、边框、无边框、尺寸、禁用项。
 * 内部维护 fallback state，保证点击展开/收起在受控/非受控下均生效。
 */

import { createSignal } from "@dreamer/view/signal";
import { twMerge } from "tailwind-merge";
/** 按需：单文件图标，避免经 icons/mod 拉入全表 */
import { IconChevronDown } from "../basic/icons/ChevronDown.tsx";
import type { SizeVariant } from "../types.ts";

export interface CollapseItem {
  /** 唯一 key */
  key: string;
  /** 标题 */
  header: string | unknown;
  /** 是否禁用 */
  disabled?: boolean;
  /** 展开时显示的内容 */
  children: unknown;
  /** 是否强制展示（不参与折叠，始终显示） */
  showArrow?: boolean;
}

export interface CollapseProps {
  /** 折叠项列表 */
  items: CollapseItem[];
  /** 当前展开的 key 列表（受控）；可传 getter 如 activeKey={() => keys()} 以便在 View 中订阅更新 */
  activeKey?: string[] | (() => string[]);
  /** 默认展开的 key 列表（非受控） */
  defaultActiveKey?: string[];
  /** 展开/收起变化回调 */
  onChange?: (keys: string[]) => void;
  /** 是否手风琴模式（仅一项展开） */
  accordion?: boolean;
  /** 是否带边框 */
  bordered?: boolean;
  /** 是否幽灵模式（无边框、透明背景） */
  ghost?: boolean;
  /** 尺寸 */
  size?: SizeVariant;
  /** 是否显示箭头，默认 true */
  showArrow?: boolean;
  /** 自定义展开图标（替换默认 ChevronDown） */
  expandIcon?: unknown;
  /** 额外 class */
  class?: string;
  /** 单项 class */
  itemClass?: string;
  /** 标题 class */
  headerClass?: string;
  /** 内容 class */
  contentClass?: string;
}

const sizeClasses: Record<SizeVariant, string> = {
  xs: "px-2 py-1.5 text-xs",
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-3 text-sm",
  lg: "px-4 py-3.5 text-base",
};

export function Collapse(props: CollapseProps) {
  const {
    items,
    activeKey: controlledKeys,
    defaultActiveKey = [],
    onChange,
    accordion = false,
    bordered = true,
    ghost = false,
    size = "md",
    showArrow: showArrowProp = true,
    expandIcon,
    class: className,
    itemClass,
    headerClass,
    contentClass,
  } = props;

  const initialKeys = typeof controlledKeys === "function"
    ? (controlledKeys as () => string[])()
    : (controlledKeys ?? defaultActiveKey ?? []);
  const internalKeysRef = createSignal<string[]>(initialKeys);
  /** 受控时用 prop（或 getter 的返回值），否则用内部 SignalRef；读 `.value` / getter 会建立订阅 */
  const getActiveKeys = (): string[] =>
    controlledKeys === undefined
      ? internalKeysRef.value
      : typeof controlledKeys === "function"
      ? (controlledKeys as () => string[])()
      : controlledKeys;

  const toggle = (key: string) => {
    const current = getActiveKeys();
    const currentSet = new Set(current);
    let nextArr: string[];
    if (accordion) {
      nextArr = currentSet.has(key) ? [] : [key];
    } else {
      const next = new Set(currentSet);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      nextArr = Array.from(next);
    }
    internalKeysRef.value = nextArr;
    onChange?.(nextArr);
  };

  /**
   * 返回渲染 getter：在 View 的 effect 内读 getActiveKeys()，
   * 受控传 getter 时由此订阅，点击任意面板都会重跑、各面板同步更新。
   */
  return () => {
    const activeSet = new Set(getActiveKeys());
    return (
      <div
        class={twMerge(
          "collapse-panels",
          bordered && !ghost &&
            "border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden",
          !bordered && "space-y-1",
          ghost && "bg-transparent",
          className,
        )}
      >
        {items.map((item) => {
          const isActive = activeSet.has(item.key);
          const showArrow = item.showArrow ?? showArrowProp;
          const disabled = item.disabled ?? false;

          return (
            <div
              key={item.key}
              class={twMerge(
                bordered &&
                  "border-b border-slate-200 dark:border-slate-600 last:border-b-0",
                itemClass,
              )}
            >
              <button
                type="button"
                class={twMerge(
                  "w-full flex items-center justify-between gap-2 text-left font-medium text-slate-700 dark:text-slate-300",
                  sizeClasses[size],
                  "hover:bg-slate-50 dark:hover:bg-slate-700/50",
                  disabled && "opacity-60 cursor-not-allowed",
                  headerClass,
                )}
                disabled={disabled}
                onClick={() => !disabled && toggle(item.key)}
                aria-expanded={isActive}
              >
                <span class="min-w-0 truncate">{item.header}</span>
                {(showArrow && (expandIcon != null || true)) && (
                  <span
                    class={twMerge(
                      "shrink-0 w-4 h-4 transition-transform flex items-center justify-center",
                      isActive && "rotate-180",
                    )}
                  >
                    {expandIcon != null
                      ? expandIcon
                      : <IconChevronDown class="w-full h-full" />}
                  </span>
                )}
              </button>
              <div
                class={twMerge(
                  "overflow-hidden border-t border-slate-100 dark:border-slate-700",
                  !isActive && "hidden",
                  sizeClasses[size],
                  contentClass,
                )}
                aria-hidden={!isActive}
              >
                {item.children}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
}
