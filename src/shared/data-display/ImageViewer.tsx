/**
 * ImageViewer 图片查看器（View）。
 * 全屏遮罩内大图查看：多图切换、缩放、旋转、拖动平移、缩略图、键盘与遮罩关闭。
 * **变换分层**：平移在外层（无 transition、拖动跟手）；缩放/旋转在内层（CSS transition，工具栏操作有过渡）。
 * 归属数据展示，与 Image 并列。
 *
 * **打开态与 {@link Modal} 对齐**：`open` 支持 `boolean`、零参 getter 或 **`Signal<boolean>`**（`createSignal` 返回值，推荐 `open={sig}`），
 * 勿仅依赖 `open={sig.value}` 在 Hybrid/函数槽 patch 下可能不触发子树更新。
 * **全屏壳**：`fixed inset-0` **内联**挂在父级 VNode 树下（**不用** `createPortal`），避免与 `insert`/调度器叠床架屋导致卡死；若业务里父级带 `transform` 或强裁剪，请把本组件挪到不受裁切的容器（如布局根部）。
 * **关闭态**：有真实 `document.body` 时返回隐藏 `span` 占槽（与 {@link Modal}、Hybrid 约定一致）；无 `body`（纯 SSR）时关闭为 `null`。
 * 勿在组件顶层 `open === false` 时提前 `return` 跳过 `createEffect`/`createRenderEffect` 注册。
 * **根返回值**：与 `view/examples` 相册一致，用 {@link Show} 包一层 `when={isOpen}`，勿再 `return () => …` 整段 getter（易与父级 `insert` 的响应式子叠出卡死）；缩放/平移用 {@link createMemo} + `style`（同相册 `previewStyle`），勿用 `createRenderEffect` 写 `ref.style`。
 * **勿在根 getter 里读 `currentIndex` / 主图 `src`**：否则每次切图整棵 `fixed` 壳重算，主图与缩略图会一起闪断；主图/缩略条/张数指示应挂在占位节点上，由 **JSX 函数子**（`{() => …}`，运行时与 `insert` 同源）单独订阅，避免与外壳同一渲染节拍。
 * **为何单 `img` 改 `src` 会「先空再出」**：浏览器在赋值新 URL 后会立刻释放旧位图，新图未 `load/decode` 前没有像素可画；主图用双缓冲预载到底层再切换叠放。缩略条若 getter 订阅了当前索引，会整行 DOM 重挂载，小图也会闪；结构只跟列表走、高亮单独改 `class`。
 * **换图动画**：由 {@link ImageViewerProps.transition} 指定，见 {@link ImageViewerTransition}；双缓冲预载后播放，系统「减少动态效果」时一律瞬时切层。
 */

import {
  createEffect,
  createMemo,
  createRef,
  createSignal,
  isSignal,
  type JSXRenderable,
  onCleanup,
  Show,
  type Signal,
  untrack,
} from "@dreamer/view";
import { twMerge } from "tailwind-merge";
/** 按需：单文件图标，避免经 icons/mod 拉入全表 */
import { IconChevronLeft } from "../basic/icons/ChevronLeft.tsx";
import { IconChevronRight } from "../basic/icons/ChevronRight.tsx";
import { IconClose } from "../basic/icons/Close.tsx";
import { IconRotateCcw } from "../basic/icons/RotateCcw.tsx";
import { IconRotateCw } from "../basic/icons/RotateCw.tsx";
import { IconZoomIn } from "../basic/icons/ZoomIn.tsx";
import { IconZoomOut } from "../basic/icons/ZoomOut.tsx";
import { getBrowserBodyPortalHost } from "../feedback/portal-host.ts";

/** `open` 合法形态：布尔快照、`Signal<boolean>`、或返回 boolean 的零参 getter */
export type ImageViewerOpenInput =
  | boolean
  | (() => boolean)
  | Signal<boolean>;

/** `currentIndex` 受控时的合法形态：数字快照、`Signal<number>`、或返回 number 的零参 getter */
export type ImageViewerIndexInput = number | (() => number) | Signal<number>;

/**
 * 主图切换效果（双缓冲解码完成后再播，避免闪黑）。
 *
 * - **`none`**：无动画，瞬时换层。
 * - **`fade`**（默认）：新图在上叠化渐入，旧图在下保持不透明。
 * - **`slide`**：新图从一侧平移入、旧图反向移出（环形列表按最短弧决定方向）。
 * - **`blur`**：新图在上，自 **强模糊 + 透明** 过渡到清晰（与 `slide` 的纯位移完全不同）。
 * - **`zoom`**：新图自略小尺寸放大并渐入。
 * - **`mosaic`**：新图按 **小方格网格** 分块渐入（随机顺序），旧图仍在下层直至叠层结束。
 */
export type ImageViewerTransition =
  | "none"
  | "fade"
  | "slide"
  | "blur"
  | "zoom"
  | "mosaic";

/**
 * 旧类型名，等价于 {@link ImageViewerTransition}，保留以兼容既有 import。
 *
 * @deprecated 请改用 {@link ImageViewerTransition}
 */
export type ImageViewerImageTransition = ImageViewerTransition;

/**
 * `transition` 合法形态：枚举字面量、`Signal<ImageViewerTransition>`、或返回枚举的零参 getter（与 `open` 一致便于受控）。
 */
export type ImageViewerTransitionInput =
  | ImageViewerTransition
  | (() => ImageViewerTransition)
  | Signal<ImageViewerTransition>;

/**
 * 解析 `open` prop（在 {@link createMemo} 内调用以订阅 `Signal` / getter）。
 *
 * @param v - {@link ImageViewerProps.open}
 */
function readImageViewerOpenInput(
  v: ImageViewerOpenInput | undefined,
): boolean {
  if (v === undefined) return false;
  /** 用无参调用与 `.value` 等价且兼容解构出的 getter（getter 无 `.value` 属性）。 */
  if (isSignal(v)) return !!(v as () => boolean)();
  if (typeof v === "function") {
    if ((v as () => unknown).length !== 0) return false;
    return !!(v as () => boolean)();
  }
  return !!v;
}

/**
 * 解析受控 `currentIndex`（在 {@link createMemo} 内调用以订阅 `Signal` / getter）。
 *
 * @param v - {@link ImageViewerProps.currentIndex}（已排除 `undefined`）
 */
