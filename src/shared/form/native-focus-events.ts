/**
 * focus/blur 不冒泡，不能依赖普通冒泡事件委托。
 * 在 ref 生命周期绑定原生监听，替换节点和组件卸载时移除；先绑定再调用 autofocus ref。
 */
import { onCleanup } from "@dreamer/view";
import type { AutoFocusableRef } from "./auto-focus.ts";

export function bindNativeFocusEvents<T extends HTMLElement>(
  ref: AutoFocusableRef<T> | undefined,
  onFocus?: (event: Event) => void,
  onBlur?: (event: Event) => void,
): (element: T | null) => void {
  let current: T | null = null;
  const detach = () => {
    if (onFocus) current?.removeEventListener("focus", onFocus);
    if (onBlur) current?.removeEventListener("blur", onBlur);
    current = null;
  };
  onCleanup(detach);
  return (element) => {
    if (element !== current) {
      detach();
      current = element;
      if (onFocus) current?.addEventListener("focus", onFocus);
      if (onBlur) current?.addEventListener("blur", onBlur);
    }
    if (typeof ref === "function") ref(element);
    else if (ref) ref.current = element;
  };
}
