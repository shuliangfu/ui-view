/**
 * Hero 英雄区/首屏（View）。
 * 落地页主视觉：标题、副标题、描述、CTA 按钮、可选背景图；支持居中/左文右图/右文左图。
 */

import { twMerge } from "tailwind-merge";

export type HeroLayout = "center" | "left" | "right";

export interface HeroProps {
  /** 主标题 */
  title: string | unknown;
  /** 副标题（可选） */
  subtitle?: string | unknown;
  /** 描述文案（可选） */
  description?: string | unknown;
  /** 主操作区（CTA 按钮等），渲染在描述下方 */
  extra?: unknown;
  /** 右侧或左侧插画/背景（left 时为左侧，right 时为右侧，center 时不参与布局） */
  media?: unknown;
  /** 布局：居中 / 左文右图 / 右文左图，默认 "center" */
  layout?: HeroLayout;
  /** 是否全屏高（min-h-screen），默认 false */
  fullScreen?: boolean;
  /** 背景图 URL 或背景节点（可选） */
  background?: string | unknown;
  /** 额外 class（作用于最外层） */
  class?: string;
  /** 内容区 class */
  contentClass?: string;
  /** 子节点（可选，渲染在 extra 下方） */
  children?: unknown;
}

export function Hero(props: HeroProps) {
  const {
    title,
    subtitle,
    description,
    extra,
    media,
    layout = "center",
    fullScreen = false,
    background,
    class: className,
    contentClass,
    children,
  } = props;

  const isCenter = layout === "center";
  const isLeft = layout === "left";
  const isRight = layout === "right";

  const bgStyle = typeof background === "string"
    ? {
      backgroundImage: `url(${background})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    }
    : undefined;

  return () => (
    <section
      class={twMerge(
        "relative flex w-full overflow-hidden",
        fullScreen && "min-h-screen",
        className,
      )}
      style={bgStyle}
    >
      {typeof background !== "string" && background != null && (
        <div class="absolute inset-0 z-0">{background}</div>
      )}
      <div
        class={twMerge(
          "relative z-10 flex w-full",
          isCenter &&
            "flex-col items-center justify-center text-center py-16 px-4",
          isLeft && "flex-row items-center gap-12 py-16 px-4 md:px-8",
          isRight && "flex-row-reverse items-center gap-12 py-16 px-4 md:px-8",
        )}
      >
        <div
          class={twMerge(
            "flex flex-col gap-4",
            isCenter && "max-w-2xl",
            (isLeft || isRight) && "flex-1 max-w-xl",
            contentClass,
          )}
        >
          <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {title}
          </h1>
          {subtitle != null && (
            <p class="text-xl md:text-2xl text-slate-600 dark:text-slate-300 font-medium">
              {subtitle}
            </p>
          )}
          {description != null && (
            <p class="text-base text-slate-600 dark:text-slate-400 max-w-xl">
              {description}
            </p>
          )}
          {extra != null && <div class="flex flex-wrap gap-3 pt-2">{extra}
          </div>}
          {children != null && <div class="mt-4">{children}</div>}
        </div>
        {media != null && (isLeft || isRight) && (
          <div class="flex-1 flex items-center justify-center shrink-0 max-w-md">
            {media}
          </div>
        )}
      </div>
    </section>
  );
}
