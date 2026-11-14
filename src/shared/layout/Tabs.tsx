/**
 * Tabs 标签页（View）。
 * 桌面横排，支持受控/非受控、line/card 样式；非受控时用 **`Signal`**（`createSignal` + `.value`）维护 activeKey。
 * `line`：激活项为「文件夹」式——左/上/右边框、无底边，底沿与标签栏分隔线对齐并盖住线；`card`：浅槽内卡片式。
 * 内部维护 fallback state，保证点击切换在受控/非受控下均生效。
 */

import { createEffect, createMemo, createSignal } from "@dreamer/view";
import type { JSXRenderable } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { isHtmlElement } from "../dom-guards.ts";
import {
  type ControlledStringInput,
  readControlledStringInput,
} from "../feedback/controlled-open.ts";

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
  /**
   * 当前激活 key（受控）。可传字符串、零参 getter 或 `Signal<string>`。
   * 请把 getter／Signal 传进来，不要在外层用 `{() => <Tabs activeKey={sig.value} />}` 整棵重挂，
   * 否则横向滚动的标签栏会被重建、滚动位置回到最左。
   */
  activeKey?: ControlledStringInput;
  /** 切换回调（受控时由父级更新 activeKey） */
  onChange?: (key: string) => void;
  /** 样式类型：`line` 为文件夹式贴线标签，`card` 为槽内卡片，默认 `line` */
  type?: TabsType;
  /** 是否占满宽度（标签均分），默认 false */
  fullWidth?: boolean;
  /** 额外 class（作用于外层） */
  class?: string;
  /** 标签栏 class */
  tabListClass?: string;
  /** 面板容器 class */
  panelClass?: string;
  /** Extra class for the active tab button (merged after the built-in styles). */
  activeClass?: string;
  /** Rendered between the tab list and the panel (for example a toolbar). */
  extra?: unknown;
  /** Extra class merged onto every tab button. */
  tabClass?: string;
  /** If true, only the tab list is rendered (panel is owned by the parent). */
  hidePanel?: boolean;
}

/**
 * 把激活标签滚进标签栏可视区，只改 tablist 的 `scrollLeft`，不带动页面或弹层竖向滚动。
 *
 * @param tablist - 带横向滚动的标签栏
 * @param activeKey - 当前激活项的 `data-tab-key`
 */
export function scrollTabListToActive(
  tablist: HTMLElement,
  activeKey: string,
): void {
  let tab: HTMLElement | null = null;
  const nodes = tablist.querySelectorAll("[data-tab-key]");
  for (let i = 0; i < nodes.length; i++) {
    const el = nodes[i];
    if (isHtmlElement(el) && el.getAttribute("data-tab-key") === activeKey) {
      tab = el;
      break;
    }
  }
  if (tab == null) return;
  tablist.scrollLeft += tabListScrollDelta(
    tablist.getBoundingClientRect(),
    tab.getBoundingClientRect(),
  );
}

/**
 * 为把激活标签完全露出，tablist 的 `scrollLeft` 需要增减的量；已完全可见则为 0。
 */
export function tabListScrollDelta(
  list: Pick<DOMRect, "left" | "right">,
  tab: Pick<DOMRect, "left" | "right">,
): number {
  if (tab.left < list.left) return tab.left - list.left;
  if (tab.right > list.right) return tab.right - list.right;
  return 0;
}

