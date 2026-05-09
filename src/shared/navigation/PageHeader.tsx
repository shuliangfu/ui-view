/**
 * PageHeader 页头（View）。
 * 标题、副标题、返回、面包屑、extra、footer。
 */

import { twMerge } from "tailwind-merge";
import type { JSXRenderable } from "@dreamer/view";
/** 按需：单文件图标，避免经 icons/mod 拉入全表 */
import { IconArrowLeft } from "../basic/icons/ArrowLeft.tsx";
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
  /** 多语言/自定义文案；未传字段走 {@link defaultPageHeaderMessages} */
  messages?: Partial<PageHeaderMessages>;
}

/** PageHeader 内置文案 */
export interface PageHeaderMessages {
  /** 面包屑 `nav` `aria-label` */
  breadcrumbAriaLabel: string;
  /** 返回按钮 `aria-label` */
  back: string;
}

/** 默认中文文案 */
export const defaultPageHeaderMessages: PageHeaderMessages = {
  breadcrumbAriaLabel: "面包屑",
  back: "返回",
};

export function PageHeader(props: PageHeaderProps): JSXRenderable {
  const {
    title,
    subTitle,
    onBack,
    breadcrumb,
    extra,
    footer,
    class: className,
  } = props;
  /** 合并默认中文文案与外部传入 messages */
  const m: PageHeaderMessages = {
    ...defaultPageHeaderMessages,
    ...(props.messages ?? {}),
  };

  return (
    <header
      class={twMerge(
        "border-b border-slate-200 dark:border-slate-600 pb-4",
        className,
      )}
    >
      {breadcrumb?.items != null && breadcrumb.items.length > 0 && (
        <nav
          class="mb-2 text-sm text-slate-500 dark:text-slate-400"
          aria-label={m.breadcrumbAriaLabel}
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
              aria-label={m.back}
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
