/**
 * Modal 模态弹窗（View）。
 * 桌面居中弹层：遮罩、标题、内容、底部按钮；支持关闭、点击遮罩关闭、Esc、自定义宽度与 footer。
 * 支持拖动标题栏、全屏切换；全屏与关闭按钮并排于标题栏右侧。
 */

import { createSignal } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { IconClose, IconExitFullscreen, IconMaximize2 } from "../../shared/basic/icons/mod.ts";

export interface ModalProps {
  /** 是否打开（受控） */
  open?: boolean;
  /** 关闭回调（关闭按钮、遮罩、Esc 触发） */
  onClose?: () => void;
  /** 标题；传 null 或 false 不显示标题栏 */
  title?: string | null;
  /** 弹层内容 */
  children?: unknown;
  /** 底部区域：传 VNode 或 null 不显示；不传时默认无 footer */
  footer?: unknown;
  /** 是否显示右上角关闭按钮，默认 true */
  closable?: boolean;
  /** 点击遮罩是否关闭，默认 true */
  maskClosable?: boolean;
  /** 弹层宽度（CSS，如 "520px"、"80%"），默认 "520px" */
  width?: string | number;
  /** 是否垂直居中，默认 true */
  centered?: boolean;
  /** 关闭后是否销毁子节点（不挂载），默认 false */
  destroyOnClose?: boolean;
  /** 是否支持 Esc 关闭，默认 true */
  keyboard?: boolean;
  /** 是否可拖动（标题栏拖拽），默认 true */
  draggable?: boolean;
  /** 是否显示全屏切换按钮（与关闭按钮并排），默认 true */
  fullscreenable?: boolean;
  /** 遮罩 class */
  maskClass?: string;
  /** 弹层容器 class */
  wrapClass?: string;
  /** 内容区 class */
  bodyClass?: string;
  /** 额外 class（作用于弹层盒子） */
  class?: string;
}

const defaultWidth = "520px";

/**
 * 标题栏按下时开始拖动：与 ImageViewer 的 useImageDrag 一致，不计算偏移，按下位置即起点，只按位移累加。
 * 在 document 上监听 mousemove/mouseup，requestAnimationFrame 节流 + passive，保证跟手。
 * @param getPosition 当前位移 getter
 * @param setPosition 设置位移
 * @param enabled 是否启用拖动
 */
