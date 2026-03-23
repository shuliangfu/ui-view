/**
 * Image 图片（View）。
 * 懒加载、占位、预览（点击放大）、object-fit、fallback。
 */

import { twMerge } from "tailwind-merge";
import { createEffect, onCleanup } from "@dreamer/view";
import { createSignal } from "@dreamer/view/signal";

export interface ImageProps {
  /** 列表渲染时的 key（用于 map 等场景） */
  key?: string | number;
  /** 图片地址 */
  src: string;
  /** 替代文案 */
  alt?: string;
  /** 宽度（px 或 string） */
  width?: number | string;
  /** 高度（px 或 string） */
  height?: number | string;
  /** 填充方式：contain | cover | fill | none */
  fit?: "contain" | "cover" | "fill" | "none";
  /** 占位图（加载中或懒加载未加载时） */
  placeholder?: unknown;
  /** 加载失败时显示的 fallback 节点 */
  fallback?: string | unknown;
  /** 是否懒加载（需 IntersectionObserver） */
  lazy?: boolean;
  /** 是否支持点击预览（弹层大图） */
  preview?: boolean;
  /** 是否禁用预览 */
  previewDisabled?: boolean;
  /** 圆角，默认 false */
  rounded?: boolean | "sm" | "md" | "lg" | "full";
  /** 额外 class */
  class?: string;
}

const roundedClasses: Record<string, string> = {
  true: "rounded",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
};

const objectFitClasses: Record<NonNullable<ImageProps["fit"]>, string> = {
  contain: "object-contain",
  cover: "object-cover",
  fill: "object-fill",
  none: "object-none",
};

export function Image(props: ImageProps) {
  const {
    key: keyProp,
    src,
    alt = "",
    width,
    height,
    fit = "cover",
    placeholder: _placeholder,
    fallback,
    lazy = false,
    preview = false,
    previewDisabled = false,
    rounded = false,
    class: className,
  } = props;

  const statusRef = createSignal<"loading" | "loaded" | "error">("loading");
  const imgElRef = createSignal<HTMLImageElement | null>(null);

  /** 卸载时清空 img.src 以释放解码位图内存，减轻轮播等多图场景占用 */
  createEffect(() => {
    onCleanup(() => {
      const el = imgElRef.value;
      if (el && el.src) el.src = "";
    });
  });

  /** 重定向后 onLoad 可能不触发，定时检查 img.complete 用于 placeholder 场景和 loaded 状态 */
  createEffect(() => {
    const el = imgElRef.value;
    if (!el || statusRef.value !== "loading") return;
    const t = setTimeout(() => {
      if (el.complete) statusRef.value = "loaded";
    }, 2000);
    return () => clearTimeout(t);
  });

  const style: Record<string, string> = {};
  if (width != null) {
    style.width = typeof width === "number" ? `${width}px` : width;
  }
  if (height != null) {
    style.height = typeof height === "number" ? `${height}px` : height;
  }

  const roundedCls = typeof rounded === "boolean"
    ? rounded ? "rounded" : ""
    : roundedClasses[rounded] ?? "rounded";

  const handleLoad = () => {
    statusRef.value = "loaded";
  };

  const handleError = () => {
    statusRef.value = "error";
  };

  const handleClick = () => {
    if (
      statusRef.value === "error" ||
      (preview && !previewDisabled &&
        typeof globalThis.document !== "undefined")
    ) {
      if (statusRef.value === "error") return;
      const wrap = globalThis.document.createElement("div");
      wrap.className =
        "fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4";
      wrap.setAttribute("aria-modal", "true");
      wrap.setAttribute("role", "dialog");
      const img = globalThis.document.createElement("img");
      img.src = src;
      img.alt = alt ?? "";
      img.className = "max-w-full max-h-full object-contain";
      wrap.appendChild(img);
      const close = () => {
        wrap.removeEventListener("click", close);
        wrap.remove();
      };
      wrap.addEventListener("click", close);
      globalThis.document.body.appendChild(wrap);
    }
  };

  /**
   * 使用渲染 getter：在内部读 `statusRef.value` / `imgElRef`，以便加载态与 ref 更新触发细粒度更新。
   */
  return () => (
    <div
      key={keyProp}
      class={twMerge(
        "relative inline-block overflow-hidden bg-slate-100 dark:bg-slate-800",
        roundedCls,
        className,
      )}
      style={style}
    >
      {statusRef.value === "loading" && _placeholder && (
        <div class="absolute inset-0 flex items-center justify-center text-slate-400">
          {_placeholder}
        </div>
      )}
      {statusRef.value === "error" && fallback && (
        <div class="absolute inset-0 flex items-center justify-center text-slate-500 bg-slate-100 dark:bg-slate-800">
          {fallback}
        </div>
      )}
      <img
        ref={(el: unknown) => {
          imgElRef.value = el as HTMLImageElement | null;
        }}
        src={src}
        alt={alt}
        loading={lazy ? "lazy" : "eager"}
        referrerPolicy="no-referrer"
        class={twMerge(
          "w-full h-full transition-opacity duration-300",
          objectFitClasses[fit],
          statusRef.value === "error" ? "opacity-0" : "opacity-100",
          preview && !previewDisabled && "cursor-zoom-in",
        )}
        onLoad={handleLoad}
        onError={handleError}
        onClick={handleClick}
      />
    </div>
  );
}
