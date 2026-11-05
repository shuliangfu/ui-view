/**
 * SignaturePad 签名板（View）。
 * Canvas 手写签名；支持清空、导出 dataURL；可挂表单。
 */

import {
  createSignal,
  type JSXRenderable,
  onCleanup,
} from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { isHtmlElement } from "../../shared/dom-guards.ts";

export interface SignaturePadProps {
  /** 画布高度，默认 180 */
  height?: number;
  /** 笔触颜色 */
  penColor?: string;
  /** 线宽 */
  penWidth?: number;
  /** 背景色 */
  backgroundColor?: string;
  /** 笔画结束／清空时回调 dataURL（image/png） */
  onChange?: (dataUrl: string | null) => void;
  class?: string;
  disabled?: boolean;
  messages?: Partial<SignaturePadMessages>;
}

export interface SignaturePadMessages {
  clear: string;
  empty: string;
}

export const defaultSignaturePadMessages: SignaturePadMessages = {
  clear: "清空",
  empty: "请在此签名",
};

export interface SignaturePadHandle {
  clear: () => void;
  toDataURL: (type?: string) => string | null;
  isEmpty: () => boolean;
}

export function SignaturePad(props: SignaturePadProps): JSXRenderable {
  const {
    height = 180,
    penColor = "#0f172a",
    penWidth = 2.5,
    backgroundColor = "#ffffff",
    onChange,
    class: className,
    disabled = false,
  } = props;
  const m = { ...defaultSignaturePadMessages, ...(props.messages ?? {}) };

  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  const drawing = createSignal(false);
  const empty = createSignal(true);

  const paintBg = () => {
    if (!canvas || !ctx) return;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const emit = () => {
    if (!canvas) return;
    onChange?.(empty.value ? null : canvas.toDataURL("image/png"));
  };

  const clear = () => {
    paintBg();
    empty.value = true;
    emit();
  };

  const setRef = (el: unknown) => {
    if (!isHtmlElement(el)) return;
    canvas = el as HTMLCanvasElement;
    const dpr = globalThis.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const cssW = rect.width || canvas.clientWidth || 300;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.height = `${height}px`;
    ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    paintBg();

    const pos = (e: PointerEvent) => {
      const r = canvas!.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const onDown = (e: PointerEvent) => {
      if (disabled) return;
      drawing.value = true;
      canvas!.setPointerCapture?.(e.pointerId);
      const p = pos(e);
      ctx!.beginPath();
      ctx!.moveTo(p.x, p.y);
    };
    const onMove = (e: PointerEvent) => {
      if (!drawing.value || !ctx) return;
      const p = pos(e);
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth;
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      empty.value = false;
    };
    const onUp = () => {
      if (!drawing.value) return;
      drawing.value = false;
      emit();
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    onCleanup(() => {
      canvas?.removeEventListener("pointerdown", onDown);
      canvas?.removeEventListener("pointermove", onMove);
      canvas?.removeEventListener("pointerup", onUp);
      canvas?.removeEventListener("pointercancel", onUp);
    });
  };

  return (
    <div class={twMerge("signature-pad", className)}>
      <div class="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600">
        <canvas ref={setRef} class="block w-full touch-none" style={{ height: `${height}px` }} />
        {() =>
          empty.value
            ? (
              <div class="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-400">
                {m.empty}
              </div>
            )
            : null}
      </div>
      <div class="mt-2 flex justify-end">
        <button
          type="button"
          class="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1"
          disabled={disabled}
          onClick={() => clear()}
        >
          {m.clear}
        </button>
      </div>
    </div>
  );
}