function useDrag(
  getPosition: () => { x: number; y: number },
  setPosition: (v: { x: number; y: number }) => void,
  enabled: boolean,
) {
  return (e: MouseEvent) => {
    if (!enabled) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = getPosition();
    let rafId = 0;
    const onMove = (ev: MouseEvent) => {
      const nextX = startPos.x + ev.clientX - startX;
      const nextY = startPos.y + ev.clientY - startY;
      if (rafId) globalThis.cancelAnimationFrame(rafId);
      rafId = globalThis.requestAnimationFrame(() => {
        rafId = 0;
        setPosition({ x: nextX, y: nextY });
      });
    };
    const onUp = () => {
      if (rafId) globalThis.cancelAnimationFrame(rafId);
      document.removeEventListener("mousemove", onMove, { passive: true } as AddEventListenerOptions);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseup", onUp);
  };
}

export function Modal(props: ModalProps) {
  const {
    open = false,
    onClose,
    title,
    children,
    footer = null,
    closable = true,
    maskClosable = true,
    width = defaultWidth,
    centered: _centered = true,
    destroyOnClose = false,
    keyboard = true,
    draggable = true,
    fullscreenable = true,
    maskClass,
    wrapClass,
    bodyClass,
    class: className,
  } = props;

  const [fullscreen, setFullscreen] = createSignal(false);
  const [position, setPosition] = createSignal({ x: 0, y: 0 });

  const handleMaskClick = (e: Event) => {
    if (e.target === e.currentTarget && maskClosable) onClose?.();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (keyboard && e.key === "Escape") onClose?.();
  };

  const handleTitleMouseDown = useDrag(() => position(), setPosition, draggable);

  const shouldRender = open || !destroyOnClose;
  if (!shouldRender) return () => null;

  return () => {
    if (!open) {
      document.body.style.overflow = "";
      return null;
    }
    document.body.style.overflow = "hidden";
    const widthStyle = typeof width === "number" ? `${width}px` : width;
    const isFullscreen = fullscreen();
    const pos = position();
    const hasOffset = pos.x !== 0 || pos.y !== 0;
    const modalStyle = isFullscreen
      ? { width: "100%", height: "100%", maxWidth: "100vw", maxHeight: "100vh" }
      : {
        width: widthStyle,
        ...(draggable
          ? {
            transform: `translate(${pos.x}px, ${pos.y}px)`,
            ...(hasOffset ? { willChange: "transform" as const } : {}),
          }
          : {}),
      };
    const modalClass = isFullscreen ? "rounded-none" : "rounded-xl max-h-[90vh]";
    const showHeaderActions = fullscreenable || closable;

    return (
      <div
        class={twMerge(
          "fixed inset-0 flex items-center justify-center",
          isFullscreen ? "z-9999" : "z-300",
          wrapClass,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        tabindex={-1}
        onKeyDown={handleKeyDown as unknown as (e: Event) => void}
      >
        {/* 遮罩 */}
        <div
          class={twMerge(
            "absolute inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm transition-opacity",
            maskClass,
          )}
          onClick={handleMaskClick as unknown as (e: Event) => void}
          aria-hidden
        />
        {/* 弹层 */}
        <div
          class={twMerge(
            "relative z-10 flex flex-col shadow-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100",
            modalClass,
            className,
          )}
          style={modalStyle}
          onClick={(e: Event) => e.stopPropagation()}
        >
          {(title != null && title !== "")
            ? (
              <div
                class={twMerge(
                  "flex items-center justify-between shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-600",
                  draggable && "cursor-grab active:cursor-grabbing select-none",
                )}
                onMouseDown={handleTitleMouseDown as unknown as (e: Event) => void}
              >
                <h2 id="modal-title" class="text-lg font-semibold min-w-0 truncate pr-2">
                  {title}
                </h2>
                {showHeaderActions && (
                  <div class="flex items-center gap-1 shrink-0">
                    {fullscreenable && (
                      <button
                        type="button"
                        aria-label={isFullscreen ? "退出全屏" : "全屏"}
                        class="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                        onMouseDown={(e: Event) => e.stopPropagation()}
                        onClick={(e: Event) => {
                          e.stopPropagation();
                          setFullscreen(!isFullscreen);
                        }}
                      >
                        {isFullscreen
                          ? <IconExitFullscreen class="w-5 h-5" />
                          : <IconMaximize2 class="w-5 h-5" />}
                      </button>
                    )}
                    {closable && (
                      <button
                        type="button"
                        aria-label="关闭"
                        class="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                        onMouseDown={(e: Event) => e.stopPropagation()}
                        onClick={() => onClose?.()}
                      >
                        <IconClose class="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
            : showHeaderActions
            ? (
              <div class="absolute top-4 right-4 z-10 flex items-center gap-1">
                {fullscreenable && (
                  <button
                    type="button"
                    aria-label={isFullscreen ? "退出全屏" : "全屏"}
                    class="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                    onMouseDown={(e: Event) => e.stopPropagation()}
                    onClick={(e: Event) => {
                      e.stopPropagation();
                      setFullscreen(!isFullscreen);
                    }}
                  >
                    {isFullscreen
                      ? <IconExitFullscreen class="w-5 h-5" />
                      : <IconMaximize2 class="w-5 h-5" />}
                  </button>
                )}
                {closable && (
                  <button
                    type="button"
                    aria-label="关闭"
                    class="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                    onMouseDown={(e: Event) => e.stopPropagation()}
                    onClick={() => onClose?.()}
                  >
                    <IconClose class="w-5 h-5" />
                  </button>
                )}
              </div>
            )
            : null}
          <div
            class={twMerge(
              "flex-1 overflow-auto px-6 py-4 min-h-0",
              !(title != null && title !== "") && showHeaderActions && "pt-12 pr-12",
              bodyClass,
            )}
          >
            {children}
          </div>
          {footer != null && (
            <div class="shrink-0 flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 dark:border-slate-600">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  };
}
