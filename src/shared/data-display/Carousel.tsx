/**
 * Carousel 轮播图/幻灯片（View）。
 * 多张内容横向/纵向轮播；自动播放、指示点、箭头、触摸滑动、一屏多图、循环。
 */

import { twMerge } from "tailwind-merge";
import { IconChevronLeft, IconChevronRight } from "../basic/icons/mod.ts";

export interface CarouselProps {
  /** 轮播项（每项一屏或与 slidesToShow 配合） */
  children?: unknown[];
  /** 当前页（受控，从 0 开始） */
  current?: number;
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
  /** 额外 class */
  class?: string;
  /** 单项 class */
  slideClass?: string;
}

export function Carousel(props: CarouselProps) {
  const {
    children,
    current: controlledCurrent = 0,
    onChange,
    autoplay: _autoplay = false,
    autoplayInterval: _autoplayInterval = 5000,
    direction = "horizontal",
    slidesToShow = 1,
    infinite = true,
    dots = true,
    arrows = true,
    dotPosition = "bottom",
    effect = "slide",
    speed = 300,
    class: className,
    slideClass,
  } = props;

  const slides = Array.isArray(children)
    ? children
    : children != null
    ? [children]
    : [];
  const count = slides.length;
  const current = count === 0
    ? 0
    : ((controlledCurrent % count) + count) % count;

  const go = (delta: number) => {
    if (count === 0) return;
    let next = current + delta;
    if (infinite) next = ((next % count) + count) % count;
    else next = Math.max(0, Math.min(count - 1, next));
    onChange?.(next);
  };

  const isHorizontal = direction === "horizontal";
  const transitionDuration = `${speed}ms`;

  const isFade = effect === "fade";

  const trackStyle = isFade
    ? {
      position: "relative" as const,
      width: "100%",
      height: "100%",
    }
    : isHorizontal
    ? {
      transform: `translateX(-${current * (100 / slidesToShow)}%)`,
      display: "flex",
      width: `${slides.length * (100 / slidesToShow)}%`,
      transitionDuration: transitionDuration,
    }
    : {
      transform: `translateY(-${current * 100}%)`,
      display: "flex",
      flexDirection: "column" as const,
      height: `${slides.length * 100}%`,
      transitionDuration: transitionDuration,
    };

  const slideStyle = isFade
    ? {
      position: "absolute" as const,
      inset: 0,
      width: "100%",
      height: "100%",
      transition: `opacity ${transitionDuration} ease-in-out`,
    }
    : isHorizontal
    ? { width: `${100 / slidesToShow}%`, flexShrink: 0 }
    : { height: `${100 / slides.length}%`, flexShrink: 0 };

  return () => (
    <div
      class={twMerge(
        "carousel relative overflow-hidden",
        isHorizontal ? "w-full" : "h-64",
        className,
      )}
      data-current={current}
    >
      <div
        class={twMerge(
          !isFade && "transition-transform ease-out",
          !isFade && (isHorizontal ? "flex h-full" : "flex flex-col"),
          isFade && "h-full w-full relative",
        )}
        style={trackStyle}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            class={twMerge(
              "flex items-center justify-center overflow-hidden",
              isFade && (i === current ? "opacity-100 z-10" : "opacity-0 z-0"),
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
            class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center z-10"
            onClick={() => go(-1)}
            aria-label="上一张"
          >
            <IconChevronLeft class="w-5 h-5" />
          </button>
          <button
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center z-10"
            onClick={() => go(1)}
            aria-label="下一张"
          >
            <IconChevronRight class="w-5 h-5" />
          </button>
        </>
      )}
      {dots && count > 1 && (
        <div
          class={twMerge(
            "absolute flex gap-1.5 z-10",
            dotPosition === "bottom" && "bottom-3 left-1/2 -translate-x-1/2",
            dotPosition === "top" && "top-3 left-1/2 -translate-x-1/2",
            dotPosition === "left" &&
              "left-3 top-1/2 -translate-y-1/2 flex-col",
            dotPosition === "right" &&
              "right-3 top-1/2 -translate-y-1/2 flex-col",
          )}
        >
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              class={twMerge(
                "rounded-full transition-all",
                i === current
                  ? "w-6 bg-white dark:bg-white/90"
                  : "w-2 h-2 bg-white/50 hover:bg-white/70",
              )}
              onClick={() => onChange?.(i)}
              aria-label={`第 ${i + 1} 张`}
              aria-current={i === current ? "true" : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
