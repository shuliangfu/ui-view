/**
 * Accordion 手风琴折叠（View）。
 * 常见于 FAQ、设置；支持受控/非受控、单开/多开；非受控时用 **`Signal`**（`createSignal`）维护 expandedKeys。
 * 内部维护 fallback state，保证点击展开/收起在受控/非受控下均生效。
 *
 * 内容区用 `grid` + `0fr`/`1fr` 过渡，单开切换时新旧面板开合节奏一致，避免 `max-h` 大值收起偏慢。
 */

import { createSignal } from "@dreamer/view";
import type { JSXRenderable } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
/** 按需：单文件图标，避免经 icons/mod 拉入全表 */
import { IconChevronDown } from "../basic/icons/ChevronDown.tsx";

export interface AccordionItem {
  /** 唯一 key */
  key: string;
  /** 标题（可点击展开/收起） */
  header: string | unknown;
  /** 是否禁用 */
  disabled?: boolean;
  /** 展开时显示的内容 */
  children: unknown;
}

export interface AccordionProps {
  /** 手风琴项列表 */
  items: AccordionItem[];
  /** 当前展开的 key 列表（受控）；不传则使用 defaultExpandedKeys */
  expandedKeys?: string[];
  /** 默认展开的 key 列表（非受控） */
  defaultExpandedKeys?: string[];
  /** 展开/收起变化回调（受控时由父级更新 expandedKeys） */
  onChange?: (expandedKeys: string[]) => void;
  /** 是否允许多项同时展开，默认 true */
  allowMultiple?: boolean;
  /** 额外 class（作用于外层） */
  class?: string;
  /** 单项容器 class */
  itemClass?: string;
  /** 标题区 class */
  headerClass?: string;
  /** 内容区 class */
  contentClass?: string;
}

export function Accordion(props: AccordionProps): JSXRenderable {
  const {
    items,
    expandedKeys: controlledKeys,
    defaultExpandedKeys = [],
    onChange,
    allowMultiple = true,
    class: className,
    itemClass,
    headerClass,
    contentClass,
  } = props;

  const initialKeys = controlledKeys ?? defaultExpandedKeys ?? [];
  const internalKeysRef = createSignal<string[]>(initialKeys);
  /** 用普通对象存「上次同步的受控 keys」，不参与响应式，避免读 `Signal` 触发重跑导致卡死/点不动 */
  const lastSyncedRef: { value: string } = { value: "" };
  const c = controlledKeys !== undefined ? controlledKeys : null;
  if (c != null) {
    const cStr = JSON.stringify(c.slice().sort());
    if (cStr !== lastSyncedRef.value) {
      lastSyncedRef.value = cStr;
      internalKeysRef.value = [...c];
    }
  }
  /** 展示用内部 state，点击即更新；受控时仅当 prop 变化才从上面同步到 internal */
  const getExpandedKeys = (): string[] => internalKeysRef.value;

  const toggle = (key: string) => {
    const current = internalKeysRef.value;
    const next = new Set(current);
    if (next.has(key)) {
      next.delete(key);
    } else {
      if (!allowMultiple) next.clear();
      next.add(key);
    }
    const nextArr = Array.from(next);
    internalKeysRef.value = nextArr;
    onChange?.(nextArr);
  };

  /**
   * 渲染 getter：读 `internalKeysRef.value`，展开/收起后触发细粒度更新。
   */
  return () => {
    const expandedSet = new Set(getExpandedKeys());
    return (
      <div
        class={twMerge(
          "w-full divide-y divide-slate-200 dark:divide-slate-600 border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden",
          className,
        )}
      >
        {items.map((item) => {
          const isExpanded = expandedSet.has(item.key);
          return (
            <div
              key={item.key}
              class={twMerge("bg-white dark:bg-slate-800", itemClass)}
            >
              <button
                type="button"
                class={twMerge(
                  "w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
                  headerClass,
                )}
                disabled={item.disabled}
                aria-expanded={isExpanded}
                aria-controls={`accordion-content-${item.key}`}
                id={`accordion-header-${item.key}`}
                onClick={() => !item.disabled && toggle(item.key)}
              >
                <span>{item.header}</span>
                <span
                  class={twMerge(
                    "shrink-0 w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform duration-200",
                    isExpanded && "rotate-180",
                  )}
                >
                  <IconChevronDown class="w-full h-full" />
                </span>
              </button>
              <div
                id={`accordion-content-${item.key}`}
                role="region"
                aria-labelledby={`accordion-header-${item.key}`}
                class={twMerge(
                  "grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out",
                  isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
              >
                <div class="min-h-0 overflow-hidden">
                  <div
                    class={twMerge(
                      "px-4 py-3 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700",
                      contentClass,
                    )}
                  >
                    {item.children}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };
}
