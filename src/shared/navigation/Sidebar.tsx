/**
 * Sidebar 侧栏折叠菜单（View）。
 * 用于文档/后台：顶部可选「概览」链接、分组标题、可折叠的一级分类与二级链接；手风琴展开、基于当前路径的 active 高亮。
 */

import { createSignal } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { Link } from "../basic/Link.tsx";
import { IconChevronDown, IconChevronRight } from "../basic/icons/mod.ts";

/** 二级子项：path、label、desc（展示为 "label — desc"） */
export interface SidebarSubItem {
  path: string;
  label: string;
  desc: string;
}

/** 一级项：无 children 为单链接，有 children 为可折叠分组 */
export interface SidebarItem {
  path: string;
  label: string;
  children?: ReadonlyArray<SidebarSubItem>;
}

export interface SidebarProps {
  /** 顶部概览链接（如「组件概览」-> /desktop） */
  overview?: { path: string; label: string };
  /** 分组标题（如「组件」），不跳转 */
  sectionTitle?: string;
  /** 菜单项：有 children 的为折叠分组，无则为单链接 */
  items: ReadonlyArray<SidebarItem>;
  /** 获取当前路径用于 active 高亮，默认读 location.pathname 并去掉末尾斜杠 */
  getCurrentPath?: () => string;
  /** 根节点（aside）额外 class */
  class?: string;
  className?: string;
}

const defaultGetCurrentPath = (): string => {
  const loc = typeof globalThis.location !== "undefined"
    ? globalThis.location
    : null;
  const p = loc?.pathname ?? "/";
  return p.replace(/\/$/, "") || "/";
};

const linkBase =
  "block rounded-md py-2 pl-3 pr-3 text-sm transition-colors whitespace-nowrap ";
const linkNormal = linkBase +
  "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 ";
const linkActive = linkBase +
  "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-medium ";
const overviewBase =
  "block rounded-md py-2 pl-3 pr-3 text-sm font-medium transition-colors ";
const overviewNormal = overviewBase +
  "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-100 ";
const overviewActive = overviewBase +
  "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 ";
const categoryBtnNormal =
  "flex w-full items-center gap-1 rounded-md py-1.5 pl-3 pr-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors";
const categoryBtnActive =
  "flex w-full items-center gap-1 rounded-md py-1.5 pl-3 pr-3 text-left text-sm font-medium bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300";

export function Sidebar(props: SidebarProps) {
  const {
    overview,
    sectionTitle,
    items,
    getCurrentPath = defaultGetCurrentPath,
    class: classProp,
    className: classNameProp,
  } = props;

  const pathNorm = getCurrentPath();
  const norm = (p: string) => p.replace(/\/$/, "") || p;

  const isActiveExact = (path: string) => pathNorm === norm(path);
  const isCategoryActive = (path: string) => {
    const base = norm(path);
    return pathNorm === base || pathNorm.startsWith(base + "/");
  };

  /** 用户点击展开的分类（手风琴） */
  const [getOpenKeys, setOpenKeys] = createSignal<Set<string>>(new Set());
  /** 用户手动收起的分类（当前路径在该分类下时仍会先展开，除非被收起） */
  const [getCollapsedKeys, setCollapsedKeys] = createSignal<Set<string>>(
    new Set(),
  );

  /** 分类是否展开：当前路径在该分类下 或 用户点击展开，且未被用户收起 */
  const isExpanded = (path: string) =>
    (getOpenKeys().has(path) || isCategoryActive(path)) &&
    !getCollapsedKeys().has(path);

  const toggleOpen = (path: string) => {
    if (isExpanded(path)) {
      setCollapsedKeys((prev) => new Set(prev).add(path));
    } else {
      setCollapsedKeys((prev) => {
        const next = new Set(prev);
        next.delete(path);
        return next;
      });
      setOpenKeys(new Set([path]));
    }
  };

  const asideClass = twMerge(
    "w-72 shrink-0 border-r border-slate-100 dark:border-slate-700 py-8 pl-6 pr-4",
    classProp ?? classNameProp,
  );

  return () => (
    <aside class={asideClass}>
      <nav className="space-y-3" aria-label="侧栏导航">
        {overview != null && (
          <div className="mb-4">
            <Link
              href={overview.path}
              class={pathNorm === norm(overview.path)
                ? overviewActive
                : overviewNormal}
            >
              {overview.label}
            </Link>
          </div>
        )}
        {sectionTitle != null && (
          <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {sectionTitle}
          </p>
        )}
        <ul className="list-none space-y-1 p-0 m-0 pl-3" role="list">
          {items.map((item) => (
            <li key={item.path}>
              {item.children != null && item.children.length > 0
                ? (
                  <>
                    <button
                      type="button"
                      className={isCategoryActive(item.path)
                        ? categoryBtnActive
                        : categoryBtnNormal}
                      onClick={() => toggleOpen(item.path)}
                      aria-expanded={isExpanded(item.path)}
                      aria-controls={`sidebar-group-${
                        item.path.replace(/\//g, "-")
                      }`}
                    >
                      <span
                        className="shrink-0 w-4 h-4 flex items-center justify-center text-slate-500 dark:text-slate-400"
                        aria-hidden
                      >
                        {isExpanded(item.path)
                          ? <IconChevronDown class="w-4 h-4" />
                          : <IconChevronRight class="w-4 h-4" />}
                      </span>
                      {item.label}
                    </button>
                    {() =>
                      isExpanded(item.path) && item.children && (
                        <ul
                          id={`sidebar-group-${item.path.replace(/\//g, "-")}`}
                          className="list-none space-y-0.5 p-0 m-0 pl-6"
                          role="list"
                        >
                          {item.children.map((sub) => (
                            <li key={sub.path}>
                              <Link
                                href={sub.path}
                                class={isActiveExact(sub.path)
                                  ? linkActive
                                  : linkNormal}
                              >
                                {sub.label} — {sub.desc}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                  </>
                )
                : (
                  <Link
                    href={item.path}
                    class={isActiveExact(item.path) ? linkActive : linkNormal}
                  >
                    {item.label}
                  </Link>
                )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