export function Tabs(props: TabsProps): JSXRenderable {
  const {
    onChange,
    type = "line",
    fullWidth = false,
    class: className,
    tabListClass,
    panelClass,
    activeClass,
    extra,
    tabClass,
    hidePanel,
  } = props;

  const initialKey = readControlledStringInput(props.activeKey) ??
    props.items[0]?.key ?? "";
  const internalKeyRef = createSignal(initialKey);

  /**
   * 受控时从 `props.activeKey`（字符串／getter／Signal）读取，非受控读内部 Signal。
   * 放在 memo 里，按钮的 `class`／`data-active` 用函数订阅，切换时只改属性、不重建 DOM。
   */
  const activeKeyResolved = createMemo(() => {
    const ck = readControlledStringInput(props.activeKey);
    if (ck !== undefined && ck !== "") return ck;
    return internalKeyRef.value;
  });
  const getActiveKey = (): string => activeKeyResolved();

  let tabListEl: HTMLElement | null = null;

  const scheduleScrollActiveIntoView = () => {
    const key = getActiveKey();
    const run = () => {
      if (tabListEl == null) return;
      scrollTabListToActive(tabListEl, key);
    };
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(run);
    } else {
      run();
    }
  };

  const setTabListRef = (el: unknown) => {
    tabListEl = isHtmlElement(el) ? el : null;
    if (tabListEl != null) scheduleScrollActiveIntoView();
  };

  /** 激活项变化或标签栏挂载后，把当前项滚进可视区（不重建标签栏） */
  createEffect(() => {
    activeKeyResolved();
    scheduleScrollActiveIntoView();
  });

  /**
   * `line` 标签栏：`items-end` 底对齐；`border-b` 为分隔线；`bg-inherit` 与根容器同色，激活项再 inherit 以盖住线下那一段。
   */
  const lineCls =
    "relative z-0 flex flex-wrap items-end gap-1 border-b border-slate-200 bg-inherit dark:border-slate-600";
  const cardCls = "flex gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800";

  /**
   * 使用 `focus-visible` 而非 `focus:ring`，避免鼠标点击后焦点留在按钮上时一直显示粗蓝环（看起来像「激活边框」）；键盘 Tab 聚焦时仍显示环。
   */
  const tabBtnBase =
    "relative px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors motion-reduce:transition-none rounded-md focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed";
  /**
   * `line`：未激活透明边框占位；激活/悬停均为左/上/右边框、`border-b-0`，`-mb-px` 与父级底边重叠。
   * 悬停/激活用 `bg-inherit` 与根容器同色且**不透明**；暗色下勿用带透明度后缀的 hover 背景（如 slate-800/50），否则父级 `border-b` 会透出成底横线。
   * `hover:z-10`：叠在分隔线上方，减轻叠层顺序导致的线段残留。
   */
  const tabBtnLine =
    "-mb-px rounded-t-md rounded-b-none border border-transparent text-slate-600 dark:text-slate-400 " +
    "hover:z-10 hover:border-slate-200 hover:border-b-0 hover:bg-inherit hover:text-slate-900 dark:hover:border-slate-600 dark:hover:bg-inherit dark:hover:text-slate-100 " +
    "data-[active]:z-10 data-[active]:border-slate-300 data-[active]:border-b-0 data-[active]:bg-inherit data-[active]:text-blue-600 dark:data-[active]:border-slate-600 dark:data-[active]:text-blue-400";
  const tabBtnCard = type === "card"
    ? "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 data-[active]:bg-white data-[active]:text-slate-900 data-[active]:shadow dark:data-[active]:bg-slate-700 dark:data-[active]:text-slate-100"
    : "";

  const handleTabClick = (key: string) => {
    const item = props.items.find((i) => i.key === key);
    if (item?.disabled) return;
    internalKeyRef.value = key;
    onChange?.(key);
    scheduleScrollActiveIntoView();
  };

  /**
   * 外层与 tablist 保持稳定节点，只在按钮和面板上用 getter 读激活项。
   * 若整段 `return () => { ... }`，切换时标签栏 DOM 会被重建，横向滚动会回到最左。
   */
  return (
    <div
      class={twMerge(
        hidePanel && !fullWidth
          ? "inline-flex w-fit max-w-full shrink-0"
          : "w-full",
        /**
         * `line` 时给根容器默认与常见主内容区一致的底色，激活标签 `bg-inherit` 后与下方面板视觉上同色；嵌入卡片时请传 `class` 覆盖（如 `bg-white`）。
         */
        type === "line" && !hidePanel && "bg-slate-50 dark:bg-slate-950",
        className,
      )}
    >
      <div
        ref={setTabListRef}
        role="tablist"
        class={twMerge(
          type === "line" ? lineCls : cardCls,
          fullWidth && "w-full",
          tabListClass,
        )}
      >
        {props.items.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={() => activeKeyResolved() === item.key}
            aria-controls={`tabpanel-${item.key}`}
            id={`tab-${item.key}`}
            disabled={item.disabled}
            data-tab-key={item.key}
            data-active={() =>
              activeKeyResolved() === item.key ? "" : undefined}
            class={() =>
              twMerge(
                tabBtnBase,
                type === "line" ? tabBtnLine : tabBtnCard,
                fullWidth && "flex-1",
                tabClass,
                activeKeyResolved() === item.key ? activeClass : undefined,
              )}
            onClick={() => handleTabClick(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {!hidePanel && extra}
      {!hidePanel && (
        () => {
          const activeKey = getActiveKey();
          return (
            <div
              role="tabpanel"
              id={`tabpanel-${activeKey}`}
              aria-labelledby={`tab-${activeKey}`}
              class={twMerge("mt-4", panelClass)}
            >
              {props.items.find((i) => i.key === activeKey)?.children}
            </div>
          );
        }
      )}
    </div>
  );
}
