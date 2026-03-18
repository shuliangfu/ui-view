/**
 * Tabs 标签页（View）。
 * 桌面横排，支持受控/非受控、line/card 样式；需配合 createSignal 做 activeKey 状态。
 * 内部维护 fallback state，保证点击切换在受控/非受控下均生效。
 */

import { createSignal } from "@dreamer/view";
import { twMerge } from "tailwind-merge";

export type TabsType = "line" | "card";

export interface TabItem {
  /** 唯一 key */
  key: string;
  /** 标签文案或节点 */
  label: string | unknown;
  /** 是否禁用 */
  disabled?: boolean;
  /** 对应面板内容 */
  children: unknown;
}

export interface TabsProps {
  /** 标签项列表 */
  items: TabItem[];
  /** 当前激活 key（受控） */
  activeKey?: string;
  /** 切换回调（受控时由父级更新 activeKey） */
  onChange?: (key: string) => void;
  /** 样式类型：线条 或 卡片，默认 "line" */
  type?: TabsType;
  /** 是否占满宽度（标签均分），默认 false */
  fullWidth?: boolean;
  /** 额外 class（作用于外层） */
  class?: string;
  /** 标签栏 class */
  tabListClass?: string;
  /** 面板容器 class */
  panelClass?: string;
}

export function Tabs(props: TabsProps) {
  const {
    items,
    activeKey: controlledKey,
    onChange,
    type = "line",
    fullWidth = false,
    class: className,
    tabListClass,
    panelClass,
  } = props;

  const initialKey = controlledKey ?? items[0]?.key ?? "";
  const [internalKey, setInternalKey] = createSignal(initialKey);
  /** 用普通对象存「上次同步的受控 key」，不参与响应式，避免读 signal 触发重跑导致卡死 */
  const lastSyncedRef: { value: string | undefined } = { value: undefined };
  const c = controlledKey !== undefined && controlledKey !== ""
    ? controlledKey
    : undefined;
  if (c != null && c !== lastSyncedRef.value) {
    lastSyncedRef.value = c;
    setInternalKey(c);
  }
  /** 展示用内部 state，点击即更新；受控时仅当 prop 变化才从上面同步到 internal */
  const getActiveKey = () => internalKey();

  const lineCls = "border-b border-slate-200 dark:border-slate-600 flex gap-1";
  const cardCls = "flex gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800";

  const tabBtnBase =
    "px-4 py-2 text-sm font-medium transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed";
  const tabBtnLine = "border-b-2 -mb-px " +
    (type === "line"
      ? "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 data-[active]:border-blue-600 data-[active]:text-blue-600 dark:data-[active]:border-blue-400 dark:data-[active]:text-blue-400"
      : "");
  const tabBtnCard = type === "card"
    ? "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 data-[active]:bg-white data-[active]:text-slate-900 data-[active]:shadow dark:data-[active]:bg-slate-700 dark:data-[active]:text-slate-100"
    : "";

  const handleTabClick = (key: string) => {
    const item = items.find((i) => i.key === key);
    if (item?.disabled) return;
    setInternalKey(key);
    onChange?.(key);
  };

  return () => {
    const activeKey = getActiveKey();
    return (
      <div class={twMerge("w-full", className)}>
        <div
          role="tablist"
          class={twMerge(
            type === "line" ? lineCls : cardCls,
            fullWidth && "w-full",
            tabListClass,
          )}
        >
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={activeKey === item.key}
              aria-controls={`tabpanel-${item.key}`}
              id={`tab-${item.key}`}
              disabled={item.disabled}
              data-tab-key={item.key}
              data-active={activeKey === item.key ? "" : undefined}
              class={twMerge(
                tabBtnBase,
                type === "line" ? tabBtnLine : tabBtnCard,
                fullWidth && "flex-1",
              )}
              onClick={() => handleTabClick(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div
          role="tabpanel"
          id={`tabpanel-${activeKey}`}
          aria-labelledby={`tab-${activeKey}`}
          class={twMerge("mt-4", panelClass)}
        >
          {items.find((i) => i.key === activeKey)?.children}
        </div>
      </div>
    );
  };
}
