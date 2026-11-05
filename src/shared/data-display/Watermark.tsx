/**
 * Watermark 水印（View）。
 * 在容器上铺满重复文字／图片水印；内容区通过 children 叠在上层。
 */

import {
  createEffect,
  createSignal,
  type JSXRenderable,
  onCleanup,
} from "@dreamer/view";
import { twMerge } from "tailwind-merge";

export interface WatermarkProps {
  /** 水印文字（与 image 二选一，image 优先） */
  content?: string | string[];
  /** 水印图片 URL */
  image?: string;
  /** 文字字号，默认 14 */
  fontSize?: number;
  /** 文字颜色，默认半透明灰 */
  color?: string;
  /** 旋转角度（度），默认 -22 */
  rotate?: number;
  /** 水平间距，默认 180 */
  gapX?: number;
  /** 垂直间距，默认 140 */
  gapY?: number;
  /** 额外 class（外层） */
  class?: string;
  /** 被水印覆盖的内容 */
  children?: unknown;
}

/**
 * 生成重复水印的 data-URL（canvas）。
 */
function buildWatermarkDataUrl(opts: {
  content?: string | string[];
  image?: string;
  fontSize: number;
  color: string;
  rotate: number;
  gapX: number;
  gapY: number;
}): Promise<string | null> {
  const doc = typeof globalThis.document !== "undefined"
    ? globalThis.document
    : null;
  if (!doc) return Promise.resolve(null);
  const canvas = doc.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);

  const lines = opts.image
    ? []
    : Array.isArray(opts.content)
    ? opts.content
    : [opts.content ?? ""];
  const w = opts.gapX;
  const h = opts.gapY;
  canvas.width = w;
  canvas.height = h;

  const drawText = () => {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate((opts.rotate * Math.PI) / 180);
    ctx.fillStyle = opts.color;
    ctx.font = `${opts.fontSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lh = opts.fontSize * 1.35;
    const startY = -((lines.length - 1) * lh) / 2;
    lines.forEach((line, i) => {
      ctx.fillText(line, 0, startY + i * lh);
    });
    ctx.restore();
    return canvas.toDataURL("image/png");
  };

  if (opts.image) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.rotate((opts.rotate * Math.PI) / 180);
        const iw = Math.min(opts.gapX * 0.55, img.width);
        const ih = (img.height / img.width) * iw;
        ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih);
        ctx.restore();
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve(drawText());
      img.src = opts.image!;
    });
  }
  return Promise.resolve(drawText());
}

export function Watermark(props: WatermarkProps): JSXRenderable {
  const {
    content = "Watermark",
    image,
    fontSize = 14,
    color = "rgba(0,0,0,0.08)",
    rotate = -22,
    gapX = 180,
    gapY = 140,
    class: className,
    children,
  } = props;

  const bgUrl = createSignal<string | null>(null);

  createEffect(() => {
    let cancelled = false;
    buildWatermarkDataUrl({
      content,
      image,
      fontSize,
      color,
      rotate,
      gapX,
      gapY,
    }).then((url) => {
      if (!cancelled) bgUrl.value = url;
    });
    onCleanup(() => {
      cancelled = true;
    });
  });

  return (
    <div class={twMerge("relative overflow-hidden", className)}>
      {children}
      {() =>
        bgUrl.value
          ? (
            <div
              class="pointer-events-none absolute inset-0 z-10"
              data-dreamer-watermark=""
              style={{
                backgroundImage: `url(${bgUrl.value})`,
                backgroundRepeat: "repeat",
                backgroundSize: `${gapX}px ${gapY}px`,
              }}
              aria-hidden="true"
            />
          )
          : null}
    </div>
  );
}
