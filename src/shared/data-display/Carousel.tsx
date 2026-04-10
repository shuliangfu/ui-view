/**
 * Carousel 轮播图/幻灯片（View）。
 * 多张内容横向/纵向轮播；自动播放、指示点、箭头、一屏多图、循环（`slide` 为 CSS `transform` 轨道平移，非 overflow 手指滑动）。
 *
 * **SSR / 无 document：** 浏览器下根节点为静态 `div`，仅**内部**用函数子渲染轨道与控件，避免「整组件返回 `() => tree`」时与 `insert` 的 effect 同层订阅 `current`，重跑会再次执行 `Carousel(props)`、重复 `createSignal` 导致切页空白或乱跳。
 * {@link getDocument} 为 `null` 时同步展开内层，不注册 autoplay 定时器。
 *
 * **受控与父级结构：** `current` 请传 `() => sig.value` 等 getter 即可；勿在父级本征节点下再包一层
 * `{() => <Carousel …/>}`，否则子列表含动态 getter 时 View 无法 canPatch，轮播根会被整块重挂，切换动画失效。
 *
 * **`effect="slide"`：** 轨道用 `transform: translateX/Y` + 行内 `transition` 平移；切页在 `requestAnimationFrame` 后再提交索引。不用 `scrollTo(smooth)`（易与 patch、snap 冲突，表现为闪切或邻页露边）。
 *
 * **`images` + `lazySlides=false`：** 幻灯片内用原生 `<img>`（`loading="eager"`），不用 {@link Image}，避免其 loading 时 `opacity-0` 与卸载清空 `src` 在切页重绘时出现长时间黑块。
 *
 * **层叠效果（fade / zoom / flip / mosaic）**：与图片查看器（`ImageViewer`）相同思路——切页时上一张垫底；`mosaic` 为小方格随机渐入（仅 `images` 模式），`children` 模式下降级为 `fade`。
 * **`effect="random"`**：每次切页在 slide / fade / zoom / flip / mosaic 中随机择一（仅 `children` 时不含 mosaic）；首帧固定按 slide 布局以兼顾 SSR。
 *
 * **勿把轨道与箭头、指示点放进同一函数子返回的数组**：`insert` 对数组子整段替换（尾锚 `view:array-end`），会导致轨道 DOM 每次切页重建，过渡无效；应轨道、指示点分函数子，箭头静态 + `goRef`。
 *
 * **`arrows` / `swipe`：** `arrows` 控制是否显示左右切换按钮；`swipe` 控制是否在轮播区域用鼠标拖移或手指滑动切页（与 `touch-action` 配合，横向轮播保留纵向滚动手势）。二者独立，例如移动端可 `arrows={false} swipe` 仅手势切换。
 *
 * **滑动跟手：** `effect="slide"` 时在轨道百分比平移上叠加像素偏移；层叠效果（`fade` / `zoom` / `flip` / `mosaic`）无横向长条轨道，跟手阶段对**整轨容器**做同向 `translate`，松手后仍走各自 CSS 过渡切页；非 `infinite` 时在首尾阻尼为单向位移。
 */

import {
  createEffect,
  createSignal,
  getDocument,
  onCleanup,
} from "@dreamer/view";
import { twMerge } from "tailwind-merge";
/** 按需：单文件图标，避免经 icons/mod 拉入全表 */
import { IconChevronLeft } from "../basic/icons/ChevronLeft.tsx";
import { IconChevronRight } from "../basic/icons/ChevronRight.tsx";
import { IMAGE_BUILTIN_FALLBACK_SRC } from "./Image.tsx";

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

/** `effect="random"` 时参与抽签的候选（`mosaic` 在仅 `children` 时由 {@link carouselPickRandomConcreteEffect} 剔除） */
const CAROUSEL_RANDOM_EFFECT_POOL: readonly CarouselConcreteTransitionEffect[] =
  [
    "slide",
    "fade",
    "zoom",
    "flip",
    "mosaic",
  ];

/**
 * 从候选池中随机一条具体效果；无 `images` 时不抽 `mosaic`，避免与 children 降级规则冲突。
 *
 * @param p - 轮播 props
 */
function carouselPickRandomConcreteEffect(
  p: CarouselProps,
): CarouselConcreteTransitionEffect {
  const slides = carouselSlidesInfo(p);
  const pool = slides.useImages
    ? [...CAROUSEL_RANDOM_EFFECT_POOL]
    : CAROUSEL_RANDOM_EFFECT_POOL.filter((e) => e !== "mosaic");
  const n = pool.length;
  if (n === 0) return "slide";
  return pool[Math.floor(Math.random() * n)]!;
}

/**
 * 将 `random` 解析为当前用于渲染的具体效果（由内部 signal 保存每次切页抽签结果）。
 *
 * @param p - 轮播 props
 * @param randomPick - `effect="random"` 时使用的具体效果
 */
function carouselResolveRenderEffect(
  p: CarouselProps,
  randomPick: CarouselConcreteTransitionEffect,
): CarouselConcreteTransitionEffect {
  const raw = (p.effect ?? "slide") as CarouselTransitionEffect;
  if (raw !== "random") return raw as CarouselConcreteTransitionEffect;
  return randomPick;
}

/** 层叠位效果子集（与 {@link carouselIsStackedEffect} 一致） */
type CarouselStackedKind = "fade" | "zoom" | "flip" | "mosaic";

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
 * @param e - 已解析的具体效果（不含 `random`）
 */
function carouselIsStackedEffect(
  e: CarouselConcreteTransitionEffect,
): e is CarouselStackedKind {
  return (
    e === "fade" ||
    e === "zoom" ||
    e === "flip" ||
    e === "mosaic"
  );
}

/** 与 ImageViewer 一致的马赛克网格参数 */
const CAROUSEL_MOSAIC_COLS = 8;
const CAROUSEL_MOSAIC_ROWS = 6;
const CAROUSEL_MOSAIC_CELL_MS = 260;
const CAROUSEL_MOSAIC_STAGGER_MS = 14;

/**
 * 移除轨道上 `mosaic` 叠层，避免换图或改 `effect` 后残留方格。
 *
 * @param mount - 轨道根节点（`data-carousel-track-root`）；SSR / 虚拟节点上可能无 DOM API，需跳过。
 */
function carouselRemoveMosaicOverlays(
  mount: HTMLElement | null | undefined,
): void {
  if (mount == null) return;
  // Hybrid SSR 清理时 ref 可能不是真实 Element（无 querySelectorAll），避免抛错导致整页 500
  if (typeof mount.querySelectorAll !== "function") return;
  mount.querySelectorAll("[data-dreamer-carousel-mosaic]").forEach((el) => {
    el.remove();
  });
}

/**
 * 系统是否开启「减少动态效果」。
 *
 * @returns 为 `true` 时马赛克降级为瞬时切换
 */
function carouselPrefersReducedMotion(): boolean {
  try {
    return globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")
      ?.matches === true;
  } catch {
    return false;
  }
}

/**
 * 按单项 `contentFit` 计算图片在容器内的绘制框（马赛克 `background-*` 与真实 `img` 对齐；`cover`/`contain`/`fill`）。
 *
 * @param containerW - 容器内容宽
 * @param containerH - 容器内容高
 * @param naturalW - 位图宽
 * @param naturalH - 位图高
 * @param fit - 与 {@link CarouselProps.contentFit} 一致
 */
