/**
 * Carousel 轮播图/幻灯片（View）。
 * 多张内容横向/纵向轮播；自动播放、指示点、箭头、触摸滑动、一屏多图、循环。
 */

import { createEffect } from "@dreamer/view";
import { createSignal } from "@dreamer/view/signal";
import { twMerge } from "tailwind-merge";
/** 按需：单文件图标，避免经 icons/mod 拉入全表 */
import { IconChevronLeft } from "../basic/icons/ChevronLeft.tsx";
import { IconChevronRight } from "../basic/icons/ChevronRight.tsx";
import { Image } from "./Image.tsx";

export interface CarouselProps {
  /** 图片地址列表；传此项时轮播内部渲染 img，无需传 children */
  images?: string[];
  /** 轮播项（每项一屏或与 slidesToShow 配合）；不传 images 时使用此项 */
  children?: unknown[];
  /** 当前页（受控，从 0 开始）；可传 number 或 getter（推荐，便于在组件内订阅、减少父级重跑） */
  current?: number | (() => number);
  /** 切换回调 */
  onChange?: (index: number) => void;
  /** 是否自动播放 */
  autoplay?: boolean;
  /** 自动播放间隔（ms），默认 5000 */
  autoplayInterval?: number;
  /** 方向：horizontal | vertical */
  direction?: "horizontal" | "vertical";
  /** 一屏显示几张（默认 1） */
  slidesToShow?: number;
  /** 是否循环，默认 true */
  infinite?: boolean;
  /** 是否显示指示点 */
  dots?: boolean;
  /** 是否显示左右/上下箭头 */
  arrows?: boolean;
  /** 指示点位置 */
  dotPosition?: "bottom" | "top" | "left" | "right";
  /** 切换效果：slide 滑动（默认）、fade 淡入淡出 */
  effect?: "slide" | "fade";
  /** 切换动画时长（ms），默认 300 */
  speed?: number;
  /** 容器高度，如 "200px"、"16rem"、"50%"；不传时横向默认 h-48、纵向默认 h-64；也可通过 class 覆盖（如 class="h-64"） */
  height?: string;
  /**
   * 单项内图片等内容的显示方式（对直接子元素 img 生效）：
   * - cover: 铺满裁切，默认；
   * - contain: 完整显示不裁切，可能留白；
   * - fill: 自动宽高铺满显示，可能拉伸变形以填满区域。
   */
  contentFit?: "contain" | "cover" | "fill";
  /** 额外 class（宽度随容器，高度可用 class 或 height 覆盖） */
  class?: string;
  /** 单项 class */
  slideClass?: string;
  /**
   * 是否按需加载图片（仅当前及相邻 slide 加载大图，其余用占位以降低内存）。
   * 默认 false，保证所有 slide 均能正常显示；设为 true 可省内存但依赖 patch 替换占位，部分环境下第 2/3 张可能不显示。
   */
  lazySlides?: boolean;
}

