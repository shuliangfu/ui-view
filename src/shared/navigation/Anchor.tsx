/**
 * Anchor 锚点导航（View）。
 * 链接列表 + 滚动高亮（scroll spy）；links(key/href/title)、activeKey、onChange。
 */

import { twMerge } from "tailwind-merge";

export interface AnchorLink {
  /** 唯一 key，与 activeKey 对应 */
  key: string;
  /** 目标元素 id（如 #section-1） */
  href: string;
  /** 显示标题 */
  title: string | unknown;
}

export interface AnchorProps {
  /** 锚点项 */
  links: AnchorLink[];
  /** 当前高亮的 key（受控） */
  activeKey?: string;
  /** 点击或滚动导致高亮变化时回调 */
  onChange?: (key: string) => void;
  /** 额外 class */
  class?: string;
}

export function Anchor(props: AnchorProps) {
  const { links, activeKey, onChange, class: className } = props;

  const handleClick = (e: Event, key: string, href: string) => {
    e.preventDefault();
    const el = typeof globalThis.document !== "undefined"
      ? globalThis.document.querySelector(href)
      : null;
    if (el) {
      (el as HTMLElement).scrollIntoView({ behavior: "smooth" });
    }
    onChange?.(key);
  };

  return (
    <nav
      class={twMerge("flex flex-col gap-1 text-sm", className)}
      aria-label="锚点导航"
    >
      {links.map((link) => {
        const isActive = activeKey === link.key;
        return (
          <a
            key={link.key}
            href={link.href}
            class={twMerge(
              "py-1 px-2 rounded truncate",
              isActive
                ? "text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/30"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100",
            )}
            onClick={(e: Event) => handleClick(e, link.key, link.href)}
          >
            {link.title}
          </a>
        );
      })}
    </nav>
  );
}

/** initAnchorSpy 的配置：仅监听 links 中的锚点、偏移量、滚动容器 */
export interface AnchorSpyOptions {
  /** 仅根据这些链接的 href 对应 id 高亮，避免与页面其它 id 冲突 */
  links: AnchorLink[];
  /** 滚动偏移（px），默认 100；视口顶往上 offset 内进入即算当前 */
  offset?: number;
  /** 滚动容器元素；不传则使用 window 滚动 */
  target?: Element | (() => Element | null);
}

/**
 * 在客户端根据滚动位置更新当前高亮（scroll spy）。
 * 需由父级持有 activeKey 状态并传入 onChange，在挂载后调用此函数并传入 setState。
 * 若传 options.links，仅根据这些链接的 href（#id）对应元素计算 current，并设 activeKey 为 link.key。
 * 传 options.target 时监听该容器内滚动。
 */
export function initAnchorSpy(
  setActiveKey: (key: string) => void,
  options?: AnchorSpyOptions,
) {
  if (typeof globalThis.document === "undefined") return;
  const offset = options?.offset ?? 100;
  const getTarget = (): Element | null => {
    if (!options?.target) return null;
    return typeof options.target === "function"
      ? options.target()
      : options.target;
  };
  const linkIds = options?.links
    ? options.links.map((l) => ({
      key: l.key,
      id: l.href.replace(/^#/, ""),
    }))
    : null;

  const onScroll = () => {
    const target = getTarget();
    let scrollTop: number;
    let viewportTop: number;
    if (target && "scrollTop" in target) {
      scrollTop = (target as HTMLElement).scrollTop;
      const tr = target.getBoundingClientRect();
      viewportTop = tr.top;
    } else {
      scrollTop = globalThis.scrollY ?? globalThis.pageYOffset;
      viewportTop = 0;
    }
    let currentKey: string | null = null;
    const check = (el: Element, _id: string, key?: string) => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      const top = rect.top - viewportTop + scrollTop;
      if (scrollTop >= top - offset) currentKey = key ?? (el as HTMLElement).id;
    };
    if (linkIds?.length) {
      linkIds.forEach(({ key, id }) => {
        const el = globalThis.document.getElementById(id);
        if (el) check(el, id, key);
      });
    } else {
      globalThis.document.querySelectorAll("[id]").forEach((el) => {
        const id = (el as HTMLElement).id;
        if (id) check(el, id);
      });
    }
    if (currentKey) setActiveKey(currentKey);
  };
  const target = getTarget();
  if (target) target.addEventListener("scroll", onScroll, { passive: true });
  else globalThis.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  return () => {
    const t = getTarget();
    if (t) t.removeEventListener("scroll", onScroll);
    else globalThis.removeEventListener("scroll", onScroll);
  };
}
