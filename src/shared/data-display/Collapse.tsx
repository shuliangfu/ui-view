/**
 * Collapse 折叠面板（View）。
 * 与 Accordion 语义接近；支持手风琴/多开、边框、无边框、尺寸、禁用项。
 */

import { twMerge } from "tailwind-merge";
import { IconChevronDown } from "../basic/icons/mod.ts";
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
  /** 当前展开的 key 列表（受控） */
  activeKey?: string[];
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

  const activeSet = new Set(controlledKeys ?? defaultActiveKey);

  const toggle = (key: string) => {
    if (accordion) {
      onChange?.(activeSet.has(key) ? [] : [key]);
    } else {
      const next = new Set(activeSet);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      onChange?.(Array.from(next));
    }
  };

  return () => (
    <div
      class={twMerge(
        "collapse",
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
                  {expandIcon != null ? expandIcon : <IconChevronDown class="w-full h-full" />}
                </span>
              )}
            </button>
            {isActive && (
              <div
                class={twMerge(
                  "overflow-hidden border-t border-slate-100 dark:border-slate-700",
                  sizeClasses[size],
                  contentClass,
                )}
              >
                {item.children}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
