/**
 * Hero 英雄区/首屏（View）。
 * 文案叠在**全幅背景**之上；`layout` 只决定整块在左/中/右；`left` 靠左并 `pr-[40%]` 留空给背景，`right` 靠右并 `pl-[40%]`；块内排版同 `center`。
 */

import { twMerge } from "tailwind-merge";
import type { JSXRenderable } from "@dreamer/view";

export type HeroLayout = "center" | "left" | "right";

export interface HeroProps {
  /** 主标题 */
  title: string | unknown;
  /** 副标题（可选） */
  subtitle?: string | unknown;
  /** 描述文案（可选） */
  description?: string | unknown;
  /** 主操作区（CTA 按钮等），渲染在描述下方 */
  extra?: unknown;
  /**
   * 英雄区**整幅背景**（铺满 section，object-cover）。
   * 传入 URL 字符串或任意节点（如 `<img class="size-full object-cover" />`）。
   */
  media?: string | unknown;
  /**
   * 整块文案位置：`center` 水平居中；`left` 靠左、`right` 靠右（`md+` 对侧 `40%` 留白：`pr-[40%]` / `pl-[40%]`）。
   * 标题、段落、按钮在块内均为**与 center 相同的居中排版**（`text-center`），非左对齐/右对齐字序。
   */
  layout?: HeroLayout;
  /** 是否全屏高（min-h-screen），默认 false */
  fullScreen?: boolean;
  /**
   * 无 `media` 时作为底层背景（URL 或节点）；**同时存在 `media` 与 `background` 时**，`background` 叠在 `media` 之上（z 更高），适合做渐变/装饰层。
   */
  background?: string | unknown;
  /** 额外 class（作用于最外层 section） */
  class?: string;
  /** 文案区 class（作用于标题/描述外包层） */
  contentClass?: string;
  /** 子节点（可选，渲染在 extra 下方） */
  children?: unknown;
  /**
   * 盖在背景与文案之间的半透明层 class，默认在「有摄影/位图感背景」时加一层便于读字；传空字符串可关闭。
   * 仅 `background` 为**节点**且无 `media` 时不自动加遮罩（由节点自行控制对比度）。
   */
  overlayClass?: string;
}

/**
 * 绝对定位、cover 铺满的背景层（URL）。
 *
 * @param url - 背景图地址
 * @param zClass - z-index Tailwind 类
 */
function backgroundUrlLayer(url: string, zClass: string) {
  return (
    <div
      class={twMerge(
        "pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat",
        zClass,
      )}
      style={{ backgroundImage: `url(${url})` }}
      aria-hidden="true"
    />
  );
}

export function Hero(props: HeroProps): JSXRenderable {
  const {
    title,
    subtitle,
    description,
    extra,
    media,
    layout = "center",
    fullScreen = false,
    background,
    class: className,
    contentClass,
    children,
    overlayClass,
  } = props;

  const hasMedia = media != null && media !== "";
  const hasBackground = background != null && background !== "";

  /** 底层 z-0：优先 media，否则 background */
  const baseIsMedia = hasMedia;
  const baseString = baseIsMedia
    ? (typeof media === "string" ? media : null)
    : (typeof background === "string" ? background : null);
  const baseNode = baseIsMedia
    ? (typeof media !== "string" ? media : null)
    : (typeof background !== "string" && hasBackground ? background : null);

  /** 叠在 media 之上的 background（仅当两者同时存在） */
  const overlayBgString = hasMedia && hasBackground &&
      typeof background === "string"
    ? background
    : null;
  const overlayBgNode = hasMedia && hasBackground &&
      typeof background !== "string"
    ? background
    : null;

  /**
   * 是否在背景与文案之间加默认暗角遮罩：有 media、或仅有 URL 型 background 时开启；纯 background 节点时不加。
   */
  const useDefaultScrim = hasMedia ||
    (!hasMedia && typeof background === "string" && hasBackground);
  const scrimClass = overlayClass !== undefined
    ? overlayClass
    : useDefaultScrim
    ? "bg-black/50"
    : "";

  const isCenter = layout === "center";
  const isLeft = layout === "left";
  const isRight = layout === "right";

  const textBody = (
    <>
      <h1 class="text-3xl font-bold tracking-tight text-slate-900 drop-shadow-sm md:text-4xl lg:text-5xl dark:text-slate-100">
        {title}
      </h1>
      {subtitle != null && (
        <p class="text-xl font-medium text-slate-700 drop-shadow-sm md:text-2xl dark:text-slate-200">
          {subtitle}
        </p>
      )}
      {description != null && (
        <p class="mx-auto max-w-prose text-base text-slate-800 drop-shadow-sm dark:text-slate-200">
          {description}
        </p>
      )}
      {extra != null && (
        <div class="flex flex-wrap justify-center gap-3 pt-2">
          {extra}
        </div>
      )}
      {children != null && <div class="mt-4">{children}</div>}
    </>
  );

  return (
    <section
      class={twMerge(
        "relative w-full overflow-hidden",
        fullScreen ? "min-h-screen" : "min-h-0",
        className,
      )}
    >
      {baseString != null && baseString !== "" &&
        backgroundUrlLayer(baseString, "z-0")}
      {baseNode != null && (
        <div class="absolute inset-0 z-0 overflow-hidden">{baseNode}</div>
      )}

      {overlayBgString != null && overlayBgString !== "" &&
        backgroundUrlLayer(overlayBgString, "z-[1]")}
      {overlayBgNode != null && (
        <div class="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
          {overlayBgNode}
        </div>
      )}

      {scrimClass !== "" && (
        <div
          class={twMerge(
            "pointer-events-none absolute inset-0 z-[5]",
            scrimClass,
          )}
          aria-hidden="true"
        />
      )}

      <div
        class={twMerge(
          "relative z-10 flex w-full flex-col justify-center py-16",
          // 居中：常规左右留白
          isCenter && "items-center px-4 md:px-8",
          // 左：靠左展示，右侧 pr-[40%] 给背景；右：靠右展示，左侧 pl-[40%] 给背景（勿与对侧 padding 写反）
          isLeft &&
            "items-start px-4 md:pl-8 md:pr-[40%]",
          isRight &&
            "items-end px-4 md:pr-8 md:pl-[40%]",
          !fullScreen && (hasMedia || hasBackground) &&
            "min-h-[280px] md:min-h-[320px]",
        )}
      >
        <div
          class={twMerge(
            "flex w-full max-w-2xl flex-col gap-4 text-center",
            contentClass,
          )}
        >
          {textBody}
        </div>
      </div>
    </section>
  );
}
