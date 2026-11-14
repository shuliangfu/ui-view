/**
 * 观察容器宽度（弹层／窄栏用容器而不是视口），随 Owner 断开 ResizeObserver。
 */
import { onCleanup, type Signal } from "@dreamer/view";
import { isHtmlElement } from "./dom-guards.ts";

/**
 * 把元素宽度写入 signal，供表单栅格等按容器收敛布局。
 * 在组件 setup 里调用一次，把返回的 ref 挂到要量的根节点。
 */
export function bindContainerWidth(
  width: Signal<number | undefined>,
): (el: unknown) => void {
  let observer: ResizeObserver | null = null;
  const apply = (w: number) => {
    if (width.value !== w) width.value = w;
  };
  onCleanup(() => {
    observer?.disconnect();
    observer = null;
  });
  return (el: unknown) => {
    observer?.disconnect();
    observer = null;
    if (!isHtmlElement(el)) return;
    apply(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === "undefined") return;
    observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w != null) apply(w);
    });
    observer.observe(el);
  };
}