export function Carousel(props: CarouselProps) {
  const {
    images: imagesProp,
    children,
    current: controlledCurrent = 0,
    onChange,
    autoplay = false,
    autoplayInterval = 5000,
    direction = "horizontal",
    slidesToShow = 1,
    infinite = true,
    dots = true,
    arrows = true,
    dotPosition = "bottom",
    effect = "slide",
    speed = 300,
    height: heightProp,
    contentFit = "cover",
    class: className,
    slideClass,
    lazySlides = false,
  } = props;

  const useImages = Array.isArray(imagesProp) && imagesProp.length > 0;
  const slides = useImages
    ? []
    : Array.isArray(children)
    ? children
    : children != null
    ? [children]
    : [];
  const count = useImages ? imagesProp!.length : slides.length;
  /** 用 ref 保存最新 current，供定时器回调与 getter 内同步，避免闭包陈旧 */
  const currentRef = { current: 0 };
  /** 从 props 解析出当前页（仅当 current 为 number 时在外部算一次；为 getter 时在返回的 getter 内每次读取） */
  const resolveCurrent = (): number => {
    const raw = typeof controlledCurrent === "function"
      ? controlledCurrent()
      : (controlledCurrent ?? 0);
    return count === 0 ? 0 : ((raw % count) + count) % count;
  };
  const current = resolveCurrent();
  currentRef.current = current;

  const go = (delta: number) => {
    if (count === 0) return;
    const c = currentRef.current;
    let next = c + delta;
    if (infinite) next = ((next % count) + count) % count;
    else next = Math.max(0, Math.min(count - 1, next));
    onChange?.(next);
  };

  /**
   * 手动切换时 bump `.value`，让 autoplay 的 effect 重跑并清除旧定时器、重新计时，
   * 避免与 setInterval 叠加导致乱跳。
   */
  const resetAutoplayTokenRef = createSignal(0);
  const resetAutoplay = () => {
    resetAutoplayTokenRef.value = (t) => t + 1;
  };

  /** 自动播放：按 autoplayInterval 毫秒间隔切到下一张；手动点击箭头/圆点会重置计时器 */
  createEffect(() => {
    if (!autoplay || count <= 1) return;
    void resetAutoplayTokenRef.value;
    const id = setInterval(() => go(1), autoplayInterval);
    return () => clearInterval(id);
  });

  const isHorizontal = direction === "horizontal";
  const transitionDuration = `${speed}ms`;
  const isFade = effect === "fade";

  /** 单项内联样式（与 current 无关） */
  const slideStyle = isFade
    ? {
      position: "absolute" as const,
      inset: 0,
      width: "100%",
      height: "100%",
      transition: `opacity ${transitionDuration} ease-in-out`,
    }
    : isHorizontal
    ? {
      width: `${100 / count}%`,
      flexShrink: 0,
      minHeight: 0,
    }
    : {
      height: `${100 / count}%`,
      flexShrink: 0,
    };

  const containerStyle = heightProp ? { height: heightProp } : undefined;
  const defaultHeightClass = isHorizontal ? "h-48" : "h-64";
  const contentFitClass = contentFit === "contain"
    ? "[&>img]:object-contain [&>img]:w-full [&>img]:h-full"
    : contentFit === "cover"
    ? "[&>img]:object-cover [&>img]:w-full [&>img]:h-full"
    : "[&>img]:object-fill [&>img]:w-full [&>img]:h-full [&>img]:min-w-full [&>img]:min-h-full";

  /**
   * 根据当前页 cur 生成轨道样式与是否激活，供渲染用。
   * 当 current 为 getter 时，由返回的 getter 每次传入最新 cur，保证显示与状态一致。
   */
  const trackStyleFor = (cur: number) =>
    isFade
      ? {
        position: "relative" as const,
        width: "100%",
        height: "100%",
      }
      : isHorizontal
      ? {
        transform: `translateX(-${cur * (100 / slidesToShow)}%)`,
        display: "flex",
        width: `${count * (100 / slidesToShow)}%`,
        minHeight: "100%",
        transitionDuration: `${speed}ms`,
      }
      : {
        transform: `translateY(-${cur * 100}%)`,
        display: "flex",
        flexDirection: "column" as const,
        height: `${count * 100}%`,
        transitionDuration: `${speed}ms`,
      };

  const isSlideActiveFor = (cur: number, i: number) => {
    if (!lazySlides || !useImages) return true;
    if (i === cur) return true;
    if (!infinite || count <= 2) return false;
    const prev = (cur - 1 + count) % count;
    const next = (cur + 1) % count;
    return i === prev || i === next;
  };

  /** 用当前页 cur 渲染整棵 DOM 树，供「传 number」直接返回或「传 getter」时在 getter 内每次调用 */
  const renderBody = (cur: number) => (
    <div
      class={twMerge(
        "carousel relative overflow-hidden box-border shrink-0 w-full",
        !heightProp && defaultHeightClass,
        className,
      )}
      style={containerStyle}
      data-current={cur}
    >
      <div
        class={twMerge(
          !isFade && "transition-transform ease-out",
          !isFade &&
            (isHorizontal ? "flex h-full min-h-0" : "flex flex-col h-full"),
          isFade && "h-full w-full relative",
        )}
        style={trackStyleFor(cur)}
      >
        {useImages
          ? imagesProp!.map((src, i) => (
            <div
              key={src}
              class={twMerge(
                "relative overflow-hidden bg-slate-200 dark:bg-slate-700 flex",
                isHorizontal && !isFade && "h-full",
                isFade && (i === cur
                  ? "opacity-100 z-10"
                  : "opacity-0 z-0 pointer-events-none"),
                slideClass,
              )}
              style={slideStyle}
              role="img"
              aria-label=""
            >
              <div class="w-full h-full min-w-0 min-h-0 flex-1">
                {isSlideActiveFor(cur, i)
                  ? (
                    <Image
                      key={src}
                      src={src}
                      alt=""
                      fit={contentFit}
                      lazy={false}
                      class="block w-full h-full min-w-0 min-h-0"
                    />
                  )
                  : (
                    <div
                      class="block w-full h-full min-w-0 min-h-0 bg-slate-200 dark:bg-slate-700"
                      aria-hidden="true"
                    />
                  )}
              </div>
            </div>
          ))
          : slides.map((slide, i) => (
            <div
              key={i}
              class={twMerge(
                "flex items-center justify-center overflow-hidden",
                contentFitClass,
                isHorizontal && !isFade && "h-full",
                isFade && (i === cur
                  ? "opacity-100 z-10"
                  : "opacity-0 z-0 pointer-events-none"),
                slideClass,
              )}
              style={slideStyle}
            >
              {slide}
            </div>
          ))}
      </div>
      {arrows && count > 1 && (
        <>
          <button
            type="button"
            class="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center z-20 transition-colors shadow-md border border-white/20"
            onClick={() => {
              resetAutoplay();
              go(-1);
            }}
            aria-label="上一张"
          >
            <IconChevronLeft class="w-5 h-5" />
          </button>
          <button
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center z-20 transition-colors shadow-md border border-white/20"
            onClick={() => {
              resetAutoplay();
              go(1);
            }}
            aria-label="下一张"
          >
            <IconChevronRight class="w-5 h-5" />
          </button>
        </>
      )}
      {dots && count > 1 && (
        <div
          class={twMerge(
            "absolute flex gap-2 z-20 items-center",
            dotPosition === "bottom" && "bottom-4 left-1/2 -translate-x-1/2",
            dotPosition === "top" && "top-4 left-1/2 -translate-x-1/2",
            dotPosition === "left" &&
              "left-4 top-1/2 -translate-y-1/2 flex-col",
            dotPosition === "right" &&
              "right-4 top-1/2 -translate-y-1/2 flex-col",
          )}
        >
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              class={twMerge(
                "rounded-full transition-all duration-200 shrink-0",
                i === cur
                  ? "w-6 h-2 bg-white dark:bg-white/90 shadow"
                  : "w-2 h-2 bg-white/50 hover:bg-white/70 dark:bg-white/40 dark:hover:bg-white/60",
              )}
              onClick={() => {
                resetAutoplay();
                onChange?.(i);
              }}
              aria-label={`第 ${i + 1} 张`}
              aria-current={i === cur ? "true" : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );

  /** current 为 getter 时：返回的 getter 每次被 View 调用时重新读 current() 并渲染，这样 patch 才能拿到最新 data-current/transform，图片才能切换显示 */
  if (typeof controlledCurrent === "function") {
    return () => {
      const cur = resolveCurrent();
      currentRef.current = cur;
      return renderBody(cur);
    };
  }
  return renderBody(current);
}
