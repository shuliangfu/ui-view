/**
 * Image 图片（View）。
 * 懒加载、占位、预览（点击放大）、object-fit、fallback。
 */

import { twMerge } from "tailwind-merge";
import type { JSXRenderable } from "@dreamer/view";
import { createEffect, onCleanup } from "@dreamer/view";
import { createSignal } from "@dreamer/view";

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
  /**
   * 保留兼容；**不再在组件内渲染**任何「加载失败」类文案层，失败时仅显示 {@link IMAGE_BUILTIN_FALLBACK_SRC} 或 `fallbackSrc`。
   */
  fallback?: string | unknown;
  /**
   * 加载失败时的占位图 URL（覆盖 {@link IMAGE_BUILTIN_FALLBACK_SRC}）。
   * 非空字符串才生效；未传或空白则使用内置缺省图。
   */
  fallbackSrc?: string;
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

/**
 * 加载失败时使用的内置占位图（SVG data URI，无网络请求）：**山水剪影 + 纵向撕裂缝**（灰青色系，无红色）。
 * 未传 `fallbackSrc` 或空串时用本图；非空 `fallbackSrc` 由业务覆盖。
 */
export const IMAGE_BUILTIN_FALLBACK_SRC: string = "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">' +
      '<rect x="7" y="9" width="66" height="62" rx="8" fill="rgba(148,163,184,0.2)" stroke="#64748b" stroke-width="2.2"/>' +
      '<rect x="11" y="13" width="58" height="26" rx="3" fill="#a8b8cc"/>' +
      '<circle cx="56" cy="26" r="6.5" fill="#e2e8f0" opacity="0.95"/>' +
      '<path d="M11 48 L26 30 L38 38 L54 22 L69 40 V57 H11 Z" fill="#5b6b7f"/>' +
      '<path d="M11 52 L24 34 L40 44 L58 26 L69 44 V57 H11 Z" fill="#475569"/>' +
      '<path d="M36 14 L39 22 L34 31 L40 39 L35 48 L39 56 L36 64 L39 72" fill="none" stroke="#0f172a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.72"/>' +
      '<path d="M35 14 L37 22 L33 31 L38 39 L34 48 L37 56 L35 64 L37 72" fill="none" stroke="#cbd5e1" stroke-width="1.1" stroke-linecap="round" opacity="0.45"/>' +
      "</svg>",
  );

/**
 * 用户 `fallbackSrc` 是否可直接写入 `img.src`。
 * 内置 SVG data URI 不走此检查，由 {@link IMAGE_BUILTIN_FALLBACK_SRC} 受信写入。
 */
function isSafeFallbackSrc(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("vbscript:")) {
    return false;
  }
  if (lower.startsWith("data:")) {
    return /^data:image\/(png|jpeg|jpg|gif|webp|bmp|avif|x-icon|vnd\.microsoft\.icon)[;,]/
      .test(
        lower,
      );
  }
  return true;
}

