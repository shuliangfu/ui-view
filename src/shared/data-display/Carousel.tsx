/**
 * Carousel 轮播图/幻灯片（View）。
 * 多张内容横向/纵向轮播；自动播放、指示点、箭头、一屏多图、循环（`slide` 为 CSS `transform` 轨道平移，非 overflow 手指滑动）。
 *
 * **SSR / 无 document：** 始终返回渲染 getter 会走 **函数子响应式插入**，运行时会依赖活动 document（与 {@link getDocument} 一致）；在仅标记 SSR、未挂影子 document 时会抛错。
 * 故在 {@link getDocument} 为 `null` 时改为同步返回单帧 VNode，并跳过依赖 DOM 的 autoplay 定时器。
 *
 * **受控与父级结构：** `current` 请传 `() => sig.value` 等 getter 即可；勿在父级本征节点下再包一层
 * `{() => <Carousel …/>}`，否则子列表含动态 getter 时 View 无法 canPatch，轮播根会被整块重挂，切换动画失效。
 *
 * **`effect="slide"`：** 轨道用 `transform: translateX/Y` + 行内 `transition` 平移；切页在 `requestAnimationFrame` 后再提交索引。不用 `scrollTo(smooth)`（易与 patch、snap 冲突，表现为闪切或邻页露边）。
 */

import { createEffect, createSignal, getDocument } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
/** 按需：单文件图标，避免经 icons/mod 拉入全表 */
import { IconChevronLeft } from "../basic/icons/ChevronLeft.tsx";
import { IconChevronRight } from "../basic/icons/ChevronRight.tsx";
import { Image } from "./Image.tsx";

/**
 * 轮播切换动画：`slide` 为轨道平移；`fade` / `zoom` / `flip` 为层叠单帧（`slidesToShow>1` 时仍建议用 slide）。
 */
export type CarouselTransitionEffect =
  | "slide"
  | "fade"
  | "zoom"
  | "flip";

/** 层叠位效果子集（与 {@link carouselIsStackedEffect} 一致） */
type CarouselStackedKind = "fade" | "zoom" | "flip";

/**
 * 层叠模式下每一页必须叠在同一矩形内；若仍为 `relative` 块级流式排列，多页会纵向堆高，
 * 在 `overflow:hidden` 的轨道里只能看到错误一截（空白、压住指示点、上下错位等）。
 */
const carouselStackedSlideLayoutStyle: Record<string, string | number> = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  boxSizing: "border-box",
};

/**
 * 是否为层叠切换（绝对定位叠放、不移动整条轨道）。
 *
 * @param e - {@link CarouselProps.effect} 解析后的值
 */
function carouselIsStackedEffect(
  e: CarouselTransitionEffect,
): e is CarouselStackedKind {
  return e === "fade" || e === "zoom" || e === "flip";
}

/**
 * 层叠布局下单张 slide **仅动画终态**（opacity / transform），供 {@link carouselStackedSlideStyle} 合并。
 *
 * @param kind - fade / zoom / flip
 * @param isActive - 是否为当前页
 */
function carouselStackedSlideAnimatedStyle(
  kind: CarouselStackedKind,
  isActive: boolean,
): Record<string, string | number> {
  if (kind === "fade") {
    return {
      opacity: isActive ? 1 : 0,
      transform: isActive ? "translateY(0)" : "translateY(1.25rem)",
    };
  }
  if (kind === "zoom") {
    return {
      opacity: isActive ? 1 : 0,
      transform: isActive ? "scale(1)" : "scale(0.72)",
    };
  }
  return {
    opacity: isActive ? 1 : 0,
    transform: isActive
      ? "rotateY(0deg) scale(1) translateZ(0)"
      : "rotateY(-92deg) scale(0.85) translateZ(-28px)",
  };
}

/**
 * 层叠模式下单张 slide 的**完整**行内样式：transition longhand + 动画终态。
 * **不依赖** Tailwind 是否生成 `transition-*` 任意类；文档站若未打进对应 CSS，原先会表现为完全瞬切。
 * 每帧 patch 时 duration/timing 与 speed 一致则一般不重置过渡；仅 opacity/transform 随当前页变。
 *
 * @param kind - fade / zoom / flip
 * @param isActive - 是否为当前页
 * @param speedMs - 与 {@link CarouselProps.speed} 一致
 */