function readImageViewerIndexInput(v: ImageViewerIndexInput): number {
  let n: number;
  /** 同 {@link readImageViewerOpenInput}：解构 getter 须用 `()` 追踪。 */
  if (isSignal(v)) n = Number((v as () => number)());
  else if (typeof v === "function") {
    if ((v as () => unknown).length !== 0) return 0;
    n = Number((v as () => number)());
  } else {
    n = Number(v);
  }
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

/**
 * 解析 `transition` prop（在 {@link createMemo} 内调用以订阅 `Signal` / getter）。
 *
 * @param v - {@link ImageViewerProps.transition}
 */
function readImageViewerTransitionInput(
  v: ImageViewerTransitionInput | undefined,
): ImageViewerTransition {
  if (v === undefined) return "fade";
  if (isSignal(v)) {
    return (v as () => ImageViewerTransition)() as ImageViewerTransition;
  }
  if (typeof v === "function") {
    if ((v as () => unknown).length !== 0) return "fade";
    return (v as () => ImageViewerTransition)();
  }
  return v;
}

/**
 * 比较 `img` 的 `src` 属性与列表 URL 是否同一资源（预载双缓冲切换前判断「已是当前图」）。
 *
 * @param attrOrResolved - `getAttribute("src")` 或完整 URL
 * @param listUrl - `images` 列表中的字符串
 */
function viewerUrlsMatch(attrOrResolved: string, listUrl: string): boolean {
  if (attrOrResolved === listUrl) return true;
  try {
    const base = typeof globalThis.location !== "undefined"
      ? globalThis.location.href
      : "http://localhost/";
    return new URL(attrOrResolved, base).href === new URL(listUrl, base).href;
  } catch {
    return false;
  }
}

/**
 * 将任意整数下标映射到 `[0, length - 1]`，用于多图时左右切换首尾相接。
 *
 * @param index - 偏移后的下标（可为负）
 * @param length - 图片张数，须 ≥ 1
 * @returns 合法环形下标
 */
function wrapImageListIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  const m = index % length;
  return m < 0 ? m + length : m;
}

/**
 * 环形索引上从前一张到当前张的滑动方向（最短弧），用于横向切换时新图从哪一侧进入。
 *
 * @param prev - 上一张已稳定展示的索引
 * @param next - 当前要展示的索引
 * @param len - 列表长度（≥1）
 * @returns `1` 表示顺延方向（新图从右侧进入），`-1` 表示逆序（新图从左侧进入）
 */
function viewerSlideDirection(prev: number, next: number, len: number): 1 | -1 {
  if (len <= 1) return 1;
  let forward = next - prev;
  if (forward > len / 2) forward -= len;
  if (forward < -len / 2) forward += len;
  return forward >= 0 ? 1 : -1;
}

/**
 * 在存在真实 `document.body` 时设置 `overflow`，避免滚动穿透。
 *
 * @param overflow - CSS overflow 值
 */
function trySetDocumentBodyOverflow(overflow: string): void {
  try {
    if (typeof globalThis.document === "undefined") return;
    const b = globalThis.document.body;
    if (b == null || b.nodeType !== 1) return;
    b.style.overflow = overflow;
  } catch {
    /* 非浏览器 */
  }
}

/**
 * 在容器上按下指针（鼠标主键 / 触摸 / 笔）后拖动平移。
 * 使用 `setPointerCapture`，移出元素边界仍能收到 `pointermove`。
 *
 * @param getPosition - 当前平移量
 * @param setPosition - 写入新平移量
 */
function useImagePan(
  getPosition: () => { x: number; y: number },
  setPosition: (v: { x: number; y: number }) => void,
) {
  return (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const target = e.currentTarget;
    if (!(target instanceof HTMLElement)) return;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      return;
    }
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = getPosition();
    const onMove = (ev: PointerEvent) => {
      setPosition({
        x: startPos.x + ev.clientX - startX,
        y: startPos.y + ev.clientY - startY,
      });
    };
    const onUp = (ev: PointerEvent) => {
      try {
        target.releasePointerCapture(ev.pointerId);
      } catch {
        /* 已释放或非 capture 目标 */
      }
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", onUp);
      target.removeEventListener("pointercancel", onUp);
    };
    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerup", onUp);
    target.addEventListener("pointercancel", onUp);
  };
}

export interface ImageViewerProps {
  /**
   * 是否打开（受控）。
   * 推荐 `open={createSignal 的容器}` 或 `open={() => sig.value}`；与 Modal 一致，避免仅 `open={sig.value}` 在 patch 下不更新。
   */
  open?: ImageViewerOpenInput;
  /** 关闭回调 */
  onClose?: () => void;
  /** 图片列表（单张传 string 或 string[]） */
  images: string | string[];
  /**
   * 当前展示的索引（受控，不传则内部用 defaultIndex）。
   * 推荐 `currentIndex={sig}` 或 `currentIndex={() => sig.value}`，与 `open` 同理避免仅传 `.value` 时子树不更新。
   */
  currentIndex?: ImageViewerIndexInput;
  /** 默认展示的索引（非受控时生效） */
  defaultIndex?: number;
  /** 当前索引变化回调 */
  onIndexChange?: (index: number) => void;
  /** 点击遮罩是否关闭，默认 true */
  maskClosable?: boolean;
  /** 是否支持 Esc 关闭、左右键切换，默认 true */
  keyboard?: boolean;
  /** 是否显示底部缩略图，默认 true（多图时） */
  showThumbnails?: boolean;
  /** 遮罩层 class（默认与壳内叠层合并为较深半透明黑，传此项可覆盖或追加） */
  maskClass?: string;
  /** 内容区 class */
  class?: string;
  /**
   * 主图切换动画，默认 `fade`；可选 `none` / `slide` / `blur` / `zoom` / `mosaic`。
   * 支持字面量、`Signal` 或零参 getter（推荐 `transition={sig}`），与 `open` 一致。
   */
  transition?: ImageViewerTransitionInput;
}

const MIN_SCALE = 0.25;
const MAX_SCALE = 4;
const SCALE_STEP = 0.25;
const ROTATE_STEP = 90;

/** 全屏层 z-index，高于文档站顶栏 z-50 与 Modal 内容区 */
const IMAGE_VIEWER_Z = 1050;

/**
 * 主图叠化时长（毫秒）：略长以便肉眼分辨叠化；新图在上 `opacity 0→1` 盖在旧图之上，旧图保持不透明以免透出黑底。
 */
const VIEWER_MAIN_CROSSFADE_MS = 420;
/** 横向滑动切换时长（毫秒） */
const VIEWER_MAIN_SLIDE_MS = 280;
/** 缩放切入时长（毫秒） */
const VIEWER_MAIN_ZOOM_MS = 260;
/** 模糊渐入：滤镜 + 透明度时长（毫秒） */
const VIEWER_MAIN_BLUR_MS = 420;
/** 模糊渐入起始 `blur()` 半径（px），需与 `slide` 区分明显 */
const VIEWER_BLUR_START_PX = 18;
/** 打开查看器时离屏预取的最大张数，避免超长列表占满带宽 */
const VIEWER_PREFETCH_MAX = 32;
/** 马赛克切换：网格列数、行数 */
const VIEWER_MOSAIC_COLS = 8;
const VIEWER_MOSAIC_ROWS = 6;
/** 单格 opacity 过渡时长（毫秒） */
const VIEWER_MOSAIC_CELL_MS = 260;
/** 随机顺序下相邻「批次」间隔（毫秒），控制整体时长 */
const VIEWER_MOSAIC_STAGGER_MS = 14;

