/**
 * IndexBar 索引导航（View）。
 * 右侧字母／索引条 + 分组锚点滚动（移动通讯录风格）。
 */

import {
  createSignal,
  type JSXRenderable,
} from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { isHtmlElement } from "../../shared/dom-guards.ts";

export interface IndexBarItem {
  /** 索引键（如 A、#） */
  index: string;
  /** 分组标题，默认等于 index */
  title?: unknown;
  children?: unknown;
}

export interface IndexBarProps {
  items: IndexBarItem[];
  class?: string;
  /** 索引条 class */
  sidebarClass?: string;
  /** 点击索引回调 */
  onSelect?: (index: string) => void;
}

export function IndexBar(props: IndexBarProps): JSXRenderable {
  const { items, class: className, sidebarClass, onSelect } = props;
  const active = createSignal(items[0]?.index ?? "");
  const panelRefs = new Map<string, HTMLElement>();

  const setPanelRef = (index: string) => (el: unknown) => {
    if (isHtmlElement(el)) panelRefs.set(index, el);
  };

  const scrollTo = (index: string) => {
    active.value = index;
    onSelect?.(index);
    const el = panelRefs.get(index);
    el?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  };

  return (
    <div class={twMerge("index-bar relative flex min-h-0 flex-1", className)}>
      <div class="min-w-0 flex-1 overflow-auto">
        {items.map((it) => (
          <section key={it.index} ref={setPanelRef(it.index)} data-index={it.index}>
            <div class="sticky top-0 z-10 bg-slate-100/95 dark:bg-slate-800/95 px-3 py-1 text-xs font-semibold text-slate-500">
              {it.title ?? it.index}
            </div>
            <div>{it.children}</div>
          </section>
        ))}
      </div>
      <div
        class={twMerge(
          "absolute right-1 top-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 py-2 px-1 rounded-full",
          "bg-slate-100/80 dark:bg-slate-800/80 text-[10px] leading-none select-none",
          sidebarClass,
        )}
        role="navigation"
        aria-label="索引"
      >
        {items.map((it) => (
          <button
            type="button"
            key={it.index}
            class={twMerge(
              "size-4 flex items-center justify-center rounded-full",
              active.value === it.index && "bg-blue-600 text-white",
            )}
            onClick={() => scrollTo(it.index)}
          >
            {it.index}
          </button>
        ))}
      </div>
    </div>
  );
}