function carouselObjectFitDrawRect(
  containerW: number,
  containerH: number,
  naturalW: number,
  naturalH: number,
  fit: NonNullable<CarouselProps["contentFit"]>,
): { drawW: number; drawH: number; offX: number; offY: number } {
  const cw = Math.max(0, containerW);
  const ch = Math.max(0, containerH);
  let iw = naturalW;
  let ih = naturalH;
  if (!Number.isFinite(iw) || iw <= 0) iw = cw > 0 ? cw : 1;
  if (!Number.isFinite(ih) || ih <= 0) ih = ch > 0 ? ch : 1;
  if (cw <= 0 || ch <= 0) {
    return { drawW: cw, drawH: ch, offX: 0, offY: 0 };
  }
  if (fit === "fill") {
    return { drawW: cw, drawH: ch, offX: 0, offY: 0 };
  }
  if (fit === "contain") {
    const s = Math.min(cw / iw, ch / ih);
    const drawW = iw * s;
    const drawH = ih * s;
    return { drawW, drawH, offX: (cw - drawW) / 2, offY: (ch - drawH) / 2 };
  }
  const s = Math.max(cw / iw, ch / ih);
  const drawW = iw * s;
  const drawH = ih * s;
  return { drawW, drawH, offX: (cw - drawW) / 2, offY: (ch - drawH) / 2 };
}

/**
 * 判断两 URL 是否指向同一资源（`img.currentSrc` 与 `nextSrc`；相对/绝对写法归一）。
 *
 * @param a - 当前地址
 * @param b - 目标地址
 */
function carouselSameResourceUrl(a: string, b: string): boolean {
  if (a === b) return true;
  try {
    const base = globalThis.location?.href ?? "http://carousel.local/";
    return new URL(a, base).href === new URL(b, base).href;
  } catch {
    return false;
  }
}

/**
 * 轨道内 `data-carousel-slide-inner` 相对轨道根的内容盒原点与宽高。
 * 马赛克叠层必须用 **inner 的 client 尺寸 + {@link carouselObjectFitDrawRect}** 对齐 `object-fit`，
 * 切换瞬间勿信 `img.getBoundingClientRect()`（新图未解码时常仍为上一张的布局尺寸）。
 *
 * @param mount - `data-carousel-track-root`
 * @param inner - 单项内容容器
 */
function carouselMosaicInnerContentBoxInTrack(
  mount: HTMLElement,
  inner: HTMLElement,
): { left: number; top: number; cw: number; ch: number } {
  const mbr = mount.getBoundingClientRect();
  const ir = inner.getBoundingClientRect();
  return {
    left: ir.left - mbr.left + inner.clientLeft,
    top: ir.top - mbr.top + inner.clientTop,
    cw: inner.clientWidth,
    ch: inner.clientHeight,
  };
}

/**
 * `images` 且 `lazySlides=false` 时用原生 img 的 object-fit 类。
 * 不用 {@link Image}：其 loading 态为 `opacity-0`，且卸载时会清空 `src`；内层随 `current` 重跑若重建子树，会反复进入 loading，切页长时间只见灰/黑底。
 *
 * @param fit - 与 {@link CarouselProps.contentFit} 一致
 */
function carouselNativeImgClass(
  fit: NonNullable<CarouselProps["contentFit"]>,
): string {
  const fitCls = fit === "contain"
    ? "object-contain"
    : fit === "fill"
    ? "object-fill"
    : "object-cover";
  return twMerge(
    "block w-full h-full min-w-0 min-h-0",
    fitCls,
  );
}

/** 层叠切换时单张 slide 的角色（与 ImageViewer 双缓冲：underlay = 旧图垫底） */
type CarouselStackedSlideRole = "active" | "underlay" | "hidden";

/**
 * 解析层叠模式下第 `i` 张的角色。
 *
 * @param i - slide 下标
 * @param cur - 当前页
 * @param underlayIdx - 过渡期内垫在下面的上一页；`null` 表示无过渡
 */
function carouselStackedSlideRoleOf(
  i: number,
  cur: number,
  underlayIdx: number | null,
): CarouselStackedSlideRole {
  if (i === cur) return "active";
  if (underlayIdx !== null && i === underlayIdx) return "underlay";
  return "hidden";
}

/**
 * 层叠布局下单张 slide 的**目标** opacity / transform（与 {@link carouselStackedSlideRole} 配合）。
 * fade：仅透明度叠化，无位移（对齐 ImageViewer `fade`）；underlay / active 在过渡期内均保持不透明。
 *
 * @param kind - fade / zoom / flip / mosaic
 * @param role - active | underlay | hidden
 */
function carouselStackedSlideAnimatedStyle(
  kind: CarouselStackedKind,
  role: CarouselStackedSlideRole,
): Record<string, string | number> {
  if (kind === "fade" || kind === "mosaic") {
    if (role === "hidden") {
      return { opacity: 0, transform: "none" };
    }
    return { opacity: 1, transform: "none" };
  }
  // zoom：hidden 态缩得足够小，切入时「由小放大」才明显（0.88 仅约 12%，肉眼偏弱）
  if (kind === "zoom") {
    if (role === "hidden") {
      return { opacity: 0, transform: "scale(0.72)" };
    }
    return { opacity: 1, transform: "scale(1)" };
  }
  if (role === "hidden") {
    return {
      opacity: 0,
      transform: "rotateY(-86deg) scale(0.88) translateZ(-20px)",
    };
  }
  return {
    opacity: 1,
    transform: "rotateY(0deg) scale(1) translateZ(0)",
  };
}

/**
 * 层叠模式下单张 slide 的**完整**行内样式：transition longhand + 动画终态。
 * **不依赖** Tailwind 是否生成 `transition-*` 任意类；文档站若未打进对应 CSS，原先会表现为完全瞬切。
 *
 * @param kind - fade / zoom / flip / mosaic
 * @param i - slide 下标
 * @param cur - 当前页
 * @param underlayIdx - 过渡期内垫底上一页
 * @param speedMs - 与 {@link CarouselProps.speed} 一致
 * @param mosaicHideActive - `mosaic` 且叠层播放中：当前页先透明，避免与方格叠层重复绘制
 */