/**
 * 移除主图容器上 `mosaic` 效果留下的临时叠层（`data-dreamer-image-viewer-mosaic`），避免换图或换 `transition` 后残留方格。
 *
 * @param mount - {@link ImageViewer} 主图挂载节点，可为 `null`
 */
function viewerRemoveMosaicOverlays(
  mount: HTMLElement | null | undefined,
): void {
  if (mount == null) return;
  mount.querySelectorAll("[data-dreamer-image-viewer-mosaic]").forEach((el) => {
    el.remove();
  });
}

/**
 * 计算与 `object-fit: contain` 一致时，位图在容器内的绘制尺寸与左上角偏移（主图 `img` 与此对齐）。
 *
 * @param containerW - 容器内容宽度（如 `clientWidth`）
 * @param containerH - 容器内容高度
 * @param naturalW - 已解码图片的 `naturalWidth`；无效时按容器宽回退
 * @param naturalH - 已解码图片的 `naturalHeight`；无效时按容器高回退
 */
function viewerObjectContainRect(
  containerW: number,
  containerH: number,
  naturalW: number,
  naturalH: number,
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
  const s = Math.min(cw / iw, ch / ih);
  const drawW = iw * s;
  const drawH = ih * s;
  const offX = (cw - drawW) / 2;
  const offY = (ch - drawH) / 2;
  return { drawW, drawH, offX, offY };
}

/**
 * 是否应减弱动效（系统「减少动态效果」）。
 */
function viewerImagePrefersReducedMotion(): boolean {
  try {
    return globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")
      ?.matches === true;
  } catch {
    return false;
  }
}

