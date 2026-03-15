/**
 * PageHeader 页头（View）。
 * 标题、副标题、返回、面包屑、extra、footer。
 */

import { twMerge } from "tailwind-merge";
import { IconArrowLeft } from "../basic/icons/mod.ts";
import type { BreadcrumbItem } from "./breadcrumb-types.ts";

export interface PageHeaderProps {
  /** 主标题 */
  title: string | unknown;
  /** 副标题（可选） */
  subTitle?: string | unknown;
  /** 返回按钮回调；不传则不显示返回 */
  onBack?: () => void;
  /** 面包屑项（可选） */
  breadcrumb?: { items: BreadcrumbItem[] };
  /** 右侧额外区域（可选） */
  extra?: unknown;
  /** 底部区域（可选） */
  footer?: unknown;
  /** 额外 class */
  class?: string;
}

export function PageHeader(props: PageHeaderProps) {
  const {
    title,
    subTitle,
    onBack,
    breadcrumb,
    extra,
    footer,
    class: className,
  } = props;

  return () => (
    <header
      class={twMerge(
        "border-b border-slate-200 dark:border-slate-600 pb-4",
        className,
      )}
    >
      {breadcrumb?.items != null && breadcrumb.items.length > 0 && (
        <nav
          class="mb-2 text-sm text-slate-500 dark:text-slate-400"
          aria-label="面包屑"
        >
          {breadcrumb.items.map((item, i) => (
            <span key={i}>
              {item.href != null
                ? (
                  <a
                    href={item.href}
                    class="hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    {item.label}
                  </a>
                )
                : <span>{item.label}</span>}
              {i < breadcrumb.items.length - 1 && (
                <span class="mx-1.5" aria-hidden>/</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-3 min-w-0">
          {onBack != null && (
            <button
              type="button"
              class="p-1 -ml-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
              onClick={onBack}
              aria-label="返回"
            >
              <IconArrowLeft class="w-5 h-5" />
            </button>
          )}
          <div class="min-w-0">
            <h1 class="text-xl font-semibold text-slate-900 dark:text-white truncate">
              {title}
            </h1>
            {subTitle != null && (
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {subTitle}
              </p>
            )}
          </div>
        </div>
        {extra != null && <div class="shrink-0">{extra}</div>}
      </div>
      {footer != null && <div class="mt-4">{footer}</div>}
    </header>
  );
}
