/**
 * IndexBar 索引导航（View）。
 * 右侧字母／索引条 + 分组锚点；点击滚动，列表滚动时反标当前索引。
 */

import {
  createEffect,
  createSignal,
  type JSXRenderable,
  onCleanup,
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
  /** 点击索引／滚动联动时回调 */
  onSelect?: (index: string) => void;
}

export function IndexBar(props: IndexBarProps): JSXRenderable {
  const { items, class: className, sidebarClass, onSelect } = props;
  const active = createSignal(items[0]?.index ?? "");
  const panelRefs = new Map<string, HTMLElement>();
  let listEl: HTMLElement | null = null;
  /** 点击触发的程序化滚动期间，跳过 scroll spy 以免抢焦点 */
  let suppressSpyUntil = 0;

  const setListRef = (el: unknown) => {
    if (isHtmlElement(el)) listEl = el;
  };

  const setPanelRef = (index: string) => (el: unknown) => {
    if (isHtmlElement(el)) panelRefs.set(index, el);
    else panelRefs.delete(index);
  };

  const scrollTo = (index: string) => {
    active.value = index;
    onSelect?.(index);
    const el = panelRefs.get(index);
    const root = listEl;
    if (!el || !root) {
      el?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      return;
    }
    suppressSpyUntil = Date.now() + 450;
    const top = el.offsetTop - root.offsetTop;
    root.scrollTo?.({ top, behavior: "smooth" });
  };

  createEffect(() => {
    const root = listEl;
    if (!root) return;
    const onScroll = () => {
      if (Date.now() < suppressSpyUntil) return;
      const scrollTop = root.scrollTop;
      let current = items[0]?.index ?? "";
      for (const it of items) {
        const sec = panelRefs.get(it.index);
        if (!sec) continue;
        const top = sec.offsetTop - root.offsetTop;
        if (top - 8 <= scrollTop) current = it.index;
        else break;
      }
      if (current && current !== active.value) {
        active.value = current;
        onSelect?.(current);
      }
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    onCleanup(() => root.removeEventListener("scroll", onScroll));
  });

  return () => (
    <div class={twMerge("index-bar relative flex min-h-0 flex-1", className)}>
      <div
        ref={setListRef}
        class="min-w-0 flex-1 overflow-auto"
        data-ui-index-bar-list=""
      >
        {items.map((it) => (
          <section
            key={it.index}
            ref={setPanelRef(it.index)}
            data-index={it.index}
          >
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
            aria-current={active.value === it.index ? "true" : undefined}
            onClick={() => scrollTo(it.index)}
          >
            {it.index}
          </button>
        ))}
      </div>
    </div>
  );
}
