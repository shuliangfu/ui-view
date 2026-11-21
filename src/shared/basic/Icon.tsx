/**
 * Icon 图标容器/占位。用于包裹 SVG 或图标字体，统一尺寸与颜色。
 * Tailwind v4 + light/dark。
 *
 * 内置图标：见 ./icons/，按名称单独导出（如 IconClose、IconSearch），
 * 按需引入以控制包体积；每个图标文件独立，无大包依赖。
 */
import type { SizeVariant } from "../../shared/types.ts";
import type { JSXRenderable } from "@dreamer/view";
import { twMerge } from "tailwind-merge";

export interface IconProps {
  size?: SizeVariant;
  /** 额外 class（View / compileSource 惯用） */
  class?: string;
  /**
   * 与 `class` 等价；自动 JSX（如 `jsxImportSource: "@dreamer/view"`）下部分工具链更常生成 `className`。
   */
  className?: string;
  /**
   * 可访问名称。传入时图标视为有意义内容（去掉 `aria-hidden`，并设置 `aria-label`）。
   * 未传则保持装饰性（`aria-hidden`）。
   */
  "aria-label"?: string;
  /**
   * 显式覆盖默认装饰性 `aria-hidden`。包裹有意义的 `<img>` 时应传 `false`，
   * 否则祖先隐藏会使读屏找不到内部图片。
   */
  "aria-hidden"?: boolean;
  /**
   * 覆盖默认 `role="img"`。包住真实 `<img>` 时请传 `"none"`，避免出现两个 img 角色。
   */
  role?: string;
  /** 子节点（SVG 或 span 等） */
  children?: unknown;
}

/** 内置图标组件使用的 props（无 children） */
export type IconComponentProps = Pick<
  IconProps,
  "size" | "class" | "className" | "aria-label"
>;

const sizeClasses: Record<SizeVariant, string> = {
  xs: "w-4 h-4",
  sm: "w-5 h-5",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

const base = "inline-flex shrink-0 items-center justify-center text-current";

/**
 * 图标外层容器：统一 `size` 对应的 Tailwind 宽高类、文本色与 flex 居中，并合并 `class` / `className`。
 *
 * @param props - `size` 默认 `md`；`children` 一般为内联 SVG 或文字图标
 * @returns 带 `role="img"` 的 `span` 包装节点（{@link JSXRenderable}）
 */
export function Icon(props: IconProps): JSXRenderable {
  const {
    size = "md",
    class: classProp,
    className,
    children,
    "aria-label": ariaLabel,
    "aria-hidden": ariaHiddenProp,
    role: roleProp,
  } = props;
  /** class 优先于 className，与业务里混写两种属性时行为确定 */
  const extraClass = classProp ?? className;
  const meaningful = ariaLabel != null && ariaLabel !== "";
  const hidden = ariaHiddenProp !== undefined ? ariaHiddenProp : !meaningful;
  return (
    <span
      class={twMerge(base, sizeClasses[size], extraClass)}
      role={roleProp ?? "img"}
      {...(hidden
        ? { "aria-hidden": true as const }
        : meaningful
        ? { "aria-label": ariaLabel }
        : {})}
    >
      {children}
    </span>
  );
}
