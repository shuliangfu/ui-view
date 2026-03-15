/**
 * Affix 固钉（View）。
 * 滚动时固定在视口顶部或底部；offsetTop / offsetBottom，需在挂载后监听 scroll 并切换固定定位。
 */

import { twMerge } from "tailwind-merge";

export interface AffixProps {
  /** 子节点 */
  children?: unknown;
  /** 距离视口顶部的偏移（px）；不传则贴顶 */
  offsetTop?: number;
  /** 距离视口底部的偏移（px）；与 offsetTop 二选一，用于底部固定 */
  offsetBottom?: number;
  /** 额外 class（包装器） */
  class?: string;
  /** 固定时的 class（如 shadow） */
  affixClass?: string;
}

export function Affix(props: AffixProps) {
  const {
    children,
    offsetTop,
    offsetBottom,
    class: className,
    affixClass,
  } = props;

  return () => (
    <div
      class={twMerge("affix-host", className)}
      data-affix-offset-top={offsetTop ?? ""}
      data-affix-offset-bottom={offsetBottom ?? ""}
      data-affix-class={affixClass ?? ""}
    >
      {children}
    </div>
  );
}

/** initAffix 的配置：可指定滚动容器（非 window 时用） */
export interface AffixInitOptions {
  /** 滚动容器元素；不传则使用 window/document 的滚动 */
  target?: Element | (() => Element | null);
}

/**
 * 在客户端为所有 .affix-host 绑定滚动/resize 监听并切换固定样式。
 * 应在应用启动或布局挂载后调用一次（如 body 挂载后）。
 * 传 options.target 时监听该元素的 scroll，并在此容器内使用 sticky 固定。
 */
export function initAffix(options?: AffixInitOptions) {
  if (typeof globalThis.document === "undefined") return;
  const getTarget = (): Element | null => {
    if (!options?.target) return null;
    return typeof options.target === "function"
      ? options.target()
      : options.target;
  };
  const run = () => {
    const target = getTarget();
    const hosts = target
      ? Array.from(target.querySelectorAll(".affix-host"))
      : Array.from(globalThis.document.querySelectorAll(".affix-host"));
    hosts.forEach((el) => updateAffix(el as HTMLElement, target));
  };
  const onScroll = () => run();
  const target = getTarget();
  if (target) {
    target.addEventListener("scroll", onScroll, { passive: true });
  } else {
    globalThis.addEventListener("scroll", onScroll, { passive: true });
  }
  globalThis.addEventListener("resize", run);
  run();
  return () => {
    const t = getTarget();
    if (t) t.removeEventListener("scroll", onScroll);
    else globalThis.removeEventListener("scroll", onScroll);
    globalThis.removeEventListener("resize", run);
  };
}

function updateAffix(el: HTMLElement, scrollTarget: Element | null) {
  const top = el.getAttribute("data-affix-offset-top");
  const bottom = el.getAttribute("data-affix-offset-bottom");
  const affixClass = el.getAttribute("data-affix-class") ?? "";
  const rect = el.getBoundingClientRect();
  const isBottom = bottom !== "" && bottom !== null;
  const offset = isBottom ? Number(bottom) || 0 : Number(top) || 0;

  let fixed = false;
  if (scrollTarget) {
    const scrollTop = "scrollTop" in scrollTarget
      ? (scrollTarget as HTMLElement).scrollTop
      : 0;
    const clientHeight = "clientHeight" in scrollTarget
      ? (scrollTarget as HTMLElement).clientHeight
      : 0;
    const st = scrollTarget.getBoundingClientRect();
    const hostTop = rect.top - st.top + scrollTop;
    if (isBottom) {
      fixed = hostTop + rect.height >= scrollTop + clientHeight - offset;
    } else {
      fixed = scrollTop >= hostTop - offset;
    }
  } else {
    if (isBottom) fixed = rect.bottom >= globalThis.innerHeight - offset;
    else fixed = rect.top <= offset;
  }

  if (fixed) {
    if (scrollTarget) {
      el.style.position = "sticky";
      el.style.top = isBottom ? "" : `${offset}px`;
      el.style.bottom = isBottom ? `${offset}px` : "";
      el.style.left = "";
      el.style.width = "";
    } else {
      el.style.position = "fixed";
      el.style.left = `${rect.left}px`;
      el.style.width = `${rect.width}px`;
      el.style.top = isBottom ? "auto" : `${offset}px`;
      el.style.bottom = isBottom ? `${offset}px` : "auto";
    }
    if (affixClass) el.classList.add(...affixClass.split(" "));
  } else {
    el.style.position = "";
    el.style.left = "";
    el.style.width = "";
    el.style.top = "";
    el.style.bottom = "";
    if (affixClass) el.classList.remove(...affixClass.split(" "));
  }
}