function carouselStackedSlideStyle(
  kind: CarouselStackedKind,
  i: number,
  cur: number,
  underlayIdx: number | null,
  speedMs: number,
  mosaicHideActive = false,
): Record<string, string | number> {
  const role = carouselStackedSlideRoleOf(i, cur, underlayIdx);
  if (kind === "mosaic" && role === "active" && mosaicHideActive) {
    return {
      ...carouselStackedSlideLayoutStyle,
      opacity: 0,
      transitionProperty: "none",
      transitionDuration: "0ms",
      transitionTimingFunction: "linear",
      willChange: "auto",
    };
  }
  // 方格结束揭开时：当前页须**瞬时**不透明；若仍用 `speed` 的 opacity 过渡，叠层一撤会从 0 缓到 1，肉眼像闪一下/发灰
  if (kind === "mosaic" && role === "active" && !mosaicHideActive) {
    return {
      ...carouselStackedSlideLayoutStyle,
      ...carouselStackedSlideAnimatedStyle(kind, role),
      transitionProperty: "none",
      transitionDuration: "0ms",
      transitionTimingFunction: "linear",
      willChange: "auto",
    };
  }
  const timing = kind === "fade" || kind === "mosaic"
    ? "cubic-bezier(0.45, 0, 0.55, 1)"
    : kind === "zoom"
    // 略抬高贝塞尔控制点 y，收尾略带「弹出感」，配合更小起始 scale 强化「缩小再放大」
    ? "cubic-bezier(0.28, 1.18, 0.55, 1.02)"
    : "cubic-bezier(0.45, 0, 0.2, 1)";
  const anim = carouselStackedSlideAnimatedStyle(kind, role);
  const transitionProperty = kind === "fade" || kind === "mosaic"
    ? "opacity"
    : "opacity, transform";
  const out: Record<string, string | number> = {
    transitionProperty,
    transitionDuration: `${speedMs}ms`,
    transitionTimingFunction: timing,
    willChange: kind === "fade" || kind === "mosaic"
      ? "opacity"
      : "opacity, transform",
    ...anim,
  };
  if (kind === "flip") {
    out.transformOrigin = "center center";
    out.backfaceVisibility = "hidden";
  } else if (kind === "zoom") {
    // 从中心缩放，避免贴边裁切时「往一角缩」看起来像在平移
    out.transformOrigin = "center center";
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

/**
 * 将原始索引归一化到 `[0, count)`。
 *
 * @param raw - 原始下标
 * @param count - 张数
 */
function carouselNormalizeIndex(raw: number, count: number): number {
  if (count === 0) return 0;
  const n = Math.trunc(raw);
  if (!Number.isFinite(n)) return 0;
  return ((n % count) + count) % count;
}

/**
 * 解析当前页（受控 getter 或 `internalVal`），供轨道、指示点、层叠垫底 effect 共用，避免多处拷贝不一致。
 *
 * @param p - 轮播 props
 * @param internalVal - 非受控时内部 signal 的 `.value`
 * @param count - 张数
 */
function carouselResolveCurrentIndex(
  p: CarouselProps,
  internalVal: number,
  count: number,
): number {
  if (count === 0) return 0;
  if (p.current === undefined) {
    return carouselNormalizeIndex(internalVal, count);
  }
  const v = typeof p.current === "function" ? p.current() : p.current;
  const num = typeof v === "number" ? v : Number(v);
  return carouselNormalizeIndex(num, count);
}

export function Carousel(props: CarouselProps) {
  /** 非受控（未传 `current`）时的内部当前页 */
  const internalIndexRef = createSignal(0);
  /**
   * `effect="random"` 时当前这一次切页使用的具体效果；首帧固定为 slide，便于 SSR 与客户端首屏一致，首次切页起才抽签。
   */
  const randomEffectPickRef = createSignal<CarouselConcreteTransitionEffect>(
    "slide",
  );
  /** 与 `resolveCurrent` 同步，供定时器 tick 读取 */
  const currentRef = { current: 0 };
  /**
   * `setInterval` 内调用最新 `go`；若闭包捕获初次挂载的 `go`，受控下 `onChange` 已更新但 `currentRef` 不前进，会反复请求同一页。
   */
  const goRef: { current: (delta: number) => void } = { current: () => {} };

  /** 轨道根 DOM，供 `mosaic` 叠层 `appendChild` */
  const carouselTrackMountRef: { current: HTMLElement | null } = {
    current: null,
  };
  /** `mosaic` 播放中方格叠层替代当前页，避免与下层 `img` 叠画 */
  const mosaicSuppressActiveRef = createSignal(false);
  /** 防止快速连点时旧马赛克 `finalize` 误清状态 */
  let carouselMosaicRunId = 0;

  /** 最外层轮播容器：挂载滑动切换的指针监听 */
  const carouselRootRef: { current: HTMLElement | null } = { current: null };
  /**
   * ref 每次写入时 bump，使滑动 `createEffect` 在 DOM 就绪或容器替换后重新 `addEventListener`。
   */
  const carouselRootMountTick = createSignal(0);

  /**
   * 滑动跟手：沿主方向（横为 `clientX` 差、纵为 `clientY` 差）的像素偏移。
   * - `slide`：写入 `translate(calc(-索引% + 偏移))`；
   * - 层叠效果：整轨 `translate`，仅预览位移，切页仍由层叠 opacity/transform 动画承担。
   */
  const carouselSwipeDragPxRef = createSignal(0);
  /**
   * 指针按下后是否已产生跟手位移会话；为真时轨道 `transform` 关闭 transition，避免逐帧与 CSS 过渡打架。
   */
  const carouselSwipeDraggingRef = createSignal(false);

  /**
   * 手动切换时 bump `.value`，让 autoplay 的 effect 重跑并清除旧定时器、重新计时，
   * 避免与 setInterval 叠加导致乱跳。
   */
  const resetAutoplayTokenRef = createSignal(0);
  const resetAutoplay = () => {
    resetAutoplayTokenRef((t) => t + 1);
  };

  /**
   * 提交页码：在浏览器端延后到下一 animation frame 再写入 signal / onChange，
   * 让上一帧 paint 后再 patch 轨道的 `transform` 或层叠 `opacity`，CSS `transition` 才能从旧值插值。
   */
  const commitCarouselIndex = (next: number) => {
    const { count } = carouselSlidesInfo(props);
    if (
      count > 0 && (props.effect ?? "slide") === "random"
    ) {
      const prevCur = carouselResolveCurrentIndex(
        props,
        internalIndexRef.value,
        count,
      );
      if (
        carouselNormalizeIndex(prevCur, count) !==
          carouselNormalizeIndex(next, count)
      ) {
        randomEffectPickRef.value = carouselPickRandomConcreteEffect(props);
      }
    }
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

  /**
   * 切换页码（供箭头、autoplay、指示点调用）；每次读取最新 `count` / `current`，无需依赖函数子重挂。
   *
   * @param delta - 相对当前页的位移（±1）
   */
  const go = (delta: number) => {
    const { count } = carouselSlidesInfo(props);
    if (count === 0) return;
    const infinite = props.infinite !== false;
    const c = carouselResolveCurrentIndex(props, internalIndexRef.value, count);
    let next = c + delta;
    if (infinite) next = ((next % count) + count) % count;
    else next = Math.max(0, Math.min(count - 1, next));
    scheduleCarouselIndexCommit(next);
  };

  goRef.current = go;

  /**
   * 在根容器上注册拖移/滑动切页：水平轮播以横向位移为主判据，纵向轮播以纵向为主；忽略从 `button` 开始的指针。
   * `document` 捕获阶段监听 `pointermove` / `pointerup` / `pointercancel`，避免在 `<img>` 上拖移结束时指针落在根节点外导致收不到抬起；轮播内 `img` 另设 `draggable={false}` 防止浏览器默认拖图抢走指针。
   */
  createEffect(() => {
    void carouselRootMountTick.value;
    if (getDocument() == null) return;
    if (props.swipe === false) return;
    const root = carouselRootRef.current;
    if (root == null) return;
    const { count } = carouselSlidesInfo(props);
    if (count <= 1) return;

    const doc = globalThis.document;
    const horizontal = (props.direction ?? "horizontal") === "horizontal";
    /** 超过该位移（px）且为主方向分量时记为一次切换 */
    const thresholdPx = 48;

    let tracking = false;
    let pointerId = -1;
    let startX = 0;
    let startY = 0;

    /**
     * 立即清零跟手偏移（切页或无需回弹动画时调用，避免与下一帧索引动画叠化冲突）。
     */
    const clearSwipeDragInstant = () => {
      carouselSwipeDraggingRef.value = false;
      carouselSwipeDragPxRef.value = 0;
    };

    /**
     * 松手未切页时：先结束 dragging 态以恢复 transition，再在下一帧把位移归零，触发轨道回弹动画。
     */
    const clearSwipeDragAnimated = () => {
      carouselSwipeDraggingRef.value = false;
      if (
        getDocument() != null &&
        typeof globalThis.requestAnimationFrame === "function"
      ) {
        globalThis.requestAnimationFrame(() => {
          carouselSwipeDragPxRef.value = 0;
        });
      } else {
        carouselSwipeDragPxRef.value = 0;
      }
    };

    /**
     * 结束跟手：移除 document 监听并释放 capture。
     */
    const stopTracking = () => {
      if (!tracking) return;
      tracking = false;
      doc.removeEventListener("pointermove", onDocumentPointerMove, true);
      doc.removeEventListener("pointerup", onDocumentPointerUp, true);
      doc.removeEventListener("pointercancel", onDocumentPointerCancel, true);
      try {
        root.releasePointerCapture(pointerId);
      } catch {
        /* ignore */
      }
      pointerId = -1;
    };

    /**
     * document 捕获阶段 `pointermove`：更新跟手像素；非循环时在首尾钳制单向预览，避免拉出空白。
     */
    const onDocumentPointerMove = (ev: PointerEvent) => {
      if (!tracking || ev.pointerId !== pointerId) return;
      const infinite = props.infinite !== false;
      const cur = carouselResolveCurrentIndex(
        props,
        internalIndexRef.value,
        count,
      );
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      let primary = horizontal ? dx : dy;
      if (!infinite) {
        if (cur <= 0) primary = Math.min(0, primary);
        if (cur >= count - 1) primary = Math.max(0, primary);
      }
      carouselSwipeDraggingRef.value = true;
      carouselSwipeDragPxRef.value = primary;
    };

    /**
     * 在 document 上收到抬起/取消：统一在这里算位移并切页。
     */
    const onDocumentPointerUp = (ev: PointerEvent) => {
      if (!tracking || ev.pointerId !== pointerId) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      stopTracking();
      const movedEnough = horizontal
        ? Math.abs(dx) > 2 || Math.abs(dy) > 2
        : Math.abs(dy) > 2 || Math.abs(dx) > 2;
      if (horizontal) {
        if (Math.abs(dx) < thresholdPx || Math.abs(dx) <= Math.abs(dy)) {
          if (movedEnough) clearSwipeDragAnimated();
          else clearSwipeDragInstant();
          return;
        }
        clearSwipeDragInstant();
        resetAutoplay();
        if (dx < 0) goRef.current(1);
        else goRef.current(-1);
      } else {
        if (Math.abs(dy) < thresholdPx || Math.abs(dy) <= Math.abs(dx)) {
          if (movedEnough) clearSwipeDragAnimated();
          else clearSwipeDragInstant();
          return;
        }
        clearSwipeDragInstant();
        resetAutoplay();
        if (dy < 0) goRef.current(1);
        else goRef.current(-1);
      }
    };

    const onDocumentPointerCancel = (ev: PointerEvent) => {
      if (!tracking || ev.pointerId !== pointerId) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      stopTracking();
      const movedEnough = horizontal
        ? Math.abs(dx) > 2 || Math.abs(dy) > 2
        : Math.abs(dy) > 2 || Math.abs(dx) > 2;
      if (movedEnough) clearSwipeDragAnimated();
      else clearSwipeDragInstant();
    };

    /**
     * 仅主键；从按钮起手的不当滑动；按下后在 document 上捕获抬起。
     */
    const onPointerDown = (ev: PointerEvent) => {
      if (ev.button !== 0) return;
      const el = ev.target;
      if (
        el instanceof globalThis.Element &&
        el.closest("button") != null
      ) {
        return;
      }
      if (tracking) return;
      tracking = true;
      pointerId = ev.pointerId;
      startX = ev.clientX;
      startY = ev.clientY;
      doc.addEventListener("pointermove", onDocumentPointerMove, true);
      doc.addEventListener("pointerup", onDocumentPointerUp, true);
      doc.addEventListener("pointercancel", onDocumentPointerCancel, true);
      try {
        root.setPointerCapture(ev.pointerId);
      } catch {
        /* 无 capture 时仍依赖 document 冒泡捕获 */
      }
    };

    root.addEventListener("pointerdown", onPointerDown);

    onCleanup(() => {
      stopTracking();
      clearSwipeDragInstant();
      root.removeEventListener("pointerdown", onPointerDown);
      doc.removeEventListener("pointermove", onDocumentPointerMove, true);
      doc.removeEventListener("pointerup", onDocumentPointerUp, true);
      doc.removeEventListener("pointercancel", onDocumentPointerCancel, true);
    });
  });

  /**
   * 跳到指定索引（指示点）。
   *
   * @param i - 目标下标
   */
  const goToIndex = (i: number) => {
    const { count } = carouselSlidesInfo(props);
    if (count === 0) return;
    scheduleCarouselIndexCommit(carouselNormalizeIndex(i, count));
  };

  /** 自动播放：仅在有 document（浏览器或 SSR 影子）时注册，避免纯 SSR flush 时无宿主文档 */
  createEffect(() => {
    if (getDocument() == null) return;
    if (!props.autoplay) return;
    const { count } = carouselSlidesInfo(props);
    if (count <= 1) return;
    void resetAutoplayTokenRef.value;
    const ms = props.interval ?? 5000;
    const id = globalThis.setInterval(() => {
      goRef.current(1);
    }, ms);
    return () => globalThis.clearInterval(id);
  });

  /**
   * 层叠 fade/zoom/flip：`current` 变化时把**上一索引**记入垫底层，在 `speed` 毫秒内保持不透明，
   * 再清空（与 `ImageViewer` 新层淡入、旧层暂留的思路一致）。
   */
  const stackedUnderlayIdxRef = createSignal<number | null>(null);
  let stackedPrevCommittedCur = -1;
  let stackedUnderlayClearTimer:
    | ReturnType<typeof globalThis.setTimeout>
    | undefined;

  createEffect(() => {
    void randomEffectPickRef.value;
    const eff = carouselResolveRenderEffect(
      props,
      randomEffectPickRef.value,
    );
    if (!carouselIsStackedEffect(eff)) {
      stackedUnderlayIdxRef.value = null;
      stackedPrevCommittedCur = -1;
      if (stackedUnderlayClearTimer !== undefined) {
        globalThis.clearTimeout(stackedUnderlayClearTimer);
        stackedUnderlayClearTimer = undefined;
      }
      return;
    }
    const { count } = carouselSlidesInfo(props);
    if (count <= 1) return;
    const cur = carouselResolveCurrentIndex(
      props,
      internalIndexRef.value,
      count,
    );
    const speedMs = props.speed ?? 300;

    if (stackedPrevCommittedCur < 0) {
      stackedPrevCommittedCur = cur;
      return;
    }
    if (stackedPrevCommittedCur === cur) return;

    stackedUnderlayIdxRef.value = stackedPrevCommittedCur;
    stackedPrevCommittedCur = cur;
    if (stackedUnderlayClearTimer !== undefined) {
      globalThis.clearTimeout(stackedUnderlayClearTimer);
    }
    const slidesMeta = carouselSlidesInfo(props);
    const mosaicUsesDom = eff === "mosaic" &&
      slidesMeta.useImages &&
      getDocument() != null &&
      !carouselPrefersReducedMotion();
    // mosaic 由方格动画结束回调清空垫底层，不用 `speed` 定时器
    if (mosaicUsesDom) {
      stackedUnderlayClearTimer = undefined;
    } else {
      stackedUnderlayClearTimer = globalThis.setTimeout(() => {
        stackedUnderlayIdxRef.value = null;
        stackedUnderlayClearTimer = undefined;
      }, speedMs);
    }
  });

  /**
   * `effect="mosaic"`：在轨道内叠小方格网格（与 {@link ImageViewer} 同参），旧页垫底、新图分块渐入。
   */
  createEffect(() => {
    let fallbackTimer: ReturnType<typeof globalThis.setTimeout> | undefined;
    onCleanup(() => {
      if (fallbackTimer !== undefined) {
        globalThis.clearTimeout(fallbackTimer);
      }
      carouselRemoveMosaicOverlays(carouselTrackMountRef.current);
      mosaicSuppressActiveRef.value = false;
    });

    if (getDocument() == null) return;
    void randomEffectPickRef.value;
    const eff = carouselResolveRenderEffect(
      props,
      randomEffectPickRef.value,
    );
    const info = carouselSlidesInfo(props);
    if (eff !== "mosaic" || !info.useImages || info.count <= 1) {
      return;
    }

    void internalIndexRef.value;
    const under = stackedUnderlayIdxRef.value;
    const cur = carouselResolveCurrentIndex(
      props,
      internalIndexRef.value,
      info.count,
    );
    const contentFit = props.contentFit ?? "cover";

    if (under === null) {
      mosaicSuppressActiveRef.value = false;
      carouselRemoveMosaicOverlays(carouselTrackMountRef.current);
      return;
    }

    const nextSrc = info.images![cur];
    if (nextSrc === undefined || nextSrc === "") {
      mosaicSuppressActiveRef.value = false;
      stackedUnderlayIdxRef.value = null;
      return;
    }

    if (carouselPrefersReducedMotion()) {
      mosaicSuppressActiveRef.value = false;
      stackedUnderlayIdxRef.value = null;
      return;
    }

    const runId = ++carouselMosaicRunId;
    mosaicSuppressActiveRef.value = true;

    const totalMs = (CAROUSEL_MOSAIC_COLS * CAROUSEL_MOSAIC_ROWS - 1) *
        CAROUSEL_MOSAIC_STAGGER_MS +
      CAROUSEL_MOSAIC_CELL_MS +
      140;

    /**
     * 叠层结束：先让当前页 `img` 在方格**底下**变为不透明，再下一帧撤方格，避免「先撤叠层、样式晚一帧」时露灰底/垫底闪一下。
     */
    const finalize = () => {
      if (runId !== carouselMosaicRunId) return;
      if (fallbackTimer !== undefined) {
        globalThis.clearTimeout(fallbackTimer);
        fallbackTimer = undefined;
      }
      mosaicSuppressActiveRef.value = false;
      globalThis.requestAnimationFrame(() => {
        if (runId !== carouselMosaicRunId) return;
        carouselRemoveMosaicOverlays(carouselTrackMountRef.current);
        stackedUnderlayIdxRef.value = null;
      });
    };

    /**
     * 挂载马赛克：绘制框**只用** `data-carousel-slide-inner` 的 client 尺寸 + {@link carouselObjectFitDrawRect}，
     * 与 `img` 的 `object-fit` 一致；natural 尺寸来自已解码的 DOM `img` 或 `Image()` 预载（切换瞬间勿用 `img` 的 `getBoundingClientRect()` 作主路径，易残留上一张的布局尺寸）。
     */
    const runMosaic = () => {
      if (runId !== carouselMosaicRunId) return;
      const doc = globalThis.document;
      if (doc == null) {
        finalize();
        return;
      }

      const mount0 = carouselTrackMountRef.current;
      if (mount0 == null) {
        finalize();
        return;
      }

      carouselRemoveMosaicOverlays(mount0);

      const slideStart = mount0.querySelector(
        `[data-carousel-slide="${String(cur)}"]`,
      ) as HTMLElement | null;
      const imgStart = slideStart?.querySelector("img") as
        | HTMLImageElement
        | null;
      const innerStart = slideStart?.querySelector(
        "[data-carousel-slide-inner]",
      ) as HTMLElement | null;
      if (slideStart == null || imgStart == null || innerStart == null) {
        finalize();
        return;
      }

      if (mount0.clientWidth < 4 || mount0.clientHeight < 4) {
        finalize();
        return;
      }

      /**
       * 在已知位图宽高后挂网；异步回调内重新查询 slide/inner，保证与 DOM `img` 换图后位置一致。
       *
       * @param naturalW - 目标图 naturalWidth
       * @param naturalH - 目标图 naturalHeight
       */
      const appendMosaic = (naturalW: number, naturalH: number) => {
        if (runId !== carouselMosaicRunId) return;
        const mount = carouselTrackMountRef.current;
        if (mount == null) {
          finalize();
          return;
        }
        carouselRemoveMosaicOverlays(mount);

        const slideEl = mount.querySelector(
          `[data-carousel-slide="${String(cur)}"]`,
        ) as HTMLElement | null;
        const innerNow = slideEl?.querySelector(
          "[data-carousel-slide-inner]",
        ) as HTMLElement | null;
        if (slideEl == null || innerNow == null) {
          finalize();
          return;
        }

        const box = carouselMosaicInnerContentBoxInTrack(mount, innerNow);
        if (box.cw < 2 || box.ch < 2) {
          finalize();
          return;
        }

        const fb = carouselObjectFitDrawRect(
          box.cw,
          box.ch,
          naturalW,
          naturalH,
          contentFit,
        );
        const offX = box.left + fb.offX;
        const offY = box.top + fb.offY;
        const drawW = fb.drawW;
        const drawH = fb.drawH;
        if (drawW < 2 || drawH < 2) {
          finalize();
          return;
        }

        const cols = CAROUSEL_MOSAIC_COLS;
        const rows = CAROUSEL_MOSAIC_ROWS;
        const cellW = drawW / cols;
        const cellH = drawH / rows;

        const overlay = doc.createElement("div");
        overlay.setAttribute("data-dreamer-carousel-mosaic", "");
        overlay.setAttribute("aria-hidden", "true");
        overlay.style.position = "absolute";
        overlay.style.left = `${offX}px`;
        overlay.style.top = `${offY}px`;
        overlay.style.width = `${drawW}px`;
        overlay.style.height = `${drawH}px`;
        overlay.style.zIndex = "25";
        overlay.style.display = "grid";
        overlay.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        overlay.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        overlay.style.pointerEvents = "none";
        overlay.style.overflow = "hidden";

        const totalCells = rows * cols;
        const order = Array.from({ length: totalCells }, (_, idx) => idx);
        for (let oi = order.length - 1; oi > 0; oi--) {
          const j = Math.floor(Math.random() * (oi + 1));
          const tmp = order[oi]!;
          order[oi] = order[j]!;
          order[j] = tmp;
        }

        const bgUrl = `url(${JSON.stringify(nextSrc)})`;
        let k = 0;
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const cell = doc.createElement("div");
            cell.style.backgroundImage = bgUrl;
            cell.style.backgroundSize = `${drawW}px ${drawH}px`;
            cell.style.backgroundPosition = `-${col * cellW}px -${
              row * cellH
            }px`;
            cell.style.backgroundRepeat = "no-repeat";
            cell.style.opacity = "0";
            cell.style.transition =
              `opacity ${CAROUSEL_MOSAIC_CELL_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
            cell.style.transitionDelay = `${
              order[k]! * CAROUSEL_MOSAIC_STAGGER_MS
            }ms`;
            overlay.appendChild(cell);
            k++;
          }
        }

        mount.appendChild(overlay);
        void overlay.offsetWidth;
        globalThis.requestAnimationFrame(() => {
          if (runId !== carouselMosaicRunId) {
            carouselRemoveMosaicOverlays(mount);
            return;
          }
          for (let c = 0; c < overlay.children.length; c++) {
            const el = overlay.children[c] as HTMLElement;
            el.style.opacity = "1";
          }
        });

        fallbackTimer = globalThis.setTimeout(() => finalize(), totalMs);
      };

      const domReady = imgStart.naturalWidth > 0 &&
        imgStart.naturalHeight > 0 &&
        carouselSameResourceUrl(
          imgStart.currentSrc || imgStart.src,
          nextSrc,
        );

      if (domReady) {
        appendMosaic(imgStart.naturalWidth, imgStart.naturalHeight);
        return;
      }

      const probeBox = carouselMosaicInnerContentBoxInTrack(
        mount0,
        innerStart,
      );
      const cwFb = Math.max(1, probeBox.cw);
      const chFb = Math.max(1, probeBox.ch);

      const probe = new Image();
      probe.referrerPolicy = "no-referrer";
      probe.onload = () => {
        if (runId !== carouselMosaicRunId) return;
        appendMosaic(
          probe.naturalWidth > 0 ? probe.naturalWidth : cwFb,
          probe.naturalHeight > 0 ? probe.naturalHeight : chFb,
        );
      };
      probe.onerror = () => {
        if (runId !== carouselMosaicRunId) return;
        appendMosaic(cwFb, chFb);
      };
      probe.src = nextSrc;
    };

    globalThis.requestAnimationFrame(() => {
      globalThis.requestAnimationFrame(runMosaic);
    });
  });

  /**
   * 构建轨道：在 **Carousel 首次执行** 时调用一次。浏览器下 `style` / `class` / `data-*` 传**零参函数**，
   * 由 `jsx-runtime` 对原生节点挂 `createRenderEffect` **只改属性**；切勿用 `{() => <div>…整棵新树…</div>}`，
   * 否则每次解包都会 `createElement` + `replaceChild`，轨道与图片 DOM 全换，CSS transition 永远不连续。
   *
   * @param reactiveBrowser - `true` 为浏览器（函数型 prop）；`false` 为 SSR 快照
   */
  const buildCarouselTrackElement = (reactiveBrowser: boolean) => {
    const {
      direction = "horizontal",
      slidesToShow = 1,
      contentFit = "cover",
      slideClass,
      lazySlides = false,
    } = props;

    const { useImages, images: imagesList, slides, count } = carouselSlidesInfo(
      props,
    );

    if (count === 0) return null;

    const infinite = props.infinite !== false;
    const speed = props.speed ?? 300;
    const isHorizontal = direction === "horizontal";

    /**
     * 读取当前帧用于布局的具体效果（订阅 `randomEffectPickRef` 以便 `effect="random"` 时轨道在 slide/层叠间切换）。
     */
    const readEffectResolved = (): CarouselConcreteTransitionEffect =>
      carouselResolveRenderEffect(props, randomEffectPickRef.value);

    const readLayoutStacked = (): boolean =>
      carouselIsStackedEffect(readEffectResolved());

    const readCur = () =>
      carouselResolveCurrentIndex(props, internalIndexRef.value, count);

    const readUnderlay = (): number | null =>
      readLayoutStacked() ? stackedUnderlayIdxRef.value : null;

    const contentFitClass = contentFit === "contain"
      ? "[&>img]:object-contain [&>img]:w-full [&>img]:h-full"
      : contentFit === "cover"
      ? "[&>img]:object-cover [&>img]:w-full [&>img]:h-full"
      : "[&>img]:object-fill [&>img]:w-full [&>img]:h-full [&>img]:min-w-full [&>img]:min-h-full";

    const trackOffsetPercent = 100 / count;
    const slideStyleSlideMode: Record<string, string | number> = isHorizontal
      ? { width: `${trackOffsetPercent}%`, flexShrink: 0, minHeight: 0 }
      : { height: `${trackOffsetPercent}%`, flexShrink: 0 };

    /**
     * @param index - 当前轨道索引
     * @param stacked - 是否层叠布局（与 {@link readLayoutStacked} 一致）
     */
    const trackStyleFor = (index: number, stacked: boolean) =>
      stacked
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

    /** 层叠模式下松手回弹：与 `speed` 对齐上限，避免比切页动画慢太多 */
    const stackedSwipeSnapTransition: Record<string, string> = {
      transitionProperty: "transform",
      transitionDuration: `${Math.min(240, speed)}ms`,
      transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    };

    const swipeDragTransitionNone: Record<string, string> = {
      transitionProperty: "none",
      transitionDuration: "0ms",
    };

    /**
     * 合并轨道根行内样式：读 `carouselSwipeDragPxRef` / `carouselSwipeDraggingRef` 供浏览器端 `style={() => …}` 订阅。
     * - 平移 `slide`：`calc(-百分比 + 像素)`；
     * - 层叠：整轨额外 `translate`，与单页 fade/zoom/flip 的 transform 叠加在父子层，互不覆盖。
     *
     * @param curIdx - 当前页索引
     */
    const mergeTrackStyle = (
      curIdx: number,
    ): Record<string, string | number | undefined> => {
      void randomEffectPickRef.value;
      const dragPx = carouselSwipeDragPxRef.value;
      const dragging = carouselSwipeDraggingRef.value;
      const effectResolved = readEffectResolved();
      const stacked = carouselIsStackedEffect(effectResolved);
      const trackBase = trackStyleFor(curIdx, stacked);
      const slideTrackTransition: Record<string, string> = !stacked
        ? {
          transitionProperty: "transform",
          transitionDuration: `${speed}ms`,
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        }
        : {};

      if (!stacked) {
        const pct = curIdx * trackOffsetPercent;
        const trans = isHorizontal
          ? `translateX(calc(-${pct}% + ${dragPx}px))`
          : `translateY(calc(-${pct}% + ${dragPx}px))`;
        return {
          ...trackBase,
          transform: trans,
          ...(dragging ? swipeDragTransitionNone : slideTrackTransition),
        };
      }

      const dragActive = dragPx !== 0 || dragging;
      const dragTransform = isHorizontal
        ? `translateX(${dragPx}px)`
        : `translateY(${dragPx}px)`;
      const stackedDragBlock = dragActive
        ? {
          transform: dragTransform,
          ...(dragging ? swipeDragTransitionNone : stackedSwipeSnapTransition),
        }
        : {};

      if (effectResolved === "flip") {
        return {
          ...trackBase,
          isolation: "isolate",
          perspective: "1000px",
          transformStyle: "preserve-3d",
          ...stackedDragBlock,
        };
      }
      return {
        ...trackBase,
        isolation: "isolate",
        ...stackedDragBlock,
      };
    };

    const slideImgOuterSlideModeClass = twMerge(
      "overflow-hidden bg-slate-200 dark:bg-slate-700 flex",
      "relative",
      isHorizontal && "h-full",
      slideClass,
    );

    const stackedZClass = (i: number, curIdx: number, under: number | null) =>
      i === curIdx
        ? "z-[3]"
        : under !== null && i === under
        ? "z-[2]"
        : "z-0 pointer-events-none";

    const slideChildSlideModeClass = twMerge(
      "flex items-center justify-center overflow-hidden",
      contentFitClass,
      "relative",
      isHorizontal && "h-full",
      slideClass,
    );

    /**
     * 层叠模式下行内样式；`effect` 为 slide 时不应调用（由 slide 模式 width/轨道负责）。
     *
     * @param i - slide 下标
     * @param curIdx - 当前页
     * @param under - 垫底层索引
     * @param hideMosaicActive - mosaic 播放中是否隐藏当前页真节点
     */
    const slideStackedStyle = (
      i: number,
      curIdx: number,
      under: number | null,
      hideMosaicActive: boolean,
    ) => {
      const er = readEffectResolved();
      const stackedKindForCss: CarouselStackedKind =
        er === "mosaic" && !useImages
          ? "fade"
          : carouselIsStackedEffect(er)
          ? er
          : "fade";
      if (!carouselIsStackedEffect(er)) {
        return {
          ...carouselStackedSlideLayoutStyle,
        };
      }
      return {
        ...carouselStackedSlideLayoutStyle,
        ...carouselStackedSlideStyle(
          stackedKindForCss,
          i,
          curIdx,
          under,
          speed,
          stackedKindForCss === "mosaic" && hideMosaicActive,
        ),
      };
    };

    if (reactiveBrowser) {
      return (
        <div
          key="@dreamer/carousel-track"
          ref={(el: HTMLElement | null) => {
            carouselTrackMountRef.current = el;
          }}
          data-carousel-track-root=""
          class={() => {
            void randomEffectPickRef.value;
            const st = readLayoutStacked();
            return twMerge(
              !st &&
                (isHorizontal ? "flex h-full min-h-0" : "flex flex-col h-full"),
              st && "h-full w-full relative",
              !st && "will-change-transform",
            );
          }}
          style={() => mergeTrackStyle(readCur())}
          data-current={() => String(readCur())}
          data-effect={() => {
            void randomEffectPickRef.value;
            return readEffectResolved();
          }}
        >
          {useImages
            ? imagesList!.map((src, i) => (
              <div
                key={src}
                data-carousel-slide={String(i)}
                class={() => {
                  void randomEffectPickRef.value;
                  const st = readLayoutStacked();
                  const cur = readCur();
                  const under = readUnderlay();
                  if (st) {
                    return twMerge(
                      "overflow-hidden bg-slate-200 dark:bg-slate-700 flex",
                      isHorizontal && "h-full",
                      stackedZClass(i, cur, under),
                      slideClass,
                    );
                  }
                  return slideImgOuterSlideModeClass;
                }}
                style={() => {
                  void randomEffectPickRef.value;
                  if (readLayoutStacked()) {
                    return slideStackedStyle(
                      i,
                      readCur(),
                      readUnderlay(),
                      readEffectResolved() === "mosaic" &&
                        mosaicSuppressActiveRef.value,
                    );
                  }
                  return slideStyleSlideMode;
                }}
                role="img"
                aria-label=""
              >
                <div
                  class="w-full h-full min-w-0 min-h-0 flex-1"
                  data-carousel-slide-inner=""
                >
                  {
                    /*
                     * lazySlides：禁止 `{() => 占位 | <Image/>}` 二选一子树——`insert` 会在切换时用 replaceChild 换掉节点，
                     * 与层叠 fade 的 opacity 过渡冲突。改为**同一 `<img>`**，仅用 `src` 零参函数在「可加载邻页」时赋真实 URL，其余为空串不请求。
                     */
                  }
                  {!lazySlides
                    ? (
                      <img
                        src={src}
                        alt=""
                        draggable={false}
                        class={carouselNativeImgClass(contentFit)}
                        loading="eager"
                        referrerPolicy="no-referrer"
                        onDragStart={(e: Event) => {
                          e.preventDefault();
                        }}
                        onError={(ev: Event) => {
                          const el = ev.currentTarget as HTMLImageElement;
                          if (el.dataset.carouselFb === "1") return;
                          el.dataset.carouselFb = "1";
                          el.src = IMAGE_BUILTIN_FALLBACK_SRC;
                        }}
                      />
                    )
                    : (
                      <img
                        src={() => isSlideActiveFor(readCur(), i) ? src : ""}
                        alt=""
                        draggable={false}
                        class={carouselNativeImgClass(contentFit)}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        aria-hidden={() => !isSlideActiveFor(readCur(), i)}
                        onDragStart={(e: Event) => {
                          e.preventDefault();
                        }}
                        onError={(ev: Event) => {
                          const el = ev.currentTarget as HTMLImageElement;
                          if (el.dataset.carouselFb === "1") return;
                          el.dataset.carouselFb = "1";
                          el.src = IMAGE_BUILTIN_FALLBACK_SRC;
                        }}
                      />
                    )}
                </div>
              </div>
            ))
            : slides.map((slide, i) => (
              <div
                key={i}
                data-carousel-slide={String(i)}
                class={() => {
                  void randomEffectPickRef.value;
                  const st = readLayoutStacked();
                  const cur = readCur();
                  const under = readUnderlay();
                  if (st) {
                    return twMerge(
                      "flex items-center justify-center overflow-hidden",
                      contentFitClass,
                      slideClass,
                      stackedZClass(i, cur, under),
                    );
                  }
                  return slideChildSlideModeClass;
                }}
                style={() => {
                  void randomEffectPickRef.value;
                  if (readLayoutStacked()) {
                    return slideStackedStyle(
                      i,
                      readCur(),
                      readUnderlay(),
                      false,
                    );
                  }
                  return slideStyleSlideMode;
                }}
              >
                {slide}
              </div>
            ))}
        </div>
      );
    }

    const effectForStatic = carouselResolveRenderEffect(
      props,
      randomEffectPickRef.value,
    );
    const isStackedStatic = carouselIsStackedEffect(effectForStatic);
    const stackedKindStatic: CarouselStackedKind =
      effectForStatic === "mosaic" && !useImages
        ? "fade"
        : carouselIsStackedEffect(effectForStatic)
        ? effectForStatic
        : "fade";

    const trackClassNameStatic = twMerge(
      !isStackedStatic &&
        (isHorizontal ? "flex h-full min-h-0" : "flex flex-col h-full"),
      isStackedStatic && "h-full w-full relative",
      !isStackedStatic && "will-change-transform",
    );

    const slideImgOuterStaticClass = twMerge(
      "overflow-hidden bg-slate-200 dark:bg-slate-700 flex",
      !isStackedStatic && "relative",
      isHorizontal && !isStackedStatic && "h-full",
      slideClass,
    );

    const slideChildStaticClass = twMerge(
      "flex items-center justify-center overflow-hidden",
      contentFitClass,
      !isStackedStatic && "relative",
      isHorizontal && !isStackedStatic && "h-full",
      slideClass,
    );

    /**
     * SSR 快照用层叠行内样式（无 `random` 订阅，读 signal 当前值即可）。
     */
    const slideStackedStyleStatic = (
      i: number,
      curIdx: number,
      under: number | null,
      hideMosaicActive: boolean,
    ) => {
      if (!carouselIsStackedEffect(effectForStatic)) {
        return {
          ...carouselStackedSlideLayoutStyle,
        };
      }
      return {
        ...carouselStackedSlideLayoutStyle,
        ...carouselStackedSlideStyle(
          stackedKindStatic,
          i,
          curIdx,
          under,
          speed,
          stackedKindStatic === "mosaic" && hideMosaicActive,
        ),
      };
    };

    const cur0 = readCur();
    const u0 = readUnderlay();
    return (
      <div
        key="@dreamer/carousel-track"
        class={trackClassNameStatic}
        style={mergeTrackStyle(cur0)}
        data-current={String(cur0)}
        data-effect={effectForStatic}
      >
        {useImages
          ? imagesList!.map((src, i) => (
            <div
              key={src}
              data-carousel-slide={String(i)}
              class={twMerge(
                slideImgOuterStaticClass,
                isStackedStatic && stackedZClass(i, cur0, u0),
              )}
              style={isStackedStatic
                ? slideStackedStyleStatic(i, cur0, u0, false)
                : slideStyleSlideMode}
              role="img"
              aria-label=""
            >
              <div
                class="w-full h-full min-w-0 min-h-0 flex-1"
                data-carousel-slide-inner=""
              >
                {!lazySlides
                  ? (
                    <img
                      src={src}
                      alt=""
                      draggable={false}
                      class={carouselNativeImgClass(contentFit)}
                      loading="eager"
                      referrerPolicy="no-referrer"
                      onDragStart={(e: Event) => {
                        e.preventDefault();
                      }}
                      onError={(ev: Event) => {
                        const el = ev.currentTarget as HTMLImageElement;
                        if (el.dataset.carouselFb === "1") return;
                        el.dataset.carouselFb = "1";
                        el.src = IMAGE_BUILTIN_FALLBACK_SRC;
                      }}
                    />
                  )
                  : (
                    <img
                      src={isSlideActiveFor(cur0, i) ? src : ""}
                      alt=""
                      draggable={false}
                      class={carouselNativeImgClass(contentFit)}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      aria-hidden={!isSlideActiveFor(cur0, i)}
                      onDragStart={(e: Event) => {
                        e.preventDefault();
                      }}
                      onError={(ev: Event) => {
                        const el = ev.currentTarget as HTMLImageElement;
                        if (el.dataset.carouselFb === "1") return;
                        el.dataset.carouselFb = "1";
                        el.src = IMAGE_BUILTIN_FALLBACK_SRC;
                      }}
                    />
                  )}
              </div>
            </div>
          ))
          : slides.map((slide, i) => (
            <div
              key={i}
              data-carousel-slide={String(i)}
              class={twMerge(
                slideChildStaticClass,
                isStackedStatic && stackedZClass(i, cur0, u0),
              )}
              style={isStackedStatic
                ? slideStackedStyleStatic(i, cur0, u0, false)
                : slideStyleSlideMode}
            >
              {slide}
            </div>
          ))}
      </div>
    );
  };

  const {
    direction: rootDirection = "horizontal",
    height: rootHeightProp,
    class: rootClassName,
  } = props;
  const rootIsHorizontal = rootDirection === "horizontal";
  const rootDefaultHeightClass = rootIsHorizontal ? "h-48" : "h-64";
  const rootContainerStyle = rootHeightProp
    ? { height: rootHeightProp }
    : undefined;
  /** 开启滑动时：横向轮播用 `pan-y` 把竖滑交给页面，横向由指针逻辑切页；纵向轮播反之 */
  const swipeOn = props.swipe !== false;
  const rootSwipeTouchClass = swipeOn
    ? (rootIsHorizontal ? "touch-pan-y select-none" : "touch-pan-x select-none")
    : "";

  const rootDivClass = twMerge(
    "carousel group relative overflow-hidden box-border shrink-0 w-full",
    rootSwipeTouchClass,
    !rootHeightProp && rootDefaultHeightClass,
    rootClassName,
  );

  const { count: rootCount } = carouselSlidesInfo(props);
  const showArrows = (props.arrows ?? true) && rootCount > 1;
  const showDots = (props.dots ?? true) && rootCount > 1;

  /**
   * 左右箭头三级透明度：默认更淡；鼠标在轮播区域内时 `group-hover` 略提亮；指在圆形按钮上、键盘聚焦或触摸时用 `!opacity` 盖过 group，保证完全不透明。
   */
  const arrowBtnClass =
    "absolute top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center z-20 shadow-md border border-white/20 opacity-20 group-hover:opacity-50 hover:!opacity-100 focus-visible:!opacity-100 active:!opacity-100 transition-[opacity,background-color] duration-200 ease-out";

  const dotPosition = props.dotPosition ?? "bottom";
  const dotsWrapClass = twMerge(
    "absolute flex gap-2 z-20 items-center",
    dotPosition === "bottom" && "bottom-4 left-1/2 -translate-x-1/2",
    dotPosition === "top" && "top-4 left-1/2 -translate-x-1/2",
    dotPosition === "left" &&
      "left-4 top-1/2 -translate-y-1/2 flex-col",
    dotPosition === "right" &&
      "right-4 top-1/2 -translate-y-1/2 flex-col",
  );

  /**
   * 指示点：与轨道相同策略，浏览器用 `class`/`aria-current` 的函数绑定，避免 `{() => 整段 div}` 换节点。
   *
   * @param reactiveBrowser - 是否使用函数型 prop
   */
  const buildCarouselDots = (reactiveBrowser: boolean) => {
    if (!showDots || rootCount <= 1) return null;
    if (reactiveBrowser) {
      return (
        <div key="@dreamer/carousel-dots" class={dotsWrapClass}>
          {Array.from({ length: rootCount }, (_, i) => (
            <button
              key={i}
              type="button"
              class={() => {
                const cur = carouselResolveCurrentIndex(
                  props,
                  internalIndexRef.value,
                  rootCount,
                );
                return twMerge(
                  "rounded-full transition-all duration-200 shrink-0",
                  i === cur
                    ? "w-6 h-2 bg-white dark:bg-white/90 shadow"
                    : "w-2 h-2 bg-white/50 hover:bg-white/70 dark:bg-white/40 dark:hover:bg-white/60",
                );
              }}
              onClick={() => {
                resetAutoplay();
                goToIndex(i);
              }}
              aria-label={`第 ${i + 1} 张`}
              aria-current={() => {
                const cur = carouselResolveCurrentIndex(
                  props,
                  internalIndexRef.value,
                  rootCount,
                );
                return i === cur ? "true" : undefined;
              }}
            />
          ))}
        </div>
      );
    }
    const cur0 = carouselResolveCurrentIndex(
      props,
      internalIndexRef.value,
      rootCount,
    );
    return (
      <div key="@dreamer/carousel-dots" class={dotsWrapClass}>
        {Array.from({ length: rootCount }, (_, i) => (
          <button
            key={i}
            type="button"
            class={twMerge(
              "rounded-full transition-all duration-200 shrink-0",
              i === cur0
                ? "w-6 h-2 bg-white dark:bg-white/90 shadow"
                : "w-2 h-2 bg-white/50 hover:bg-white/70 dark:bg-white/40 dark:hover:bg-white/60",
            )}
            onClick={() => {
              resetAutoplay();
              goToIndex(i);
            }}
            aria-label={`第 ${i + 1} 张`}
            aria-current={i === cur0 ? "true" : undefined}
          />
        ))}
      </div>
    );
  };

  /**
   * 根容器 ref：供滑动 `createEffect` 绑定；浏览器下挂载后 bump `carouselRootMountTick`。
   */
  const setCarouselRootRef = (el: HTMLElement | null) => {
    carouselRootRef.current = el;
    if (getDocument() != null) {
      carouselRootMountTick((t) => t + 1);
    }
  };

  if (getDocument() != null) {
    return (
      <div
        class={rootDivClass}
        style={rootContainerStyle}
        ref={setCarouselRootRef}
      >
        {buildCarouselTrackElement(true)}
        {showArrows
          ? (
            <button
              type="button"
              key="@dreamer/carousel-prev"
              class={twMerge(arrowBtnClass, "left-2")}
              onClick={() => {
                resetAutoplay();
                goRef.current(-1);
              }}
              aria-label="上一张"
            >
              <IconChevronLeft class="w-5 h-5" />
            </button>
          )
          : null}
        {showArrows
          ? (
            <button
              type="button"
              key="@dreamer/carousel-next"
              class={twMerge(arrowBtnClass, "right-2")}
              onClick={() => {
                resetAutoplay();
                goRef.current(1);
              }}
              aria-label="下一张"
            >
              <IconChevronRight class="w-5 h-5" />
            </button>
          )
          : null}
        {buildCarouselDots(true)}
      </div>
    );
  }
  return (
    <div
      class={rootDivClass}
      style={rootContainerStyle}
      ref={setCarouselRootRef}
    >
      {buildCarouselTrackElement(false)}
      {showArrows
        ? (
          <button
            type="button"
            key="@dreamer/carousel-prev"
            class={twMerge(arrowBtnClass, "left-2")}
            onClick={() => {
              resetAutoplay();
              goRef.current(-1);
            }}
            aria-label="上一张"
          >
            <IconChevronLeft class="w-5 h-5" />
          </button>
        )
        : null}
      {showArrows
        ? (
          <button
            type="button"
            key="@dreamer/carousel-next"
            class={twMerge(arrowBtnClass, "right-2")}
            onClick={() => {
              resetAutoplay();
              goRef.current(1);
            }}
            aria-label="下一张"
          >
            <IconChevronRight class="w-5 h-5" />
          </button>
        )
        : null}
      {buildCarouselDots(false)}
    </div>
  );
}