export function ImageViewer(props: ImageViewerProps): JSXRenderable {
  const {
    onClose,
    defaultIndex: defaultIndexProp = 0,
    showThumbnails = true,
    maskClass,
    class: className,
  } = props;

  /**
   * 主图切换效果：订阅 `Signal` / getter，与 {@link ImageViewerProps.open} 用法一致。
   */
  const resolvedTransition = createMemo(() =>
    readImageViewerTransitionInput(props.transition)
  );

  /**
   * 禁止在 `open === false` 时提前 return：须无条件注册副作用（如 body overflow），
   * 否则首帧关闭后 `open` 变为 true 时无法恢复预期行为（与 Modal 相同根因）。
   */
  const isOpen = createMemo(() => readImageViewerOpenInput(props.open));

  const imageList = createMemo(() => {
    const im = props.images;
    return Array.isArray(im) ? im : [im];
  });

  const internalIndexRef = createSignal(defaultIndexProp);

  /**
   * 受控模式下从 `currentIndex` 解析出的索引；未传 `currentIndex` 时为 `undefined`（在 memo 内订阅 `Signal` / getter）。
   */
  const resolvedControlledIndex = createMemo((): number | undefined => {
    if (props.currentIndex === undefined) return undefined;
    return readImageViewerIndexInput(props.currentIndex);
  });

  /**
   * 当前展示索引：受控读 {@link resolvedControlledIndex}，否则读内部 signal。
   */
  const getDisplayIndex = (): number => {
    const list = imageList();
    if (list.length === 0) return 0;
    const ci = resolvedControlledIndex();
    if (ci !== undefined) {
      return Math.max(0, Math.min(ci, list.length - 1));
    }
    return Math.max(0, Math.min(internalIndexRef.value, list.length - 1));
  };

  /**
   * 设置当前索引：非受控时写内部 signal，并始终通知 `onIndexChange`。
   *
   * @param i - 目标下标
   */
  const setDisplayIndex = (i: number) => {
    const list = imageList();
    if (list.length === 0) return;
    const next = Math.max(0, Math.min(i, list.length - 1));
    if (props.currentIndex === undefined) internalIndexRef.value = next;
    props.onIndexChange?.(next);
  };

  const scaleRef = createSignal(1);
  /**
   * 累积旋转角度（度），**不对 360 取模**：`transition-transform` 在线性插值 `rotate(a)`→`rotate(b)` 时按数值差过渡；
   * 若用 `[0,360)` 存角（如 0→270 表示逆时针 90°），浏览器会动画 270° 大圈。用 ±90 累加则首次逆时针为 0→-90，过渡正确。
   */
  const rotationRef = createSignal(0);
  const positionRef = createSignal({ x: 0, y: 0 });

  /**
   * 外层：仅 `translate`，与拖动平移绑定，**不设 transition**，避免拖拽跟手变「橡皮筋」。
   */
  const transformLayerRef = createRef<HTMLDivElement>(null);
  /**
   * 内层：仅 `scale` + `rotate`，带 CSS transition，工具栏放大/缩小/旋转有过渡；`pointer-events-none` 使点击穿透到外层以便拖移。
   */
  const transformInnerRef = createRef<HTMLDivElement>(null);

  /**
   * 是否多图：仅依赖列表长度；切索引时不变，避免根渲染 getter 因「当前张」变化而重算整壳。
   */
  const hasMultipleImages = createMemo(() => imageList().length > 1);

  /**
   * 主图 / 缩略条 / 顶栏张数 的占位节点：缩略条用 **JSX 函数子** 注入；主图由 ref + effect 写双缓冲，与外壳 DOM 解耦。
   */
  const mainImageMountRef = createRef<HTMLDivElement>(null);
  /** 主图双缓冲：预载到「隐藏」层，`decode` 后再切 `opacity/z-index`，避免单 `img` 改 `src` 时浏览器先清空旧位图 → 闪一下。 */
  const mainImg0Ref = createRef<HTMLImageElement>(null);
  const mainImg1Ref = createRef<HTMLImageElement>(null);
  const thumbnailStripMountRef = createRef<HTMLDivElement>(null);
  const viewerCounterMountRef = createRef<HTMLDivElement>(null);

  /**
   * 当前哪一层 `img` 为「顶」层（与 {@link mainImg0Ref} / {@link mainImg1Ref} 对应）；关闭时归零。
   */
  let mainViewTopSlot: 0 | 1 = 0;
  /** 快速连点切换时作废上一张的 `load/decode` 回调，避免错序 swap。 */
  let mainSwapGen = 0;
  /**
   * 上一次主图切换**完成**后的索引；用于 `slide` 在环形列表上算最短滑动方向。
   */
  let lastCommittedDisplayIndex: number | null = null;

  /**
   * 当前应展示的主图地址：打开且列表非空时取 {@link getDisplayIndex} 对应项，否则空串（不渲染 `img`）。
   */
  const displayImageSrc = createMemo(() => {
    if (!isOpen()) return "";
    const list = imageList();
    if (list.length === 0) return "";
    const idx = getDisplayIndex();
    return list[idx] ?? "";
  });

  /**
   * 外层平移样式：对齐 `view/examples/src/views/gallery` 的 `previewStyle`（memo + `style`），避免 `createRenderEffect` 写 `ref.style` 参与同步重入。
   */
  const viewerTranslateStyle = createMemo((): Record<string, string> => {
    if (!isOpen()) return {};
    const p = positionRef.value;
    return { transform: `translate(${p.x}px, ${p.y}px)` };
  });

  /**
   * 内层缩放/旋转样式；过渡由 class 上的 `transition-transform` 负责。
   */
  const viewerInnerTransformStyle = createMemo((): Record<string, string> => {
    if (!isOpen()) return {};
    const s = scaleRef.value;
    const r = rotationRef.value;
    return { transform: `scale(${s}) rotate(${r}deg)` };
  });

  /**
   * 顶栏「当前张 / 总张数」文案（多图时）；与相册示例一致走声明式文本，不用 `createRenderEffect` 写 `textContent`。
   */
  const viewerCounterText = createMemo(() => {
    if (!isOpen()) return "";
    const list = imageList();
    if (list.length <= 1) return "";
    return `${getDisplayIndex() + 1} / ${list.length}`;
  });

  /**
   * 打开期间，索引或同索引下的 URL 变化时重置缩放/旋转/平移，避免上一张的变换套在新图上。
   * 若当前非默认变换，先关掉内层 transition 再写回 1/0，避免换图时从旧缩放「动画弹回」。
   *
   * **死循环防范**：若在追踪上下文中读取 `scaleRef` / `rotationRef` / `positionRef` 随后又写入
   * （尤其 `positionRef` 每次 `={ x:0, y:0 }` 为新对象），effect 会订阅自身写入的 signal 而无限重跑。
   * 因此仅在外层订阅 `isOpen` 与 `displayImageSrc`，变换的读写在 {@link untrack} 内完成。
   */
  createEffect(() => {
    const open = isOpen();
    if (open) {
      /** 订阅当前主图 URL：切图或列表项变更时重跑以重置变换；关闭时不读，避免多余依赖。 */
      void displayImageSrc();
    }

    untrack(() => {
      if (!open) {
        scaleRef.value = 1;
        rotationRef.value = 0;
        positionRef.value = { x: 0, y: 0 };
        return;
      }

      const inner = transformInnerRef.current;
      const pos = positionRef.value;
      const needInstantReset = scaleRef.value !== 1 ||
        rotationRef.value !== 0 ||
        pos.x !== 0 ||
        pos.y !== 0;
      if (inner != null && needInstantReset) {
        inner.style.transition = "none";
        void inner.offsetWidth;
      }
      scaleRef.value = 1;
      rotationRef.value = 0;
      positionRef.value = { x: 0, y: 0 };
      if (inner != null && needInstantReset) {
        globalThis.queueMicrotask(() => {
          const el = transformInnerRef.current;
          if (el != null) el.style.removeProperty("transition");
        });
      }
    });
  });

  /**
   * 打开时锁定 `document.body` 滚动；关闭或卸载时恢复。
   */
  createEffect(() => {
    if (!isOpen()) {
      trySetDocumentBodyOverflow("");
      return;
    }
    trySetDocumentBodyOverflow("hidden");
    onCleanup(() => {
      trySetDocumentBodyOverflow("");
    });
  });

  /**
   * 上一张：首张时跳到末张（环形）。
   */
  const handlePrev = () => {
    const list = imageList();
    const len = list.length;
    if (len <= 1) return;
    setDisplayIndex(wrapImageListIndex(getDisplayIndex() - 1, len));
  };

  /**
   * 下一张：末张时跳回首张（环形）。
   */
  const handleNext = () => {
    const list = imageList();
    const len = list.length;
    if (len <= 1) return;
    setDisplayIndex(wrapImageListIndex(getDisplayIndex() + 1, len));
  };

  /** 函数式更新须用 `sig(fn)`：`Signal` 的 `.value` 在类型上仅为 `T`，与 setter 对齐 */
  const handleZoomIn = () =>
    scaleRef((s) => Math.min(MAX_SCALE, s + SCALE_STEP));
  const handleZoomOut = () =>
    scaleRef((s) => Math.max(MIN_SCALE, s - SCALE_STEP));
  /** 顺时针：累加角度，避免 `% 360` 导致与上一帧差值过大、过渡「甩圈」。 */
  const handleRotateCw = () => rotationRef((r) => r + ROTATE_STEP);
  /** 逆时针：同上，用减法保持每步仅 ±90° 的插值。 */
  const handleRotateCcw = () => rotationRef((r) => r - ROTATE_STEP);
  const handleResetTransform = () => {
    scaleRef.value = 1;
    rotationRef.value = 0;
    positionRef.value = { x: 0, y: 0 };
  };

  const handleImagePointerDown = useImagePan(
    () => positionRef.value,
    (v) => {
      positionRef.value = v;
    },
  );

  const handleMaskClick = (e: Event) => {
    if (e.target === e.currentTarget && (props.maskClosable ?? true)) {
      onClose?.();
    }
  };

  /**
   * 打开时在 document 上绑定键盘事件；依赖 {@link isOpen} 订阅。
   * **须用 {@link onCleanup} 解绑**：`@dreamer/view` 的 `createEffect` 不会执行回调的 `return` 清理，否则每关开一次就多一层监听，左右键一次会连跳多张。
   */
  createEffect(() => {
    if (!isOpen()) return;
    const doc = globalThis.document;
    if (!doc) return;
    const handler = (e: KeyboardEvent) => {
      if (!(props.keyboard ?? true)) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    };
    doc.addEventListener("keydown", handler as EventListener);
    onCleanup(() => {
      doc.removeEventListener("keydown", handler as EventListener);
    });
  });

  /**
   * 缩略条 DOM：**勿**在 getter 内读 {@link getDisplayIndex}，否则换张会整段重挂载、小图也会闪。
   * 高亮边框由单独的 `createEffect`（`queueMicrotask`）写 `className`，不随索引重挂载节点。
   */
  const renderThumbnailStripBody = () => {
    if (!showThumbnails) return null;
    const list = imageList();
    if (list.length <= 1) return null;
    return (
      <div class="flex justify-center gap-1.5 py-2 px-4 overflow-x-auto max-h-20 contain-layout">
        {list.map((src, i) => (
          <button
            type="button"
            key={`${src}-${i}`}
            data-idx={String(i)}
            aria-label={`第 ${i + 1} 张`}
            class="shrink-0 w-12 h-12 rounded overflow-hidden border-2 border-transparent opacity-60 pointer-events-auto"
            onClick={() => setDisplayIndex(i)}
          >
            <img
              src={src}
              alt=""
              class="w-full h-full object-cover"
              draggable={false}
            />
          </button>
        ))}
      </div>
    );
  };

  /**
   * 根据当前索引更新缩略按钮样式；用 `queueMicrotask` 排在 **函数子响应式插入** 挂载按钮之后执行，避免首帧选不到节点。
   */
  createEffect(() => {
    if (!isOpen()) return;
    const list = imageList();
    if (list.length <= 1) return;
    const idx = getDisplayIndex();
    /**
     * 优先同步写 class，与主图 effect 同一轮调度内尽量对齐；挂载未就绪时再微任务补一次。
     */
    const applyThumbHighlight = (): boolean => {
      const mount = thumbnailStripMountRef.current;
      if (mount == null) return false;
      mount.querySelectorAll<HTMLButtonElement>("button[data-idx]").forEach(
        (btn) => {
          const i = Number(btn.dataset.idx);
          if (!Number.isFinite(i)) return;
          btn.className = twMerge(
            "shrink-0 w-12 h-12 rounded overflow-hidden border-2 pointer-events-auto transition-[opacity,border-color] duration-200 ease-out",
            i === idx
              ? "border-teal-400 dark:border-teal-400 opacity-100"
              : "border-transparent opacity-60 hover:opacity-90",
          );
        },
      );
      return true;
    };
    if (!applyThumbHighlight()) {
      globalThis.queueMicrotask(applyThumbHighlight);
    }
  });

  /**
   * 打开后预取列表 URL（离屏 Image），与缩略条小图同源时常已在缓存，主图 hidden 层赋 `src` 后更快触发 `load`、与缩略高亮同步感更好。
   */
  createEffect(() => {
    if (!isOpen()) return;
    const list = imageList();
    if (list.length === 0) return;
    const slice = list.slice(0, VIEWER_PREFETCH_MAX);
    globalThis.queueMicrotask(() => {
      if (!isOpen()) return;
      for (let i = 0; i < slice.length; i++) {
        const url = slice[i];
        if (url == null || url === "") continue;
        const img = new Image();
        img.decoding = "async";
        img.src = url;
      }
    });
  });

  /**
   * 主图双缓冲：下一 URL 先写在「底」层 `img` 上解码，完成后再切换叠放，避免单图改 `src` 的中间空白帧。
   */
  createEffect(() => {
    if (!isOpen()) {
      mainSwapGen++;
      mainViewTopSlot = 0;
      lastCommittedDisplayIndex = null;
      const a = mainImg0Ref.current;
      const b = mainImg1Ref.current;
      if (a != null) {
        a.removeAttribute("src");
        a.style.transition = "none";
        a.style.transform = "";
        a.style.filter = "";
        a.style.opacity = "1";
        a.style.zIndex = "2";
      }
      if (b != null) {
        b.removeAttribute("src");
        b.style.transition = "none";
        b.style.transform = "";
        b.style.filter = "";
        b.style.opacity = "0";
        b.style.zIndex = "1";
      }
      return;
    }

    const next = displayImageSrc();
    /** 订阅 {@link resolvedTransition}，避免仅改 `transition` 时本 effect 不重跑。 */
    void resolvedTransition();

    /**
     * 首次打开时副作用可能早于 `<img>` 的 ref 回调：双缓冲节点仍为 `null` 时若直接 `return`，
     * 依赖未变则 effect 不会重跑，主图 `src` 永远不会被写入。用微任务有限重试，待 DOM 就绪后再同步。
     */
    let mainBufferSwapRetries = 0;
    const MAIN_BUFFER_SWAP_MAX_RETRIES = 64;
    const runMainBufferSwap = () => {
      if (!isOpen()) return;
      const a = mainImg0Ref.current;
      const b = mainImg1Ref.current;
      if (a == null || b == null) {
        if (mainBufferSwapRetries < MAIN_BUFFER_SWAP_MAX_RETRIES) {
          mainBufferSwapRetries++;
          globalThis.queueMicrotask(runMainBufferSwap);
        }
        return;
      }

      if (next === "") {
        mainSwapGen++;
        a.removeAttribute("src");
        b.removeAttribute("src");
        a.style.transition = "none";
        b.style.transition = "none";
        a.style.transform = "";
        b.style.transform = "";
        a.style.filter = "";
        b.style.filter = "";
        return;
      }

      const visible = mainViewTopSlot === 0 ? a : b;
      const hidden = mainViewTopSlot === 0 ? b : a;
      const vSrc = visible.getAttribute("src") ?? "";

      /**
       * 顶图已是要显示的 URL：仅保证叠放状态（例如首帧后重复 effect）。
       */
      if (vSrc !== "" && viewerUrlsMatch(vSrc, next)) {
        visible.style.transition = "none";
        hidden.style.transition = "none";
        visible.style.transform = "";
        hidden.style.transform = "";
        visible.style.filter = "";
        hidden.style.filter = "";
        visible.style.opacity = "1";
        visible.style.zIndex = "2";
        hidden.style.opacity = "0";
        hidden.style.zIndex = "1";
        lastCommittedDisplayIndex = getDisplayIndex();
        return;
      }

      /**
       * 首帧尚无像素：直接写在顶图，不走预载（否则用户只看到底图空窗）。
       */
      if (vSrc === "") {
        visible.src = next;
        visible.style.transition = "none";
        hidden.style.transition = "none";
        visible.style.transform = "";
        hidden.style.transform = "";
        visible.style.filter = "";
        hidden.style.filter = "";
        visible.style.opacity = "1";
        visible.style.zIndex = "2";
        hidden.style.opacity = "0";
        hidden.style.zIndex = "1";
        lastCommittedDisplayIndex = getDisplayIndex();
        return;
      }

      const listLen = imageList().length;
      const currentIdx = getDisplayIndex();
      const prevIdx = lastCommittedDisplayIndex ?? currentIdx;
      /** 与 {@link viewerSlideDirection} 配合，首尾相接时按最短弧决定新图从左侧还是右侧进入。 */
      const slideDir = viewerSlideDirection(
        prevIdx,
        currentIdx,
        Math.max(1, listLen),
      );
      const mode = resolvedTransition();
      const g = ++mainSwapGen;

      /**
       * 无动画：直接对调层级（`none`、减弱动效、或未知模式兜底）。
       */
      const finishSwapInstant = () => {
        if (g !== mainSwapGen) return;
        viewerRemoveMosaicOverlays(mainImageMountRef.current);
        visible.style.transition = "none";
        hidden.style.transition = "none";
        visible.style.transform = "";
        hidden.style.transform = "";
        visible.style.filter = "";
        hidden.style.filter = "";
        visible.style.opacity = "0";
        visible.style.zIndex = "1";
        hidden.style.opacity = "1";
        hidden.style.zIndex = "2";
        mainViewTopSlot = mainViewTopSlot === 0 ? 1 : 0;
        lastCommittedDisplayIndex = getDisplayIndex();
      };

      /**
       * 新图已解码：**新图层在上**且从 opacity 0 淡入，**旧图层在下**全程 opacity 1，中间不会出现「双透明 → 黑底」。
       */
      const finishSwapCrossfade = () => {
        if (g !== mainSwapGen) return;
        if (viewerImagePrefersReducedMotion()) {
          finishSwapInstant();
          return;
        }

        let finalized = false;
        /** 用对象承载 `setTimeout` id，满足 `finalize` 与定时器互相引用且符合 lint。 */
        const fallbackTimerRef: {
          id?: ReturnType<typeof globalThis.setTimeout>;
        } = {};

        const finalize = () => {
          if (finalized || g !== mainSwapGen) return;
          finalized = true;
          if (fallbackTimerRef.id !== undefined) {
            globalThis.clearTimeout(fallbackTimerRef.id);
          }
          hidden.removeEventListener("transitionend", onEnd);
          visible.style.transition = "none";
          visible.style.transform = "";
          visible.style.filter = "";
          visible.style.opacity = "0";
          visible.style.zIndex = "1";
          hidden.style.transition = "none";
          hidden.style.transform = "";
          hidden.style.filter = "";
          hidden.style.opacity = "1";
          hidden.style.zIndex = "2";
          mainViewTopSlot = mainViewTopSlot === 0 ? 1 : 0;
          lastCommittedDisplayIndex = getDisplayIndex();
        };

        const onEnd = (ev: TransitionEvent) => {
          if (ev.target !== hidden || ev.propertyName !== "opacity") return;
          finalize();
        };

        hidden.style.transition = "none";
        hidden.style.transform = "";
        hidden.style.filter = "";
        hidden.style.opacity = "0";
        hidden.style.zIndex = "3";
        visible.style.zIndex = "2";
        visible.style.opacity = "1";
        visible.style.transition = "none";
        visible.style.transform = "";
        visible.style.filter = "";
        void hidden.offsetWidth;

        const ms = VIEWER_MAIN_CROSSFADE_MS;
        /** 缓入缓出，中间段叠化更明显（对比偏快的 standard 曲线） */
        const ease = "cubic-bezier(0.45, 0, 0.55, 1)";
        hidden.addEventListener("transitionend", onEnd, { once: true });
        fallbackTimerRef.id = globalThis.setTimeout(() => finalize(), ms + 160);

        hidden.style.transition = `opacity ${ms}ms ${ease}`;
        hidden.style.opacity = "1";
      };

      /**
       * 横向滑动：新图在上、全程不透明平移入，旧图在下反向移出（与 `blur` 的滤镜过渡完全不同）。
       */
      const finishSwapSlide = () => {
        if (g !== mainSwapGen) return;
        if (viewerImagePrefersReducedMotion()) {
          finishSwapInstant();
          return;
        }

        let finalized = false;
        const fallbackTimerRef: {
          id?: ReturnType<typeof globalThis.setTimeout>;
        } = {};

        const finalize = () => {
          if (finalized || g !== mainSwapGen) return;
          finalized = true;
          if (fallbackTimerRef.id !== undefined) {
            globalThis.clearTimeout(fallbackTimerRef.id);
          }
          visible.style.transition = "none";
          visible.style.transform = "";
          visible.style.filter = "";
          visible.style.opacity = "0";
          visible.style.zIndex = "1";
          hidden.style.transition = "none";
          hidden.style.transform = "";
          hidden.style.filter = "";
          hidden.style.opacity = "1";
          hidden.style.zIndex = "2";
          mainViewTopSlot = mainViewTopSlot === 0 ? 1 : 0;
          lastCommittedDisplayIndex = getDisplayIndex();
        };

        const mount = mainImageMountRef.current;
        const w = mount?.clientWidth ?? 480;
        const enter = slideDir >= 0 ? w : -w;
        const exit = slideDir >= 0 ? -w : w;
        const ms = VIEWER_MAIN_SLIDE_MS;
        const easeMove = "cubic-bezier(0.4, 0, 0.2, 1)";

        hidden.style.transition = "none";
        visible.style.transition = "none";
        hidden.style.filter = "";
        visible.style.filter = "";
        hidden.style.zIndex = "3";
        visible.style.zIndex = "2";
        hidden.style.opacity = "1";
        hidden.style.transform = `translateX(${enter}px)`;
        visible.style.opacity = "1";
        visible.style.transform = "translateX(0)";
        void hidden.offsetWidth;
        hidden.style.transition = `transform ${ms}ms ${easeMove}`;
        visible.style.transition = `transform ${ms}ms ${easeMove}`;
        hidden.style.transform = "translateX(0)";
        visible.style.transform = `translateX(${exit}px)`;

        fallbackTimerRef.id = globalThis.setTimeout(() => finalize(), ms + 140);
      };

      /**
       * 模糊渐入：新图叠在旧图之上，自 **高斯模糊 + 全透明** 过渡到清晰，无平移，与 `slide` 区分度大。
       */
      const finishSwapBlur = () => {
        if (g !== mainSwapGen) return;
        if (viewerImagePrefersReducedMotion()) {
          finishSwapInstant();
          return;
        }

        let finalized = false;
        const fallbackTimerRef: {
          id?: ReturnType<typeof globalThis.setTimeout>;
        } = {};

        const finalize = () => {
          if (finalized || g !== mainSwapGen) return;
          finalized = true;
          if (fallbackTimerRef.id !== undefined) {
            globalThis.clearTimeout(fallbackTimerRef.id);
          }
          visible.style.transition = "none";
          visible.style.transform = "";
          visible.style.filter = "";
          visible.style.opacity = "0";
          visible.style.zIndex = "1";
          hidden.style.transition = "none";
          hidden.style.transform = "";
          hidden.style.filter = "";
          hidden.style.opacity = "1";
          hidden.style.zIndex = "2";
          mainViewTopSlot = mainViewTopSlot === 0 ? 1 : 0;
          lastCommittedDisplayIndex = getDisplayIndex();
        };

        const blurStart = `blur(${VIEWER_BLUR_START_PX}px)`;
        const ms = VIEWER_MAIN_BLUR_MS;
        const ease = "cubic-bezier(0.45, 0, 0.55, 1)";

        hidden.style.transition = "none";
        visible.style.transition = "none";
        hidden.style.transform = "";
        visible.style.transform = "";
        hidden.style.zIndex = "3";
        visible.style.zIndex = "2";
        hidden.style.opacity = "0";
        hidden.style.filter = blurStart;
        visible.style.opacity = "1";
        visible.style.filter = "";
        void hidden.offsetWidth;

        hidden.style.transition =
          `opacity ${ms}ms ${ease}, filter ${ms}ms ${ease}`;
        hidden.style.opacity = "1";
        hidden.style.filter = "blur(0px)";

        fallbackTimerRef.id = globalThis.setTimeout(() => finalize(), ms + 160);
      };

      /**
       * 新图自略小放大并渐入（顶图叠在旧图之上）。
       */
      const finishSwapZoom = () => {
        if (g !== mainSwapGen) return;
        if (viewerImagePrefersReducedMotion()) {
          finishSwapInstant();
          return;
        }

        let finalized = false;
        const fallbackTimerRef: {
          id?: ReturnType<typeof globalThis.setTimeout>;
        } = {};

        const finalize = () => {
          if (finalized || g !== mainSwapGen) return;
          finalized = true;
          if (fallbackTimerRef.id !== undefined) {
            globalThis.clearTimeout(fallbackTimerRef.id);
          }
          visible.style.transition = "none";
          visible.style.transform = "";
          visible.style.transformOrigin = "";
          visible.style.filter = "";
          visible.style.opacity = "0";
          visible.style.zIndex = "1";
          hidden.style.transition = "none";
          hidden.style.transform = "";
          hidden.style.transformOrigin = "";
          hidden.style.filter = "";
          hidden.style.opacity = "1";
          hidden.style.zIndex = "2";
          mainViewTopSlot = mainViewTopSlot === 0 ? 1 : 0;
          lastCommittedDisplayIndex = getDisplayIndex();
        };

        hidden.style.transition = "none";
        hidden.style.transform = "scale(0.88)";
        hidden.style.transformOrigin = "center center";
        hidden.style.filter = "";
        hidden.style.opacity = "0";
        hidden.style.zIndex = "3";
        visible.style.zIndex = "2";
        visible.style.opacity = "1";
        visible.style.transition = "none";
        visible.style.transform = "";
        visible.style.filter = "";
        void hidden.offsetWidth;

        const ms = VIEWER_MAIN_ZOOM_MS;
        const ease = "cubic-bezier(0.4, 0, 0.2, 1)";
        fallbackTimerRef.id = globalThis.setTimeout(() => finalize(), ms + 120);

        hidden.style.transition =
          `opacity ${ms}ms ${ease}, transform ${ms}ms ${ease}`;
        hidden.style.opacity = "1";
        hidden.style.transform = "scale(1)";
      };

      /**
       * 小方格（马赛克）渐入：叠层用预载 `img`（`hidden`）的 **布局盒**（`offsetLeft/Top/Width/Height`）定位，
       * 与浏览器在 `max-h-[calc(100vh-12rem)]` 等约束下的真实尺寸一致，避免公式 `contain` 与布局亚像素差导致「先略小再放大」。
       */
      const finishSwapMosaic = () => {
        if (g !== mainSwapGen) return;
        if (viewerImagePrefersReducedMotion()) {
          finishSwapInstant();
          return;
        }
        const mount = mainImageMountRef.current;
        const doc = globalThis.document;
        if (mount == null || doc == null) {
          finishSwapInstant();
          return;
        }

        let finalized = false;
        const fallbackTimerRef: {
          id?: ReturnType<typeof globalThis.setTimeout>;
        } = {};

        const finalize = () => {
          if (finalized || g !== mainSwapGen) return;
          finalized = true;
          if (fallbackTimerRef.id !== undefined) {
            globalThis.clearTimeout(fallbackTimerRef.id);
          }
          viewerRemoveMosaicOverlays(mount);
          visible.style.transition = "none";
          visible.style.transform = "";
          visible.style.filter = "";
          visible.style.opacity = "0";
          visible.style.zIndex = "1";
          hidden.style.transition = "none";
          hidden.style.transform = "";
          hidden.style.filter = "";
          hidden.style.opacity = "1";
          hidden.style.zIndex = "2";
          mainViewTopSlot = mainViewTopSlot === 0 ? 1 : 0;
          lastCommittedDisplayIndex = getDisplayIndex();
        };

        const mw = mount.clientWidth;
        const mh = mount.clientHeight;
        if (mw < 4 || mh < 4) {
          finishSwapInstant();
          return;
        }

        viewerRemoveMosaicOverlays(mount);

        const cols = VIEWER_MOSAIC_COLS;
        const rows = VIEWER_MOSAIC_ROWS;
        /** 与 `hidden` 实际排版盒一致（含 `maxHeight` 等与父盒不同的约束） */
        let offX = hidden.offsetLeft;
        let offY = hidden.offsetTop;
        let drawW = hidden.offsetWidth;
        let drawH = hidden.offsetHeight;
        if (drawW < 2 || drawH < 2) {
          const fb = viewerObjectContainRect(
            mw,
            mh,
            hidden.naturalWidth,
            hidden.naturalHeight,
          );
          offX = fb.offX;
          offY = fb.offY;
          drawW = fb.drawW;
          drawH = fb.drawH;
        }
        if (drawW < 2 || drawH < 2) {
          finishSwapInstant();
          return;
        }
        const cellW = drawW / cols;
        const cellH = drawH / rows;

        const overlay = doc.createElement("div");
        overlay.setAttribute("data-dreamer-image-viewer-mosaic", "");
        overlay.setAttribute("aria-hidden", "true");
        overlay.style.position = "absolute";
        overlay.style.left = `${offX}px`;
        overlay.style.top = `${offY}px`;
        overlay.style.width = `${drawW}px`;
        overlay.style.height = `${drawH}px`;
        overlay.style.zIndex = "4";
        overlay.style.display = "grid";
        overlay.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        overlay.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        overlay.style.pointerEvents = "none";
        overlay.style.overflow = "hidden";

        const totalCells = rows * cols;
        const order = Array.from({ length: totalCells }, (_, i) => i);
        for (let i = order.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const tmp = order[i]!;
          order[i] = order[j]!;
          order[j] = tmp;
        }

        const bgUrl = `url(${JSON.stringify(next)})`;
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
              `opacity ${VIEWER_MOSAIC_CELL_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
            cell.style.transitionDelay = `${
              order[k]! * VIEWER_MOSAIC_STAGGER_MS
            }ms`;
            overlay.appendChild(cell);
            k++;
          }
        }

        mount.appendChild(overlay);
        void overlay.offsetWidth;
        globalThis.requestAnimationFrame(() => {
          if (g !== mainSwapGen) {
            viewerRemoveMosaicOverlays(mount);
            return;
          }
          for (let c = 0; c < overlay.children.length; c++) {
            const el = overlay.children[c] as HTMLElement;
            el.style.opacity = "1";
          }
        });

        const totalMs = (totalCells - 1) * VIEWER_MOSAIC_STAGGER_MS +
          VIEWER_MOSAIC_CELL_MS +
          140;
        fallbackTimerRef.id = globalThis.setTimeout(() => finalize(), totalMs);
      };

      const tryDecodeAndSwap = () => {
        if (g !== mainSwapGen) return;
        /**
         * 不在开过渡前等待 `decode()`：`load` 后位图已可用，再等 decode 会让主图明显晚于缩略高亮。
         * `decode()` 仅后台触发，利于合成器但不阻塞叠化/滑动。
         */
        if (typeof hidden.decode === "function") {
          void hidden.decode().catch(() => {});
        }
        const reduceMotion = viewerImagePrefersReducedMotion();
        if (reduceMotion || mode === "none") {
          finishSwapInstant();
        } else if (mode === "fade") {
          finishSwapCrossfade();
        } else if (mode === "slide") {
          finishSwapSlide();
        } else if (mode === "blur") {
          finishSwapBlur();
        } else if (mode === "zoom") {
          finishSwapZoom();
        } else if (mode === "mosaic") {
          finishSwapMosaic();
        } else {
          finishSwapInstant();
        }
      };

      /** 缓存命中时 `load` 与 `complete` 可能同帧触发两次，须只 swap 一次。 */
      let decodedOnce = false;
      const onReady = () => {
        if (decodedOnce) return;
        decodedOnce = true;
        tryDecodeAndSwap();
      };

      hidden.addEventListener(
        "error",
        () => {
          if (g !== mainSwapGen) return;
          onReady();
        },
        { once: true },
      );
      hidden.addEventListener("load", () => onReady(), { once: true });
      /** 打断上一轮未结束的 `opacity` 过渡，避免叠化监听器与 `src` 竞态。 */
      hidden.style.transition = "none";
      hidden.style.filter = "";
      viewerRemoveMosaicOverlays(mainImageMountRef.current);
      hidden.src = next;
      if (hidden.complete && hidden.naturalWidth > 0) {
        onReady();
      }
    };

    runMainBufferSwap();
  });

  /**
   * 全屏壳层：`fixed` 根节点；**不在此函数内读** `displayImageSrc` / `getDisplayIndex`，仅读 `hasMultipleImages` 与静态 props。
   */
  const buildImageViewerShell = () => {
    return (
      <div
        class={twMerge(
          "fixed inset-0 flex flex-col bg-transparent",
          className,
        )}
        style={{ zIndex: IMAGE_VIEWER_Z }}
        role="dialog"
        aria-modal="true"
        aria-label="图片查看"
        tabIndex={-1}
      >
        {/* 全屏遮罩：默认约 80%～85% 黑，背后页面只隐约可见；`maskClass` 可覆盖 */}
        <div
          class={twMerge(
            "absolute inset-0 z-0 bg-black/90 dark:bg-black/85",
            maskClass,
          )}
          onClick={handleMaskClick as unknown as (e: Event) => void}
          aria-hidden
        />

        <div class="relative z-10 flex items-center justify-end gap-2 p-3">
          <button
            type="button"
            aria-label="关闭"
            class="p-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            onClick={() => onClose?.()}
          >
            <IconClose class="w-6 h-6" />
          </button>
        </div>

        {hasMultipleImages() && (
          <button
            type="button"
            aria-label="上一张"
            class="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white/90 hover:bg-black/70 hover:text-white transition-colors"
            onClick={handlePrev}
          >
            <IconChevronLeft class="w-8 h-8" />
          </button>
        )}

        {hasMultipleImages() && (
          <button
            type="button"
            aria-label="下一张"
            class="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white/90 hover:bg-black/70 hover:text-white transition-colors"
            onClick={handleNext}
          >
            <IconChevronRight class="w-8 h-8" />
          </button>
        )}

        <div class="flex-1 flex w-full min-w-0 items-center justify-center min-h-0 p-4 pt-14 pb-24 overflow-hidden">
          <div
            ref={transformLayerRef}
            style={viewerTranslateStyle}
            class="flex w-full min-w-0 max-w-full min-h-0 items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none will-change-[transform]"
            onPointerDown={handleImagePointerDown as unknown as (
              e: Event,
            ) => void}
            role="presentation"
          >
            {/* 内层：scale/rotate + transition（240ms）；样式由 memo 驱动，同 gallery previewStyle */}
            <div
              ref={transformInnerRef}
              style={viewerInnerTransformStyle}
              class={twMerge(
                "flex w-full min-w-0 max-w-full items-center justify-center origin-center pointer-events-none select-none touch-none will-change-[transform]",
                viewerImagePrefersReducedMotion()
                  ? "transition-none"
                  : "transition-transform duration-[240ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none",
              )}
            >
              {/* 双 `img` 叠放：预载后叠化（`fade`）或瞬时换层；单图改 `src` 不经此双缓冲 */}
              <div
                ref={mainImageMountRef}
                class="relative w-full min-w-0 min-h-[50vh] max-w-full overflow-hidden flex items-center justify-center pointer-events-none"
                style={{ maxHeight: "calc(100vh - 12rem)" }}
              >
                <img
                  ref={mainImg0Ref}
                  alt=""
                  class="absolute max-w-full max-h-full w-auto h-auto object-contain pointer-events-none select-none"
                  draggable={false}
                  loading="eager"
                  decoding="async"
                  style={{
                    maxHeight: "calc(100vh - 12rem)",
                    opacity: 1,
                    zIndex: 2,
                  }}
                />
                <img
                  ref={mainImg1Ref}
                  alt=""
                  class="absolute max-w-full max-h-full w-auto h-auto object-contain pointer-events-none select-none"
                  draggable={false}
                  loading="eager"
                  decoding="async"
                  style={{
                    maxHeight: "calc(100vh - 12rem)",
                    opacity: 0,
                    zIndex: 1,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div class="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-2 py-3 px-4 bg-black/60 backdrop-blur-sm">
          <button
            type="button"
            aria-label="放大"
            class="p-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            onClick={(e: Event) => {
              e.stopPropagation();
              handleZoomIn();
            }}
          >
            <IconZoomIn class="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label="缩小"
            class="p-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            onClick={(e: Event) => {
              e.stopPropagation();
              handleZoomOut();
            }}
          >
            <IconZoomOut class="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label="逆时针旋转"
            class="p-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            onClick={(e: Event) => {
              e.stopPropagation();
              handleRotateCcw();
            }}
          >
            <IconRotateCcw class="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label="顺时针旋转"
            class="p-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            onClick={(e: Event) => {
              e.stopPropagation();
              handleRotateCw();
            }}
          >
            <IconRotateCw class="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label="重置缩放与旋转"
            class="px-3 py-1.5 rounded-lg text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            onClick={(e: Event) => {
              e.stopPropagation();
              handleResetTransform();
            }}
          >
            重置
          </button>
        </div>

        {hasMultipleImages() && (
          <div
            ref={thumbnailStripMountRef}
            class="absolute bottom-14 left-0 right-0 z-10 min-h-0 pointer-events-auto flex justify-center"
            aria-hidden={!showThumbnails}
          >
            {/* 仅随列表 / showThumbnails 变；勿在子 getter 内读当前索引，避免整行重挂载 */}
            {() => renderThumbnailStripBody()}
          </div>
        )}

        {hasMultipleImages() && (
          <div
            ref={viewerCounterMountRef}
            class="absolute inset-0 z-5 min-h-0 pointer-events-none"
          >
            <span class="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-full bg-black/50 text-white/90 text-sm">
              {() => viewerCounterText()}
            </span>
          </div>
        )}
      </div>
    );
  };

  /**
   * 与相册示例相同：`Show` 控制遮罩挂载，由控制流内部 `createEffect` 订阅 `open`，避免根级 `return () =>` 与文档站响应式子组件叠出死循环。
   */
  const imageViewerClosedFallback = getBrowserBodyPortalHost() != null
    ? (
      <span
        style="display:none;width:0;height:0;overflow:hidden;position:absolute;clip:rect(0,0,0,0)"
        aria-hidden="true"
        data-dreamer-image-viewer-anchor=""
      />
    )
    : null;

  return (
    <Show when={isOpen} fallback={imageViewerClosedFallback}>
      {() => buildImageViewerShell()}
    </Show>
  );
}