export function Image(props: ImageProps): JSXRenderable {
  const {
    key: keyProp,
    src,
    alt = "",
    width,
    height,
    fit = "cover",
    placeholder: _placeholder,
    fallbackSrc,
    lazy = false,
    preview = false,
    previewDisabled = false,
    rounded = false,
    class: className,
  } = props;

  const statusRef = createSignal<"loading" | "loaded" | "error">("loading");
  const imgElRef = createSignal<HTMLImageElement | null>(null);

  /**
   * 失败占位地址：用户显式传入非空 `fallbackSrc` 时优先，否则用内置 SVG。
   *
   * 内置 `data:image/svg+xml` 不能走 JSX `src`：@dreamer/view 的 `sanitizeUrl`
   * 会把它当作可执行 data MIME 丢掉（防 href／style XSS），结果 src 被摘掉，
   * 只剩浏览器裂图图标。写入 DOM 属性与 Carousel 相同，仅用于这份受信内置图；
   * 用户 `fallbackSrc` 仅接受相对地址、http(s)、blob 与栅格 data:image。
   */
  const userFallbackSrc =
    typeof fallbackSrc === "string" && fallbackSrc.trim() !== ""
      ? fallbackSrc.trim()
      : "";
  const errorPlaceholderSrc = isSafeFallbackSrc(userFallbackSrc)
    ? userFallbackSrc
    : IMAGE_BUILTIN_FALLBACK_SRC;

  const applyErrorPlaceholder = (el: HTMLImageElement) => {
    if (el.getAttribute("src") !== errorPlaceholderSrc) {
      el.src = errorPlaceholderSrc;
    }
  };

  /** 进入失败态并换上占位图；已在 error 时再触发则忽略，避免 onError 抖动。 */
  const enterError = () => {
    if (statusRef.value === "error") return;
    statusRef.value = "error";
    const el = imgElRef.value;
    if (el) applyErrorPlaceholder(el);
  };

  /**
   * 主资源成功解码为 `loaded`。失败态下主图已换成占位图，其 `load` 不得把状态改回 loaded。
   */
  const onImgLoad = (ev: Event) => {
    if (statusRef.value === "error") return;
    const el = ev.currentTarget as HTMLImageElement;
    if (el.naturalWidth <= 0 && el.naturalHeight <= 0) return;
    statusRef.value = "loaded";
  };
  const onImgError = () => enterError();

  /** 卸载时摘掉监听并清空 img.src，释放解码位图内存 */
  createEffect(() => {
    onCleanup(() => {
      const el = imgElRef.value;
      if (!el) return;
      el.removeEventListener("load", onImgLoad);
      el.removeEventListener("error", onImgError);
      if (el.src) el.src = "";
    });
  });

  /**
   * 重定向后 onLoad 可能不触发，定时检查 `complete` + `naturalWidth` 作为补救。
   * 破损图也会 `complete === true`，须用 `naturalWidth > 0` 区分，否则会误判为 loaded；
   * 且不可仅用 `complete`，否则与 onError 竞态时行为混乱。
   * 已 complete 的破损图立即 enterError，不等 2 秒。
   */
  createEffect(() => {
    const el = imgElRef.value;
    if (!el || statusRef.value !== "loading") return;
    const settle = () => {
      if (statusRef.value !== "loading") return;
      if (el.complete && el.naturalWidth > 0) statusRef.value = "loaded";
      else if (el.complete && el.naturalWidth <= 0) enterError();
    };
    settle();
    const t = setTimeout(settle, 2000);
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

  const handleClick = () => {
    if (
      statusRef.value === "error" ||
      (preview && !previewDisabled &&
        typeof globalThis.document !== "undefined")
    ) {
      if (statusRef.value === "error") return;
      const wrap = globalThis.document.createElement("div");
      wrap.className =
        "fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-4";
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
   * 须返回稳定宿主，勿用 `return () =>` 包住整棵树。也**勿在 JSX 顶层直接读 `statusRef.value`**
   * （含 `{status && …}` 条件子节点），否则外层 `insert` 的 effect 会订阅 `statusRef`，
   * 每次 loading/error 切换都会 `cleanNode` 并整段重建 DOM（与兄弟节点数组尾锚一起闪）。
   *
   * 状态只应在**原生节点**的函数型 props 内读取：`setProperty` 会为 `class` 等单独挂 `createRenderEffect`，
   * 只改属性、不换节点。`placeholder` 用常驻覆盖层 + `hidden` 切换，子节点个数不变。
   *
   * `<img>` 须保持为第一个子节点，避免先插覆盖层再挂 img 时协调器误换 img 实例（见历史 issue）。
   *
   * JSX `src` 只绑主资源，失败时由 {@link applyErrorPlaceholder} 直接改 DOM
   * （同一 `<img>`），避免内置 SVG data URI 被 sanitizeUrl 摘掉。
   */
  return (
    <div
      key={keyProp}
      class={twMerge(
        "relative inline-block overflow-hidden bg-slate-100 dark:bg-slate-800",
        roundedCls,
        className,
      )}
      style={style}
    >
      <img
        ref={(el: unknown) => {
          const node = el as HTMLImageElement | null;
          const prev = imgElRef.value;
          if (prev && prev !== node) {
            prev.removeEventListener("load", onImgLoad);
            prev.removeEventListener("error", onImgError);
          }
          imgElRef.value = node;
          if (!node) return;
          node.addEventListener("load", onImgLoad);
          node.addEventListener("error", onImgError);
        }}
        src={src}
        loading={() => statusRef.value === "error" || !lazy ? "eager" : "lazy"}
        referrerPolicy="no-referrer"
        aria-hidden={() => statusRef.value === "loading" ? true : undefined}
        alt={alt}
        class={() =>
          twMerge(
            "w-full h-full transition-opacity duration-300",
            /**
             * 失败态用 `object-contain`：内置 SVG / `fallbackSrc` 保持宽高比居中，
             * 非正方形容器不裁切、不拉伸；主图仍由 `fit`（默认 cover）控制。
             */
            statusRef.value === "error"
              ? "object-contain opacity-100"
              : objectFitClasses[fit],
            statusRef.value === "loading" ? "opacity-0" : "opacity-100",
            preview && !previewDisabled && statusRef.value === "loaded" &&
              "cursor-zoom-in",
          )}
        onLoad={onImgLoad}
        onError={onImgError}
        onClick={handleClick}
      />
      {_placeholder
        ? (
          <div
            class={() =>
              twMerge(
                "absolute inset-0 z-1 flex items-center justify-center text-slate-400",
                statusRef.value === "loading" ? "" : "hidden",
              )}
          >
            {_placeholder}
          </div>
        )
        : null}
    </div>
  );
}
