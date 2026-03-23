/**
 * Icon 图标容器/占位。用于包裹 SVG 或图标字体，统一尺寸与颜色。
 * Tailwind v4 + light/dark。
 *
 * 内置图标：见 ./icons/，按名称单独导出（如 IconClose、IconSearch），
 * 按需引入以控制包体积；每个图标文件独立，无大包依赖。
 */
import type { SizeVariant } from "../../shared/types.ts";
import { twMerge } from "tailwind-merge";

export interface IconProps {
  size?: SizeVariant;
  /** 额外 class */
  class?: string;
  /** 子节点（SVG 或 span 等） */
  children?: unknown;
}

/** 内置图标组件使用的 props（仅 size/class，无 children） */
export type IconComponentProps = Pick<IconProps, "size" | "class">;

const sizeClasses: Record<SizeVariant, string> = {
  xs: "w-4 h-4",
  sm: "w-5 h-5",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

const base =
  "inline-flex shrink-0 items-center justify-center text-current text-gray-700 dark:text-gray-300";

export function Icon(props: IconProps) {
  const { size = "md", class: className, children } = props;
  return (
    <span
      class={twMerge(base, sizeClasses[size], className)}
      role="img"
      aria-hidden
    >
      {children}
    </span>
  );
}
