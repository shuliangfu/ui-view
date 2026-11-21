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
  /**
   * 当前展开的 key 列表（受控）。
   * 在细粒度更新场景请传 getter（如 `() => sig.value`），避免只传 `sig.value` 快照导致拿不到最新展开态。
   */
  expandedKeys?: string[] | (() => string[]);
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

/** 同一页多个实例时，header/content 的 id 必须互不重复（不可只用 item.key）。 */
let accordionInstanceSeq = 0;

export function Accordion(props: AccordionProps): JSXRenderable {
  const {
    items,
    defaultExpandedKeys = [],
    onChange,
    allowMultiple = true,
    class: className,
    itemClass,
    headerClass,
    contentClass,
  } = props;
  const instanceId = ++accordionInstanceSeq;

  /**
   * 初次内部 state：与首次 `props.expandedKeys` / `defaultExpandedKeys` 对齐（勿把受控 key 解构到闭包变量里）。
   */
  const initialKeys = (() => {
    const ck = props.expandedKeys;
    if (ck === undefined) return defaultExpandedKeys ?? [];
    if (typeof ck === "function") return (ck as () => string[])();
    return ck;
  })();
  const internalKeysRef = createSignal<string[]>(initialKeys);

  /**
   * 当前展开 key 列表：非受控读内部 ref；受控时**每次**从 `props.expandedKeys`（或 getter）读取。
   * 若在 setup 里解构 `expandedKeys`，返回的渲染 getter 重跑时仍会得到初值，受控表现为点不开。
   */
  const getExpandedKeys = (): string[] => {
    const ck = props.expandedKeys;
    if (ck === undefined) return internalKeysRef.value;
    if (typeof ck === "function") return (ck as () => string[])();
    return ck;
  };

  const toggle = (key: string) => {
    const current = getExpandedKeys();
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
   * 外层直接返回容器 div，仅在**子节点**上用 `{() => ...}` 读 `getExpandedKeys()`。
   * 若整段 `return () => { ... }` 作为组件返回值，会与挂载本组件的 `insert` 的 effect
   * 处于同一层同步展平链中：该 effect 会订阅 `internalKeysRef`，重跑时再次执行
   * `Accordion(props)`，`createSignal` 被重复创建，展开态永远回到初值（表现为点不开）。
   */
  return (
    <div
      class={twMerge(
        "w-full divide-y divide-slate-200 dark:divide-slate-600 border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden",
        className,
      )}
    >
      {() => {
        const expandedSet = new Set(getExpandedKeys());
        return items.map((item) => {
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
                aria-controls={`accordion-content-${instanceId}-${item.key}`}
                id={`accordion-header-${instanceId}-${item.key}`}
                onClick={() => !item.disabled && toggle(item.key)}
              >
                <span>{item.header}</span>
                <span
                  class={twMerge(
                    "shrink-0 w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform duration-200 motion-reduce:transition-none",
                    isExpanded && "rotate-180",
                  )}
                >
                  <IconChevronDown class="w-full h-full" />
                </span>
              </button>
              <div
                id={`accordion-content-${instanceId}-${item.key}`}
                role="region"
                aria-labelledby={`accordion-header-${instanceId}-${item.key}`}
                class={twMerge(
                  "grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
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
        });
      }}
    </div>
  );
}
