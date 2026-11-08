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

export interface SkeletonProps {
  size?: SizeVariant;
  /** 自定义宽高（如 "w-full h-4"） */
  class?: string;
  /** 多语言／自定义文案；未传字段走 {@link defaultSkeletonMessages} */
  messages?: Partial<SkeletonMessages>;
}

const sizeClasses: Record<SizeVariant, string> = {
  xs: "h-4",
  sm: "h-5",
  md: "h-6",
  lg: "h-8",
};

const base = "animate-pulse motion-reduce:animate-none rounded-md bg-gray-200 dark:bg-gray-700";

export function Skeleton(props: SkeletonProps): JSXRenderable {
  const { size = "md", class: className } = props;
  const m: SkeletonMessages = {
    ...defaultSkeletonMessages,
    ...(props.messages ?? {}),
  };
  return (
    <span
      class={twMerge(base, sizeClasses[size], className)}
      role="status"
      aria-label={m.loading}
    />
  );
}