function carouselStackedSlideStyle(
  kind: CarouselStackedKind,
  isActive: boolean,
  speedMs: number,
): Record<string, string | number> {
  const timing = kind === "fade"
    ? "ease-out"
    : kind === "zoom"
    ? "cubic-bezier(0.34, 1.2, 0.64, 1)"
    : "cubic-bezier(0.45, 0, 0.2, 1)";
  const anim = carouselStackedSlideAnimatedStyle(kind, isActive);
  const out: Record<string, string | number> = {
    transitionProperty: "opacity, transform",
    transitionDuration: `${speedMs}ms`,
    transitionTimingFunction: timing,
    willChange: "opacity, transform",
    ...anim,
  };
  if (kind === "flip") {
    out.transformOrigin = "center center";
    out.backfaceVisibility = "hidden";
  }
  return out;
}

export interface CarouselProps {
  /** 图片地址列表；传此项时轮播内部渲染 img，无需传 children */
  images?: string[];
  /** 轮播项（每项一屏或与 slidesToShow 配合）；不传 images 时使用此项 */
  children?: unknown[];
  /**
   * 当前页（从 0 开始）：可传 number、getter（推荐 `() => sig.value`，勿只传快照）；
   * 不传则由组件内部维护（无需再传 `onChange` 也可切换，传了则仍可通知外部）。
   */
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
  /** 切换效果：slide 轨道滑动；fade 淡入淡出；zoom 缩放+淡入淡出；flip 绕 Y 轴 3D 翻转 */
  effect?: CarouselTransitionEffect;
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

/**
 * 从 `props` 解析轮播数据来源与张数；在渲染 getter 内调用，避免 images/children 变更后仍用旧 count。
 */
function carouselSlidesInfo(p: CarouselProps): {
  useImages: boolean;
  images: string[] | undefined;
  slides: unknown[];
  count: number;
} {
  const useImages = Array.isArray(p.images) && p.images.length > 0;
  if (useImages) {
    return {
      useImages: true,
      images: p.images,
      slides: [],
      count: p.images!.length,
    };
  }
  const ch = p.children;
  const slides = Array.isArray(ch) ? ch : ch != null ? [ch] : [];
  return { useImages: false, images: undefined, slides, count: slides.length };
}

export function Carousel(props: CarouselProps) {
  /** 非受控（未传 `current`）时的内部当前页 */
  const internalIndexRef = createSignal(0);
  /** 与 `resolveCurrent` 同步，供定时器 tick 读取 */
  const currentRef = { current: 0 };
  /**
   * `setInterval` 内调用最新 `go`；若闭包捕获初次挂载的 `go`，受控下 `onChange` 已更新但 `currentRef` 不前进，会反复请求同一页。
   */
  const goRef: { current: (delta: number) => void } = { current: () => {} };

  /**
   * 手动切换时 bump `.value`，让 autoplay 的 effect 重跑并清除旧定时器、重新计时，
   * 避免与 setInterval 叠加导致乱跳。
   */
  const resetAutoplayTokenRef = createSignal(0);
  const resetAutoplay = () => {
    resetAutoplayTokenRef((t) => t + 1);
  };

  /** 自动播放：仅在有 document（浏览器或 SSR 影子）时注册，避免纯 SSR flush 时无宿主文档 */
  createEffect(() => {
    if (getDocument() == null) return;
    if (!props.autoplay) return;
    const { count } = carouselSlidesInfo(props);
    if (count <= 1) return;
    void resetAutoplayTokenRef.value;
    const ms = props.autoplayInterval ?? 5000;
    const id = globalThis.setInterval(() => {
      goRef.current(1);
    }, ms);
    return () => globalThis.clearInterval(id);
  });

  /**
   * 单帧树：在渲染 getter 内调用；有 `getDocument()` 时返回 `() => buildCarouselTree()` 以细粒度订阅，
   * 无 document 时同步返回 `buildCarouselTree()` 满足 SSR（与 Progress 同理）。
   */
  const buildCarouselTree = () => {
    const {
      direction = "horizontal",
      slidesToShow = 1,
      height: heightProp,
      contentFit = "cover",
      class: className,
      slideClass,
      lazySlides = false,
    } = props;

    const { useImages, images: imagesList, slides, count } = carouselSlidesInfo(
      props,
    );
    const infinite = props.infinite !== false;
    const dots = props.dots ?? true;
    const arrows = props.arrows ?? true;
    const dotPosition = props.dotPosition ?? "bottom";
    const effectResolved =
      (props.effect ?? "slide") as CarouselTransitionEffect;
    const speed = props.speed ?? 300;
    const isStacked = carouselIsStackedEffect(effectResolved);

    const normalizeIndex = (raw: number): number => {
      if (count === 0) return 0;
      const n = Math.trunc(raw);
      if (!Number.isFinite(n)) return 0;
      return ((n % count) + count) % count;
    };

    const resolveCurrent = (): number => {
      const cp = props.current;
      if (cp === undefined) {
        return normalizeIndex(internalIndexRef.value);
      }
      const raw = typeof cp === "function" ? cp() : cp;
      const num = typeof raw === "number" ? raw : Number(raw);
      return normalizeIndex(num);
    };

    const cur = resolveCurrent();
    currentRef.current = cur;

    /**
     * 提交页码：在浏览器端延后到下一 animation frame 再写入 signal / onChange，
     * 让上一帧 paint 后再 patch 轨道的 `transform` 或层叠 `opacity`，CSS `transition` 才能从旧值插值（与行内样式增量 patch 协同）。
     */
    const commitCarouselIndex = (next: number) => {
      if (props.current === undefined) {
        internalIndexRef.value = next;
      }
      props.onChange?.(next);
      currentRef.current = next;
    };

    const scheduleCarouselIndexCommit = (next: number) => {
      if (
        getDocument() != null &&
        typeof globalThis.requestAnimationFrame === "function"
      ) {
        globalThis.requestAnimationFrame(() => commitCarouselIndex(next));
      } else {
        commitCarouselIndex(next);
      }
    };

    const go = (delta: number) => {
      if (count === 0) return;
      const c = resolveCurrent();
      let next = c + delta;
      if (infinite) next = ((next % count) + count) % count;
      else next = Math.max(0, Math.min(count - 1, next));
      scheduleCarouselIndexCommit(next);
    };

    goRef.current = go;

    const goToIndex = (i: number) => {
      if (count === 0) return;
      const next = normalizeIndex(i);
      scheduleCarouselIndexCommit(next);
    };

    const isHorizontal = direction === "horizontal";

    const containerStyle = heightProp ? { height: heightProp } : undefined;
    const defaultHeightClass = isHorizontal ? "h-48" : "h-64";
    const contentFitClass = contentFit === "contain"
      ? "[&>img]:object-contain [&>img]:w-full [&>img]:h-full"
      : contentFit === "cover"
      ? "[&>img]:object-cover [&>img]:w-full [&>img]:h-full"
      : "[&>img]:object-fill [&>img]:w-full [&>img]:h-full [&>img]:min-w-full [&>img]:min-h-full";

    /**
     * 根据当前页生成轨道样式（与 {@link cur} 同步自 `resolveCurrent`）。
     * 子项宽度/高度为轨道的 `(100/count)%`；`translate*` 的百分比相对**轨道自身**，
     * 故每前进一页应平移 `(100/count)%`，不可用 `(100/slidesToShow)%`（slidesToShow=1 时会一次移整条轨道，屏内只剩空白）。
     */
    const trackOffsetPercent = count > 0 ? 100 / count : 0;

    /** 非层叠 `slide`：子项在 flex 轨道内均分宽度/高度，整轨用 `translate*` 平移（见 {@link trackStyleFor}）。 */
    const slideStyleSlideMode: Record<string, string | number> = isHorizontal
      ? {
        width: `${trackOffsetPercent}%`,
        flexShrink: 0,
        minHeight: 0,
      }
      : {
        height: `${trackOffsetPercent}%`,
        flexShrink: 0,
      };

    const trackStyleFor = (index: number) =>
      isStacked
        ? {
          position: "relative" as const,
          width: "100%",
          height: "100%",
        }
        : isHorizontal
        ? {
          transform: `translateX(-${index * trackOffsetPercent}%)`,
          display: "flex",
          width: `${count * (100 / slidesToShow)}%`,
          minHeight: "100%",
        }
        : {
          transform: `translateY(-${index * trackOffsetPercent}%)`,
          display: "flex",
          flexDirection: "column" as const,
          height: `${count * 100}%`,
        };

    const isSlideActiveFor = (activeIndex: number, i: number) => {
      if (!lazySlides || !useImages) return true;
      if (i === activeIndex) return true;
      if (!infinite || count <= 2) return false;
      const prev = (activeIndex - 1 + count) % count;
      const next = (activeIndex + 1) % count;
      return i === prev || i === next;
    };

    const trackBaseStyle = trackStyleFor(cur);
    /**
     * 非层叠时轨道带 `transform`，用行内 longhand 声明 `transition`，切页时仅改 `transform` 数值以触发滑动动画。
     */
    const slideTrackTransition: Record<string, string> = !isStacked
      ? {
        transitionProperty: "transform",
        transitionDuration: `${speed}ms`,
        transitionTimingFunction: "cubic-bezier(0.65, 0, 0.35, 1)",
      }
      : {};
    /**
     * 层叠模式轨道：isolate 形成独立堆叠上下文，减轻多 slide 交替时 z-index/3D 与过渡叠绘的闪缝；
     * flip 时保留 perspective / transform-style。
     */
    const trackMergedStyle: Record<string, string | number | undefined> =
      isStacked && effectResolved === "flip"
        ? {
          ...trackBaseStyle,
          isolation: "isolate",
          perspective: "1000px",
          transformStyle: "preserve-3d",
        }
        : isStacked
        ? { ...trackBaseStyle, isolation: "isolate" }
        : { ...trackBaseStyle, ...slideTrackTransition };

    return (
      <div
        class={twMerge(
          "carousel relative overflow-hidden box-border shrink-0 w-full",
          !heightProp && defaultHeightClass,
          className,
        )}
        style={containerStyle}
      >
        <div
          class={twMerge(
            !isStacked &&
              (isHorizontal ? "flex h-full min-h-0" : "flex flex-col h-full"),
            isStacked && "h-full w-full relative",
            !isStacked && "will-change-transform",
          )}
          style={trackMergedStyle}
          data-current={cur}
          data-effect={effectResolved}
        >
          {useImages
            ? imagesList!.map((src, i) => (
              <div
                key={src}
                class={twMerge(
                  "overflow-hidden bg-slate-200 dark:bg-slate-700 flex",
                  !isStacked && "relative",
                  isHorizontal && !isStacked && "h-full",
                  isStacked &&
                    (i === cur ? "z-10" : "z-0 pointer-events-none"),
                  slideClass,
                )}
                style={isStacked
                  ? {
                    ...carouselStackedSlideLayoutStyle,
                    ...carouselStackedSlideStyle(
                      effectResolved,
                      i === cur,
                      speed,
                    ),
                  }
                  : slideStyleSlideMode}
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
                  !isStacked && "relative",
                  isHorizontal && !isStacked && "h-full",
                  isStacked &&
                    (i === cur ? "z-10" : "z-0 pointer-events-none"),
                  slideClass,
                )}
                style={isStacked
                  ? {
                    ...carouselStackedSlideLayoutStyle,
                    ...carouselStackedSlideStyle(
                      effectResolved,
                      i === cur,
                      speed,
                    ),
                  }
                  : slideStyleSlideMode}
              >
                {slide}
              </div>
            ))}
        </div>
        {
          /**
           * 箭头须为本征根的直接子 `button`：勿用 `<>…</>`（Fragment 令 canPatch 失败）；勿包 `display:contents`，
           * 部分环境下该匿名盒与 DevTools/patch 协同差。两按钮与轨道、指示条并列，由 z-index 叠保证可点。
           */
        }
        {arrows && count > 1 && (
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
        )}
        {arrows && count > 1 && (
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
                  goToIndex(i);
                }}
                aria-label={`第 ${i + 1} 张`}
                aria-current={i === cur ? "true" : undefined}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (getDocument() != null) {
    return () => buildCarouselTree();
  }
  return buildCarouselTree();
}
