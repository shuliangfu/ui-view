/**
 * Skeleton 骨架屏。加载占位。Tailwind v4 + light/dark。
 */
import type { SizeVariant } from "../../shared/types.ts";
import type { JSXRenderable } from "@dreamer/view";
import { twMerge } from "tailwind-merge";

export interface SkeletonMessages {
  /** role=status 的 aria-label */
  loading: string;
}

export const defaultSkeletonMessages: SkeletonMessages = {
  loading: "Loading",
};

export type SkeletonVariant =
  | "text"
  | "title"
  | "avatar"
  | "button"
  | "image"
  | "paragraph";

export interface SkeletonProps {
  size?: SizeVariant;
  /** 自定义宽高（如 "w-full h-4"） */
  class?: string;
  /** 多语言／自定义文案；未传字段走 {@link defaultSkeletonMessages} */
  messages?: Partial<SkeletonMessages>;
  /**
   * 占位形态：默认按 `size` 渲染一条圆角条；
   * `paragraph` 为多行文本占位。
   */
  variant?: SkeletonVariant;
}

const sizeClasses: Record<SizeVariant, string> = {
  xs: "h-4",
  sm: "h-5",
  md: "h-6",
  lg: "h-8",
};

const base =
  "block animate-pulse motion-reduce:animate-none rounded-md bg-gray-200 dark:bg-gray-700";

const variantClasses: Record<Exclude<SkeletonVariant, "paragraph">, string> = {
  text: "h-4 w-full",
  title: "h-6 w-1/2",
  avatar: "h-10 w-10 rounded-full",
  button: "h-8 w-20 rounded-md",
  image: "aspect-video w-full rounded-md",
};

export function Skeleton(props: SkeletonProps): JSXRenderable {
  const { size = "md", class: className, variant } = props;
  const m: SkeletonMessages = {
    ...defaultSkeletonMessages,
    ...(props.messages ?? {}),
  };
  if (variant === "paragraph") {
    return (
      <span
        class={twMerge("flex w-full flex-col gap-2", className)}
        role="status"
        aria-label={m.loading}
      >
        <span class={twMerge(base, "h-4 w-full")} />
        <span class={twMerge(base, "h-4 w-full")} />
        <span class={twMerge(base, "h-4 w-2/3")} />
      </span>
    );
  }
  return (
    <span
      class={twMerge(
        base,
        variant ? variantClasses[variant] : sizeClasses[size],
        className,
      )}
      role="status"
      aria-label={m.loading}
    />
  );
}
