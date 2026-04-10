/**
 * Collapse 折叠面板（View）。
 * 与 Accordion 语义接近；支持手风琴/多开、边框、无边框、尺寸、禁用项。
 * 内部维护 fallback state，保证点击展开/收起在受控/非受控下均生效。
 */

import { createSignal } from "@dreamer/view";
import type { JSXRenderable } from "@dreamer/view";
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
  /**
   * 当前展开的 key 列表（受控）。
   * 在细粒度更新场景请传 getter（如 `() => sig.value`），避免只传 `sig.value` 快照导致子树拿不到最新展开态。
   */
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

/**
 * 标题与内容区共用：须与默认 md 拉开梯度，否则 sm 仅少 1 档 padding 时与 md 几乎无差别。
 */
const sizeClasses: Record<SizeVariant, string> = {
  xs: "px-2 py-1 text-xs leading-snug",
  sm: "px-2.5 py-1.5 text-xs leading-snug",
  md: "px-4 py-3 text-sm",
  lg: "px-4 py-3.5 text-base",
};

/** 右侧展开图标尺寸，与标题字号比例协调 */
const expandIconSizeClasses: Record<SizeVariant, string> = {
  xs: "w-3 h-3",
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

export function Collapse(props: CollapseProps): JSXRenderable {
  const {
    items,
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

  /**
   * 初次内部 state：与首次 `props.activeKey` / `defaultActiveKey` 对齐（勿把受控 key 解构到闭包变量里）。
   */
  const initialKeys = (() => {
    const ck = props.activeKey;
    if (ck === undefined) return defaultActiveKey ?? [];
    if (typeof ck === "function") return (ck as () => string[])();
    return ck;
  })();
  const internalKeysRef = createSignal<string[]>(initialKeys);

  /**
   * 当前展开 key 列表：非受控读内部 ref；受控时**每次**从 `props.activeKey`（或 getter）读取。
   * 若在 setup 里解构 `activeKey`，返回的渲染 getter 重跑时仍会得到初值，受控表现为点不开（与 Menu 读 `props.openKeys` 同理）。
   */
  const getActiveKeys = (): string[] => {
    const ck = props.activeKey;
    if (ck === undefined) return internalKeysRef.value;
    if (typeof ck === "function") return (ck as () => string[])();
    return ck;
  };

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
   * 外层直接返回容器 div，仅在**子节点**上用 `{() => ...}` 读 `getActiveKeys()`。
   * 若整段 `return () => { ... }` 作为组件返回值，会与挂载本组件的 `insert` 的 effect
   * 处于同一层同步展平链中：该 effect 会订阅 `internalKeysRef`，重跑时再次执行
   * `Collapse(props)`，`createSignal` 被重复创建，展开态永远回到初值（表现为点不开）。
   */
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
      {() => {
        const activeSet = new Set(getActiveKeys());
        return items.map((item) => {
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
                      "shrink-0 transition-transform flex items-center justify-center",
                      expandIconSizeClasses[size],
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
        });
      }}
    </div>
  );
}
