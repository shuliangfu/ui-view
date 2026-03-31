/**
 * ImageViewer 图片查看器（View）。
 * 全屏遮罩内大图查看：多图切换、缩放、旋转、拖动平移、缩略图、键盘与遮罩关闭。
 * 归属数据展示，与 Image 并列。
 *
 * **打开态与 {@link Modal} 对齐**：`open` 支持 `boolean`、零参 getter 或 `SignalRef`（推荐 `open={sig}`），
 * 勿仅依赖 `open={sig.value}` 在 Hybrid/函数槽 patch 下可能不触发子树更新。
 * 全屏层为 **`fixed inset-0` 内联渲染**（不再挂 `body` Portal），避免 `view-portal` 与双槽过渡带来的整段重绘与黑底闪屏。
 * **关闭态**：浏览器内存在真实 `document.body` 时须返回**隐藏占位 `span`**（与 {@link Modal} 一致），勿对该槽位 `return null`，否则 Hybrid 水合 `replaceSlot` 与更新链异常 → 点击后 `open` 已变但界面不打开。
 * 勿在组件顶层 `open === false` 时提前 `return` 跳过 `createEffect`/`createRenderEffect` 注册。
 * **根返回值须为 `return () => …` 渲染 getter**（与 {@link Image}、Carousel 一致），在 getter 内读 {@link isOpen}；若直接 `return` 静态 VNode，首帧关闭会永远卡在占位节点，点击后 `open` 已为 true 仍不显示查看器。
 * **勿在根 getter 里读 `currentIndex` / 主图 `src`**：否则每次切图整棵 `fixed` 壳重算，主图与缩略图会一起闪断；主图/缩略条/张数指示应挂在占位节点上用 {@link insertReactive} 单独订阅。
 * **为何单 `img` 改 `src` 会「先空再出」**：浏览器在赋值新 URL 后会立刻释放旧位图，新图未 `load/decode` 前没有像素可画；主图用双缓冲预载到底层再切换叠放。缩略条若 getter 订阅了当前索引，会整行 DOM 重挂载，小图也会闪；结构只跟列表走、高亮单独改 `class`。
 * **换图动画**：`imageTransition="fade"`（默认）在双缓冲上做**叠化**（新图在上层 `opacity 0→1`，旧图在下层保持不透明）；`slide` / `slideFade` 仍为**瞬时切层**以免整层平移露出黑底。系统开启「减少动态效果」时一律瞬时切换。
 */

