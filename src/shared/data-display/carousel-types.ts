/**
 * @module shared/data-display/carousel-types
 * @description Carousel 效果枚举、公开 props／文案与幻灯片元数据。
 */

/**
 * 轮播切换动画：`slide` 为轨道平移；`fade` / `zoom` / `flip` / `mosaic` 为层叠（`slidesToShow>1` 时仍建议用 slide）；
 * `random` 为每次切页在若干种效果中随机择一（`children` 时池内不含 `mosaic`，与单项 `mosaic` 降级一致）。
 */
export type CarouselTransitionEffect =
  | "slide"
  | "fade"
  | "zoom"
  | "flip"
  | "mosaic"
  | "random";

/** 实际参与布局/CSS 的切换类型（不含 `random`） */
export type CarouselConcreteTransitionEffect = Exclude<
  CarouselTransitionEffect,
  "random"
>;


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
  interval?: number;
  /** 方向：horizontal | vertical */
  direction?: "horizontal" | "vertical";
  /** 一屏显示几张（默认 1） */
  slidesToShow?: number;
  /** 是否循环，默认 true */
  infinite?: boolean;
  /** 是否显示指示点 */
  dots?: boolean;
  /** 是否显示左右/上下箭头切换按钮，默认 true */
  arrows?: boolean;
  /**
   * 是否允许在轮播区域通过鼠标拖移或手指滑动切换（Pointer Events，移动端与桌面均可）。
   * 默认 true；设为 false 时仅箭头、指示点、自动播放可切换。
   */
  swipe?: boolean;
  /** 指示点位置 */
  dotPosition?: "bottom" | "top" | "left" | "right";
  /**
   * 切换效果：slide 轨道平移；fade / zoom / flip / mosaic 为层叠（mosaic 为小方格随机渐入，仅 `images`；思路同 `ImageViewer`）；
   * random 为每次切页在 slide/fade/zoom/flip/mosaic 中随机择一（仅 children 时不含 mosaic）。
   */
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
  /** 多语言/自定义文案；未传字段走 {@link defaultCarouselMessages} */
  messages?: Partial<CarouselMessages>;
}

/** Carousel 内置文案 */
export interface CarouselMessages {
  /** 上一张按钮 `aria-label` */
  prev: string;
  /** 下一张按钮 `aria-label` */
  next: string;
}

/** 默认中文文案 */
export const defaultCarouselMessages: CarouselMessages = {
  prev: "上一张",
  next: "下一张",
};

/**
 * 从 `props` 解析轮播数据来源与张数；在渲染 getter 内调用，避免 images/children 变更后仍用旧 count。
 */
export function carouselSlidesInfo(p: CarouselProps): {
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

/**
 * 计算到「下一 `period` 毫秒墙钟边界」的延时，供自动播链式 `setTimeout` 的下一拍调度（与 ui-preact 一致）。
 *
 * @param period - 已含 `Math.max(400, interval, speed+160)` 的周期（毫秒）
 */
