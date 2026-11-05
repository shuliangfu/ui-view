/**
 * @module shared/data-display/carousel-effects
 * @description Carousel 切换效果、马赛克与层叠样式辅助。
 */

import { twMerge } from "tailwind-merge";
import {
  carouselSlidesInfo,
  type CarouselConcreteTransitionEffect,
  type CarouselProps,
  type CarouselTransitionEffect,
} from "./carousel-types.ts";

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
export function carouselPickRandomConcreteEffect(
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
export function carouselResolveRenderEffect(
  p: CarouselProps,
  randomPick: CarouselConcreteTransitionEffect,
): CarouselConcreteTransitionEffect {
  const raw = (p.effect ?? "slide") as CarouselTransitionEffect;
  if (raw !== "random") return raw as CarouselConcreteTransitionEffect;
  return randomPick;
}

/** 层叠位效果子集（与 {@link carouselIsStackedEffect} 一致） */
export type CarouselStackedKind = "fade" | "zoom" | "flip" | "mosaic";

/**
 * 层叠模式下每一页必须叠在同一矩形内；若仍为 `relative` 块级流式排列，多页会纵向堆高，
 * 在 `overflow:hidden` 的轨道里只能看到错误一截（空白、压住指示点、上下错位等）。
 */
export const carouselStackedSlideLayoutStyle: Record<string, string | number> = {
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
export function carouselIsStackedEffect(
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
export const CAROUSEL_MOSAIC_COLS = 8;
export const CAROUSEL_MOSAIC_ROWS = 6;
export const CAROUSEL_MOSAIC_CELL_MS = 260;
export const CAROUSEL_MOSAIC_STAGGER_MS = 14;

/**
 * 移除轨道上 `mosaic` 叠层，避免换图或改 `effect` 后残留方格。
 *
 * @param mount - 轨道根节点（`data-carousel-track-root`）；SSR / 虚拟节点上可能无 DOM API，需跳过。
 */
export function carouselRemoveMosaicOverlays(
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
export function carouselPrefersReducedMotion(): boolean {
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
export function carouselObjectFitDrawRect(
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
export function carouselSameResourceUrl(a: string, b: string): boolean {
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
export function carouselMosaicInnerContentBoxInTrack(
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
export function carouselNativeImgClass(
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
export type CarouselStackedSlideRole = "active" | "underlay" | "hidden";

/**
 * 解析层叠模式下第 `i` 张的角色。
 *
 * @param i - slide 下标
 * @param cur - 当前页
 * @param underlayIdx - 过渡期内垫在下面的上一页；`null` 表示无过渡
 */
export function carouselStackedSlideRoleOf(
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
export function carouselStackedSlideAnimatedStyle(
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
export function carouselStackedSlideStyle(
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