import {
  createEffect,
  createMemo,
  createRef,
  createRenderEffect,
  createSignal,
  insertReactive,
  isSignalRef,
  onCleanup,
  type SignalRef,
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

/** `open` 合法形态：布尔快照、`SignalRef`、或返回 boolean 的零参 getter */
export type ImageViewerOpenInput =
  | boolean
  | (() => boolean)
  | SignalRef<boolean>;

/** `currentIndex` 受控时的合法形态：数字快照、`SignalRef`、或返回 number 的零参 getter */
export type ImageViewerIndexInput = number | (() => number) | SignalRef<number>;

/**
 * 主图切换动画：`fade` 仅淡出旧图露出已解码的新图；`slide` 横向划入/划出（方向随索引增减）；
 * `slideFade` 为滑动与透明度组合。
 */
export type ImageViewerImageTransition = "fade" | "slide" | "slideFade";

/**
 * 解析 `open` prop（在 {@link createMemo} 内调用以订阅 SignalRef / getter）。
 *
 * @param v - {@link ImageViewerProps.open}
 */
function readImageViewerOpenInput(
  v: ImageViewerOpenInput | undefined,
): boolean {
  if (v === undefined) return false;
  if (isSignalRef(v)) return !!v.value;
  if (typeof v === "function") {
    if ((v as () => unknown).length !== 0) return false;
    return !!(v as () => boolean)();
  }
  return !!v;
}

/**
 * 解析受控 `currentIndex`（在 {@link createMemo} 内调用以订阅 SignalRef / getter）。
 *
 * @param v - {@link ImageViewerProps.currentIndex}（已排除 `undefined`）
 */
function readImageViewerIndexInput(v: ImageViewerIndexInput): number {
  let n: number;
  if (isSignalRef(v)) n = Number(v.value);
  else if (typeof v === "function") {
    if ((v as () => unknown).length !== 0) return 0;
    n = Number((v as () => number)());
  } else {
    n = Number(v);
  }
  return Number.isFinite(n) ? Math.trunc(n) : 0;
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
   * 主图切换：`fade`（默认）为双缓冲叠化；`slide` / `slideFade` 为瞬时换层（不做横向滑动，避免透出黑底）。
   */
  imageTransition?: ImageViewerImageTransition;
}

const MIN_SCALE = 0.25;
const MAX_SCALE = 4;
const SCALE_STEP = 0.25;
const ROTATE_STEP = 90;

/** 全屏层 z-index，高于文档站顶栏 z-50 与 Modal 内容区 */
const IMAGE_VIEWER_Z = 1050;

/**
 * 主图叠化时长（毫秒）：新图盖在旧图之上 `opacity 0→1`，旧图全程保持不透明，避免透出对话框黑底。
 */
const VIEWER_MAIN_CROSSFADE_MS = 240;

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

export function ImageViewer(props: ImageViewerProps) {
  const {
    onClose,
    defaultIndex: defaultIndexProp = 0,
    showThumbnails = true,
    maskClass,
    class: className,
    imageTransition: imageTransitionProp = "fade",
  } = props;

  /**
   * `fade`（含未传时的默认值）使用叠化；`slide` / `slideFade` 保持瞬时切换（与旧版滑动过渡不同，避免黑缝）。
   */
  const useMainCrossfade = (): boolean => imageTransitionProp === "fade";

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
   * 受控模式下从 `currentIndex` 解析出的索引；未传 `currentIndex` 时为 `undefined`（在 memo 内订阅 SignalRef / getter）。
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
  const rotationRef = createSignal(0);
  const positionRef = createSignal({ x: 0, y: 0 });

  /**
   * 包裹大图的可拖动层：缩放/旋转/位移由紧随其后的 `createRenderEffect` 写 `style.transform`，
   * 避免在 JSX 里反复拼接 transform 触发大范围协调。
   */
  const transformLayerRef = createRef<HTMLDivElement>(null);

  /**
   * 是否多图：仅依赖列表长度；切索引时不变，避免根渲染 getter 因「当前张」变化而重算整壳。
   */
  const hasMultipleImages = createMemo(() => imageList().length > 1);

  /**
   * 主图 / 缩略条 / 顶栏张数 的占位节点：内容由 {@link insertReactive} 注入，与外壳 DOM 解耦。
   */
  const mainImageMountRef = createRef<HTMLDivElement>(null);
  /** 主图双缓冲：预载到「隐藏」层，`decode` 后再切 `opacity/z-index`，避免单 `img` 改 `src` 时浏览器先清空旧位图 → 闪一下。 */
  const mainImg0Ref = createRef<HTMLImageElement>(null);
  const mainImg1Ref = createRef<HTMLImageElement>(null);
  const thumbnailStripMountRef = createRef<HTMLDivElement>(null);
  const viewerCounterMountRef = createRef<HTMLDivElement>(null);
  const counterTextRef = createRef<HTMLSpanElement>(null);

  /**
   * 当前哪一层 `img` 为「顶」层（与 {@link mainImg0Ref} / {@link mainImg1Ref} 对应）；关闭时归零。
   */
  let mainViewTopSlot: 0 | 1 = 0;
  /** 快速连点切换时作废上一张的 `load/decode` 回调，避免错序 swap。 */
  let mainSwapGen = 0;

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
   * 打开期间，索引或同索引下的 URL 变化时重置缩放/旋转/平移，避免上一张的变换套在新图上。
   */
  createEffect(() => {
    if (!isOpen()) {
      scaleRef.value = 1;
      rotationRef.value = 0;
      positionRef.value = { x: 0, y: 0 };
      return;
    }
    void displayImageSrc();
    scaleRef.value = 1;
    rotationRef.value = 0;
    positionRef.value = { x: 0, y: 0 };
  });

  /**
   * 打开时锁定 body 滚动；关闭或卸载时恢复（无 Portal，仅依赖本组件副作用）。
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

  const handleZoomIn = () =>
    scaleRef.value = (s) => Math.min(MAX_SCALE, s + SCALE_STEP);
  const handleZoomOut = () =>
    scaleRef.value = (s) => Math.max(MIN_SCALE, s - SCALE_STEP);
  const handleRotateCw = () =>
    rotationRef.value = (r) => (r + ROTATE_STEP) % 360;
  const handleRotateCcw = () =>
    rotationRef.value = (r) => (r - ROTATE_STEP + 360) % 360;
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
   * 将缩放/旋转/平移同步到可拖动层 DOM。
   * **须先读 `positionRef`/`scaleRef`/`rotationRef`，再读 `transformLayerRef.current`**：
   * `createRef` 的 `current` 赋值会触发本 effect；
   * **勿**再订阅 `getDisplayIndex`/`imageList`，否则每次切图都会重写父级 transform，与拖动/缩放状态打架。
   */
  createRenderEffect(() => {
    if (!isOpen()) return;
    const pos = positionRef.value;
    const s = scaleRef.value;
    const r = rotationRef.value;
    const wrap = transformLayerRef.current;
    if (wrap == null) return;
    wrap.style.transform =
      `translate(${pos.x}px, ${pos.y}px) scale(${s}) rotate(${r}deg)`;
  });

  /** 打开时在 document 上绑定键盘事件；依赖 {@link isOpen} 订阅 */
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
    return () => doc.removeEventListener("keydown", handler as EventListener);
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
   * 缩略条：仅随列表 / `showThumbnails` 变；索引变化不触发本 insert。
   */
  createEffect(() => {
    if (!isOpen()) return;
    const mount = thumbnailStripMountRef.current;
    if (mount == null) return;
    const dispose = insertReactive(mount, () => renderThumbnailStripBody());
    onCleanup(() => dispose());
  });

  /**
   * 根据当前索引更新缩略按钮样式；用 `queueMicrotask` 排在 {@link insertReactive} 挂载按钮之后执行，避免首帧选不到节点。
   */
  createEffect(() => {
    if (!isOpen()) return;
    const list = imageList();
    if (list.length <= 1) return;
    const idx = getDisplayIndex();
    queueMicrotask(() => {
      const mount = thumbnailStripMountRef.current;
      if (mount == null) return;
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
    });
  });

  /**
   * 顶栏张数：只改文本节点，避免整段 VNode 替换。
   */
  createRenderEffect(() => {
    if (!isOpen()) return;
    const el = counterTextRef.current;
    if (el == null) return;
    const list = imageList();
    if (list.length <= 1) {
      el.textContent = "";
      return;
    }
    const idx = getDisplayIndex();
    el.textContent = `${idx + 1} / ${list.length}`;
  });

  /**
   * 主图双缓冲：下一 URL 先写在「底」层 `img` 上解码，完成后再切换叠放，避免单图改 `src` 的中间空白帧。
   */
  createEffect(() => {
    if (!isOpen()) {
      mainSwapGen++;
      mainViewTopSlot = 0;
      const a = mainImg0Ref.current;
      const b = mainImg1Ref.current;
      if (a != null) {
        a.removeAttribute("src");
        a.style.transition = "none";
        a.style.opacity = "1";
        a.style.zIndex = "2";
      }
      if (b != null) {
        b.removeAttribute("src");
        b.style.transition = "none";
        b.style.opacity = "0";
        b.style.zIndex = "1";
      }
      return;
    }

    const next = displayImageSrc();
    const a = mainImg0Ref.current;
    const b = mainImg1Ref.current;
    if (a == null || b == null) return;

    if (next === "") {
      mainSwapGen++;
      a.removeAttribute("src");
      b.removeAttribute("src");
      a.style.transition = "none";
      b.style.transition = "none";
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
      visible.style.opacity = "1";
      visible.style.zIndex = "2";
      hidden.style.opacity = "0";
      hidden.style.zIndex = "1";
      return;
    }

    /**
     * 首帧尚无像素：直接写在顶图，不走预载（否则用户只看到底图空窗）。
     */
    if (vSrc === "") {
      visible.src = next;
      visible.style.transition = "none";
      hidden.style.transition = "none";
      visible.style.opacity = "1";
      visible.style.zIndex = "2";
      hidden.style.opacity = "0";
      hidden.style.zIndex = "1";
      return;
    }

    const g = ++mainSwapGen;

    /**
     * 无叠化：直接对调层级（降级 / 减少动效）。
     */
    const finishSwapInstant = () => {
      if (g !== mainSwapGen) return;
      visible.style.transition = "none";
      hidden.style.transition = "none";
      visible.style.opacity = "0";
      visible.style.zIndex = "1";
      hidden.style.opacity = "1";
      hidden.style.zIndex = "2";
      mainViewTopSlot = mainViewTopSlot === 0 ? 1 : 0;
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
        visible.style.opacity = "0";
        visible.style.zIndex = "1";
        hidden.style.transition = "none";
        hidden.style.opacity = "1";
        hidden.style.zIndex = "2";
        mainViewTopSlot = mainViewTopSlot === 0 ? 1 : 0;
      };

      const onEnd = (ev: TransitionEvent) => {
        if (ev.target !== hidden || ev.propertyName !== "opacity") return;
        finalize();
      };

      hidden.style.transition = "none";
      hidden.style.opacity = "0";
      hidden.style.zIndex = "3";
      visible.style.zIndex = "2";
      visible.style.opacity = "1";
      visible.style.transition = "none";
      void hidden.offsetWidth;

      const ms = VIEWER_MAIN_CROSSFADE_MS;
      const ease = "cubic-bezier(0.4, 0, 0.2, 1)";
      hidden.addEventListener("transitionend", onEnd, { once: true });
      fallbackTimerRef.id = globalThis.setTimeout(() => finalize(), ms + 120);

      hidden.style.transition = `opacity ${ms}ms ${ease}`;
      hidden.style.opacity = "1";
    };

    const tryDecodeAndSwap = () => {
      if (g !== mainSwapGen) return;
      const p = typeof hidden.decode === "function"
        ? hidden.decode()
        : Promise.resolve();
      void p.catch(() => {}).then(() => {
        if (g !== mainSwapGen) return;
        if (useMainCrossfade()) {
          finishSwapCrossfade();
        } else {
          finishSwapInstant();
        }
      });
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
    hidden.src = next;
    if (hidden.complete && hidden.naturalWidth > 0) {
      onReady();
    }
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
            class="flex w-full min-w-0 max-w-full items-center justify-center origin-center cursor-grab active:cursor-grabbing select-none touch-none will-change-transform"
            onPointerDown={handleImagePointerDown as unknown as (
              e: Event,
            ) => void}
            role="presentation"
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
          />
        )}

        {hasMultipleImages() && (
          <div
            ref={viewerCounterMountRef}
            class="absolute inset-0 z-5 min-h-0 pointer-events-none"
          >
            <span
              ref={counterTextRef}
              class="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-full bg-black/50 text-white/90 text-sm"
            />
          </div>
        )}
      </div>
    );
  };

  /**
   * 渲染 getter：在回调内读 {@link isOpen}，父级 `insertReactive` 才能随 `open` 重算；否则首帧选中的分支（占位或全屏）会固定不变。
   * 有 `body` 时关闭态用隐藏 `span` 占槽（与 {@link Modal}、Hybrid `replaceSlot` 约定一致）；无 `body`（纯 SSR）时关闭可 `null`。
   */
  return () => {
    if (!isOpen()) {
      if (getBrowserBodyPortalHost() != null) {
        return (
          <span
            style="display:none;width:0;height:0;overflow:hidden;position:absolute;clip:rect(0,0,0,0)"
            aria-hidden="true"
            data-dreamer-image-viewer-anchor=""
          />
        );
      }
      return null;
    }
    return buildImageViewerShell();
  };
}
