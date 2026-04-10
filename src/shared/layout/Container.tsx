/**
 * Container 最大宽度容器（View）。
 * 响应式 max-width，内容居中；支持 sm/md/lg/xl/2xl 等预设宽度。
 */

import { twMerge } from "tailwind-merge";
import type { JSXRenderable } from "@dreamer/view";

export type ContainerSize = "sm" | "md" | "lg" | "xl" | "2xl" | "full";

export interface ContainerProps {
  /** 最大宽度预设：sm(640) / md(768) / lg(1024) / xl(1280) / 2xl(1536) / full(无限制)，默认 "xl" */
  maxWidth?: ContainerSize;
  /** 是否水平居中，默认 true */
  centered?: boolean;
  /** 内边距：是否使用默认 padding（px-4 sm:px-6 lg:px-8），默认 true */
  padded?: boolean;
  /** 额外 class */
  class?: string;
  /** 子节点 */
  children?: unknown;
}

const maxWidthClasses: Record<ContainerSize, string> = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
  full: "max-w-full",
};

export function Container(props: ContainerProps): JSXRenderable {
  const {
    maxWidth = "xl",
    centered = true,
    padded = true,
    class: className,
    children,
  } = props;

  return (
    <div
      class={twMerge(
        "w-full",
        maxWidthClasses[maxWidth],
        centered && "mx-auto",
        padded && "px-4 sm:px-6 lg:px-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
