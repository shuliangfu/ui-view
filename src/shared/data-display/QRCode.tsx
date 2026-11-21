/**
 * QRCode 二维码（View）。
 * 将文本编码为 SVG 矩阵；算法见 {@link ./qrcode-matrix.ts}，无第三方依赖。
 */

import { createMemo, type JSXRenderable } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { type MaybeSignal, readMaybeSignal } from "../form/maybe-signal.ts";
import { qrMatrix } from "./qrcode-matrix.ts";

export interface QRCodeMessages {
  /** 无障碍说明；显式 `aria-label` 优先 */
  label: string;
}

export const defaultQRCodeMessages: QRCodeMessages = {
  label: "二维码",
};

export interface QRCodeProps {
  /** 编码内容 */
  value: MaybeSignal<string>;
  /** 边长（CSS px），默认 128 */
  size?: number;
  /** 前景色，默认当前文本色倾向的近黑 */
  color?: string;
  /** 背景色 */
  bgColor?: string;
  /** 是否含静默区（白边），默认 true */
  includeMargin?: boolean;
  /** 额外 class */
  class?: string;
  /** 无障碍说明；优先于 messages.label */
  "aria-label"?: string;
  messages?: Partial<QRCodeMessages>;
  /** 中心图标：字符串视为图片地址，其它节点直接渲染 */
  icon?: string | unknown;
}

export function QRCode(props: QRCodeProps): JSXRenderable {
  const m: QRCodeMessages = {
    ...defaultQRCodeMessages,
    ...(props.messages ?? {}),
  };
  const {
    size = 128,
    color = "#0f172a",
    bgColor = "#ffffff",
    includeMargin = true,
    class: className,
    "aria-label": ariaLabelProp,
  } = props;
  const ariaLabel = ariaLabelProp ?? m.label;

  const matrix = createMemo(() => {
    const v = readMaybeSignal(props.value) ?? "";
    try {
      return qrMatrix(v);
    } catch {
      return null;
    }
  });

  return () => {
    const m = matrix();
    if (!m || m.length === 0) {
      return (
        <div
          class={twMerge(
            "inline-flex items-center justify-center border border-dashed border-slate-300 text-slate-400 text-xs",
            className,
          )}
          style={{ width: `${size}px`, height: `${size}px` }}
          data-dreamer-qrcode=""
          role="img"
          aria-label={ariaLabel}
        >
          —
        </div>
      );
    }
    const n = m.length;
    const margin = includeMargin ? 2 : 0;
    const dim = n + margin * 2;
    const cell = size / dim;
    const rects: unknown[] = [];
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (!m[y]![x]) continue;
        rects.push(
          <rect
            key={`${x}-${y}`}
            x={(x + margin) * cell}
            y={(y + margin) * cell}
            width={cell}
            height={cell}
            fill={color}
          />,
        );
      }
    }
    const icon = props.icon;
    const iconSize = Math.round(size * 0.22);
    const svg = (
      <svg
        class={twMerge(
          icon == null ? "inline-block" : "block",
          icon == null ? className : undefined,
        )}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        data-dreamer-qrcode=""
        role="img"
        aria-label={ariaLabel}
      >
        <rect width={size} height={size} fill={bgColor} />
        {rects}
      </svg>
    );
    if (icon == null) return svg;
    return (
      <span
        class={twMerge("relative inline-block", className)}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {svg}
        <span
          class="absolute left-1/2 top-1/2 flex items-center justify-center overflow-hidden rounded-sm bg-white"
          style={{
            width: `${iconSize}px`,
            height: `${iconSize}px`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {typeof icon === "string"
            ? <img src={icon} alt="" class="h-full w-full object-contain" />
            : icon}
        </span>
      </span>
    );
  };
}
