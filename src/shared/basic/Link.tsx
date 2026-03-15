/**
 * Link 链接组件（View 细粒度渲染）。
 * 基于 <a>，Tailwind v4 + light/dark 主题。
 */

import { twMerge } from "tailwind-merge";

export interface LinkProps {
  href: string;
  /** 额外 class（View 下用 class，React 风格 JSX 下用 className） */
  class?: string;
  className?: string;
  /** 是否新窗口打开 */
  target?: "_blank" | "_self" | "_parent" | "_top";
  rel?: string;
  /** 悬停提示（对应原生 title） */
  title?: string;
  /** 无障碍标签（对应原生 aria-label） */
  "aria-label"?: string;
  onClick?: (e: Event) => void;
  children?: unknown;
}

const baseClasses =
  "text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded";

export function Link(props: LinkProps) {
  const {
    href,
    class: classProp,
    className: classNameProp,
    target,
    rel = target === "_blank" ? "noopener noreferrer" : undefined,
    title,
    "aria-label": ariaLabel,
    onClick,
    children,
  } = props;

  const className = classProp ?? classNameProp;
  return () => (
    <a
      href={href}
      class={twMerge(baseClasses, className)}
      target={target}
      rel={rel}
      title={title}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {children}
    </a>
  );
}
