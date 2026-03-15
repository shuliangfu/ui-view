/**
 * Avatar 头像。支持图片 src 或子节点（首字、图标）。Tailwind v4 + light/dark。
 */
import type { SizeVariant } from "../../shared/types.ts";
import { twMerge } from "tailwind-merge";

export interface AvatarProps {
  size?: SizeVariant;
  /** 图片地址 */
  src?: string;
  /** 图片加载失败时的 alt */
  alt?: string;
  class?: string;
  /** 无 src 时显示内容（如首字） */
  children?: unknown;
}

const sizeClasses: Record<SizeVariant, string> = {
  xs: "w-8 h-8 text-xs",
  sm: "w-10 h-10 text-sm",
  md: "w-12 h-12 text-base",
  lg: "w-16 h-16 text-lg",
};

const base =
  "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300 font-medium";

export function Avatar(props: AvatarProps) {
  const { size = "md", src, alt = "", class: className, children } = props;
  const sizeCls = sizeClasses[size];

  if (src) {
    return () => (
      <img
        src={src}
        alt={alt}
        class={twMerge(base, sizeCls, "object-cover", className)}
      />
    );
  }

  return () => (
    <span class={twMerge(base, sizeCls, className)} role="img" aria-hidden>
      {children}
    </span>
  );
}
