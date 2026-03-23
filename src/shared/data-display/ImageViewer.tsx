/**
 * ImageViewer 图片查看器（View）。
 * 全屏遮罩内大图查看：多图切换、缩放、旋转、拖动平移、缩略图、键盘与遮罩关闭。
 * 归属数据展示，与 Image 并列。
 */

import { createEffect } from "@dreamer/view";
import { createSignal } from "@dreamer/view/signal";
import { twMerge } from "tailwind-merge";
/** 按需：单文件图标，避免经 icons/mod 拉入全表 */
import { IconChevronLeft } from "../basic/icons/ChevronLeft.tsx";
import { IconChevronRight } from "../basic/icons/ChevronRight.tsx";
import { IconClose } from "../basic/icons/Close.tsx";
import { IconRotateCcw } from "../basic/icons/RotateCcw.tsx";
import { IconRotateCw } from "../basic/icons/RotateCw.tsx";
import { IconZoomIn } from "../basic/icons/ZoomIn.tsx";
import { IconZoomOut } from "../basic/icons/ZoomOut.tsx";

/**
 * 在容器上按下时开始拖动，通过 document 的 mousemove/mouseup 更新位移。
 */
function useImageDrag(
  getPosition: () => { x: number; y: number },
  setPosition: (v: { x: number; y: number }) => void,
) {
  return (e: MouseEvent) => {
    e.preventDefault();
    const doc = globalThis.document;
    if (!doc) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = getPosition();
    const onMove = (ev: MouseEvent) => {
      setPosition({
        x: startPos.x + ev.clientX - startX,
        y: startPos.y + ev.clientY - startY,
      });
    };
    const onUp = () => {
      doc.removeEventListener("mousemove", onMove);
      doc.removeEventListener("mouseup", onUp);
    };
    doc.addEventListener("mousemove", onMove);
    doc.addEventListener("mouseup", onUp);
  };
}

export interface ImageViewerProps {
  /** 是否打开（受控） */
  open?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
  /** 图片列表（单张传 string 或 string[]） */
  images: string | string[];
  /** 当前展示的索引（受控，不传则内部用 defaultIndex） */
  currentIndex?: number;
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
  /** 遮罩层 class */
  maskClass?: string;
  /** 内容区 class */
  class?: string;
}

const MIN_SCALE = 0.25;
const MAX_SCALE = 4;
const SCALE_STEP = 0.25;
const ROTATE_STEP = 90;

