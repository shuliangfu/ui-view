/**
 * SignaturePad 签名板（View）。
 * Canvas 手写签名；支持清空、导出 dataURL；经 `onReady` 暴露 {@link SignaturePadHandle}。
 */

import {
  createSignal,
  type JSXRenderable,
  onCleanup,
  useContext,
} from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import type { SizeVariant } from "../../shared/types.ts";
import { resolveFormControlSize } from "../../shared/form/form-control-context.ts";
import { FormItemControlIdContext } from "../../shared/form/form-item-control-id.ts";
import { controlErrorBorder } from "../../shared/form/input-focus-ring.ts";
import { isHtmlElement } from "../../shared/dom-guards.ts";

const signaturePadHeight: Record<SizeVariant, number> = {
  xs: 120,
  sm: 150,
  md: 180,
  lg: 220,
};
const signatureClearCls: Record<SizeVariant, string> = {
  xs: "text-xs px-1.5 py-0.5",
  sm: "text-sm px-2 py-1",
  md: "text-sm px-2 py-1",
  lg: "text-base px-2.5 py-1",
};
const signatureEmptyCls: Record<SizeVariant, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-sm",
  lg: "text-base",
};

export interface SignaturePadProps {
  /** 控件尺寸，与 Input 相同；也可由外层 Form 的 size 注入 */
  size?: SizeVariant;
  /** 画布高度；未传时按 size 取默认（md 为 180） */
  height?: number;
  /** 笔触颜色 */
  penColor?: string;
  /** 线宽 */
  penWidth?: number;
  /** 背景色 */
  backgroundColor?: string;
  /** 笔画结束／清空时回调 dataURL（image/png）；空板为 `null` */
  onChange?: (dataUrl: string | null) => void;
  /**
   * 画布就绪后回调命令式句柄（clear／toDataURL／isEmpty）。
   * 父级可保存 handle 供表单提交前校验。
   */
  onReady?: (handle: SignaturePadHandle) => void;
  class?: string;
  disabled?: boolean;
  /** 错误状态（画布外框红边）；可与 FormItem / createForm bindValue 联用 */
  error?: boolean;
  /** 控件 id；未传时取 FormItemControlIdContext */
  id?: string;
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
  /** 导出；空板返回 `null` */
  toDataURL: (type?: string, quality?: number) => string | null;
  isEmpty: () => boolean;
}

export function SignaturePad(props: SignaturePadProps): JSXRenderable {
  const size = resolveFormControlSize(props.size);
  const {
    height = signaturePadHeight[size],
    penColor = "#0f172a",
    penWidth = 2.5,
    backgroundColor = "#ffffff",
    onChange,
    onReady,
    class: className,
    disabled = false,
    error = false,
    id,
  } = props;
  const m = { ...defaultSignaturePadMessages, ...(props.messages ?? {}) };
  const fromFormItem = useContext(FormItemControlIdContext);
  const resolvedId = id ?? fromFormItem;

  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  const drawing = createSignal(false);
  const empty = createSignal(true);

  const paintBg = () => {
    if (!canvas || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
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

  const toDataURL = (type = "image/png", quality?: number): string | null => {
    if (!canvas || empty.value) return null;
    return quality != null
      ? canvas.toDataURL(type, quality)
      : canvas.toDataURL(type);
  };

  const handle: SignaturePadHandle = {
    clear,
    toDataURL,
    isEmpty: () => empty.value,
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
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    paintBg();
    onReady?.(handle);

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
    <div
      id={resolvedId}
      class={twMerge("signature-pad", className)}
      aria-invalid={error}
    >
      <div
        class={twMerge(
          "relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600",
          error && controlErrorBorder,
        )}
      >
        <canvas
          ref={setRef}
          class="block w-full touch-none"
          style={{ height: `${height}px` }}
          aria-label={m.empty}
          aria-invalid={error}
        />
        {() =>
          empty.value
            ? (
              <div
                class={twMerge(
                  "pointer-events-none absolute inset-0 flex items-center justify-center text-slate-400",
                  signatureEmptyCls[size],
                )}
              >
                {m.empty}
              </div>
            )
            : null}
      </div>
      <div class="mt-2 flex justify-end">
        <button
          type="button"
          class={twMerge(
            "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
            signatureClearCls[size],
          )}
          disabled={disabled}
          onClick={() => clear()}
        >
          {m.clear}
        </button>
      </div>
    </div>
  );
}
