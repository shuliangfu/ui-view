/**
 * 观察容器宽度（弹层／窄栏用容器而不是视口），随 Owner 断开 ResizeObserver。
 */
import { onCleanup, type Signal } from "@dreamer/view";
import { isHtmlElement } from "./dom-guards.ts";

/**
 * 把边框盒宽度规范到百分之一像素，避免 getBoundingClientRect 与
 * ResizeObserver contentRect 的亚像素差来回改写 signal。
 */
export function normalizeContainerWidthPx(width: number): number {
  return Math.round(width * 100) / 100;
}

/** 正的有限宽度才写入 signal；0／未布局的测量不能覆盖已有值，否则会和真实宽度来回跳。 */
export function isUsableContainerWidthPx(width: number): boolean {
  return Number.isFinite(width) && width > 0;
}

/** 读取元素边框盒宽度（与初始测量、观察回调同一口径）。 */
export function readContainerWidthPx(el: Element): number {
  return normalizeContainerWidthPx(el.getBoundingClientRect().width);
}

/**
 * 把元素宽度写入 signal，供表单栅格等按容器收敛布局。
 * 在组件 setup 里调用一次，把返回的 ref 挂到要量的根节点。
 */
export function bindContainerWidth(
  width: Signal<number | undefined>,
): (el: unknown) => void {
  let observer: ResizeObserver | null = null;
  let observed: Element | null = null;
  const apply = (w: number) => {
    if (!isUsableContainerWidthPx(w)) return;
    if (width.value !== w) width.value = w;
  };
  onCleanup(() => {
    observer?.disconnect();
    observer = null;
    observed = null;
  });
  return (el: unknown) => {
    if (!isHtmlElement(el)) {
      observer?.disconnect();
      observer = null;
      observed = null;
      return;
    }
    // 同一节点再次走 ref 时不要重测：提交中途常会读到 0，写回去会和观察回调里的真实宽度循环。
    if (observed === el && observer != null) return;
    observer?.disconnect();
    observer = null;
    observed = el;
    apply(readContainerWidthPx(el));
    if (typeof ResizeObserver === "undefined") return;
    observer = new ResizeObserver((entries) => {
      const target = entries[0]?.target ?? el;
      if (isHtmlElement(target)) apply(readContainerWidthPx(target));
    });
    observer.observe(el);
  };
}