export function ImageViewer(props: ImageViewerProps) {
  const {
    open = false,
    onClose,
    images: imagesProp,
    currentIndex: controlledIndex,
    defaultIndex = 0,
    onIndexChange,
    maskClosable = true,
    keyboard = true,
    showThumbnails = true,
    maskClass,
    class: className,
  } = props;

  const list = Array.isArray(imagesProp) ? imagesProp : [imagesProp];
  const hasMultiple = list.length > 1;

  const internalIndexRef = createSignal(defaultIndex);
  const getIndex = () =>
    controlledIndex !== undefined ? controlledIndex : internalIndexRef.value;
  const setIndex = (i: number) => {
    const next = Math.max(0, Math.min(i, list.length - 1));
    if (controlledIndex === undefined) internalIndexRef.value = next;
    onIndexChange?.(next);
  };

  const scaleRef = createSignal(1);
  const rotationRef = createSignal(0);
  const positionRef = createSignal({ x: 0, y: 0 });

  const handlePrev = () => {
    if (!hasMultiple) return;
    setIndex(getIndex() - 1);
    scaleRef.value = 1;
    rotationRef.value = 0;
    positionRef.value = { x: 0, y: 0 };
  };

  const handleNext = () => {
    if (!hasMultiple) return;
    setIndex(getIndex() + 1);
    scaleRef.value = 1;
    rotationRef.value = 0;
    positionRef.value = { x: 0, y: 0 };
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

  const handleImageMouseDown = useImageDrag(
    () => positionRef.value,
    (v) => {
      positionRef.value = v;
    },
  );

  const handleMaskClick = (e: Event) => {
    if (e.target === e.currentTarget && maskClosable) onClose?.();
  };

  /** 打开时在 document 上绑定键盘事件，避免依赖根节点获焦；关闭时清理 */
  createEffect(() => {
    if (!open) return;
    const doc = globalThis.document;
    if (!doc) return;
    const handler = (e: KeyboardEvent) => {
      if (!keyboard) return;
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

  const docBody = typeof globalThis.document !== "undefined"
    ? globalThis.document.body
    : null;

  if (!open) {
    if (docBody) docBody.style.overflow = "";
    return null;
  }

  const currentSrc = list[getIndex()] ?? "";

  /**
   * 渲染 getter：读 scale/rotation/position 与当前索引，保证缩放旋转与切换时视图更新。
   */
  return () => {
    if (docBody) docBody.style.overflow = "hidden";
    const scaleVal = scaleRef.value;
    const rotationVal = rotationRef.value;
    const pos = positionRef.value;

    return (
      <div
        class={twMerge(
          "fixed inset-0 z-400 flex flex-col bg-black/90 dark:bg-black/95",
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-label="图片查看"
        tabindex={-1}
      >
        {/* 遮罩/背景，点击关闭；z-0 确保在工具栏(z-10)之下，避免挡住底部按钮 */}
        <div
          class={twMerge("absolute inset-0 z-0", maskClass)}
          onClick={handleMaskClick as unknown as (e: Event) => void}
          aria-hidden
        />

        {/* 顶部工具栏：关闭 */}
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

        {/* 左侧上一张（多图时） */}
        {hasMultiple && (
          <button
            type="button"
            aria-label="上一张"
            class="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white/90 hover:bg-black/70 hover:text-white transition-colors"
            onClick={handlePrev}
          >
            <IconChevronLeft class="w-8 h-8" />
          </button>
        )}

        {/* 右侧下一张（多图时） */}
        {hasMultiple && (
          <button
            type="button"
            aria-label="下一张"
            class="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white/90 hover:bg-black/70 hover:text-white transition-colors"
            onClick={handleNext}
          >
            <IconChevronRight class="w-8 h-8" />
          </button>
        )}

        {/* 主图区域：可拖动平移 + 缩放 + 旋转 */}
        <div class="flex-1 flex items-center justify-center min-h-0 p-4 pt-14 pb-24 overflow-hidden">
          <div
            class="flex items-center justify-center origin-center cursor-grab active:cursor-grabbing select-none touch-none"
            style={{
              transform:
                `translate(${pos.x}px, ${pos.y}px) scale(${scaleVal}) rotate(${rotationVal}deg)`,
            }}
            onMouseDown={handleImageMouseDown as unknown as (e: Event) => void}
            role="presentation"
          >
            <img
              src={currentSrc}
              alt=""
              class="max-w-full max-h-full object-contain pointer-events-none"
              draggable={false}
              style={{ maxHeight: "calc(100vh - 12rem)" }}
            />
          </div>
        </div>

        {/* 底部工具栏：缩放、旋转、重置；z-20 确保在遮罩(z-0)与主图区之上，可点击 */}
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

        {/* 底部缩略图（多图时） */}
        {hasMultiple && showThumbnails && list.length > 1 && (
          <div class="absolute bottom-14 left-0 right-0 z-10 flex justify-center gap-1.5 py-2 px-4 overflow-x-auto max-h-20">
            {list.map((src, i) => (
              <button
                type="button"
                key={i}
                aria-label={`第 ${i + 1} 张`}
                class={twMerge(
                  "shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-all",
                  i === getIndex()
                    ? "border-teal-400 dark:border-teal-400 opacity-100"
                    : "border-transparent opacity-60 hover:opacity-90",
                )}
                onClick={() => setIndex(i)}
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
        )}

        {/* 页码（多图时） */}
        {hasMultiple && (
          <div class="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-full bg-black/50 text-white/90 text-sm">
            {getIndex() + 1} / {list.length}
          </div>
        )}
      </div>
    );
  };
}
