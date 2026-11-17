/**
 * 表单控件 `autoFocus`：合并外部 ref，并在挂载后调用 `focus()`。
 * 仅写原生 `autofocus` 不够：页面已加载后再插入的控件通常不会被浏览器自动聚焦。
 */

import type { ViewRefObject } from "@dreamer/view";

/** 对象 ref 或回调 ref，供 input / textarea / 触发器 / 编辑区复用 */
export type AutoFocusableRef<T extends HTMLElement> =
  | ViewRefObject<T>
  | ((el: T | null) => void);

/**
 * 元素是否因 `disabled` 而不应聚焦。
 * 仅当元素自身带有 `disabled` 属性且为 true 时跳过（contenteditable 等无此属性的节点仍可聚焦）。
 *
 * @param el - 已挂载的 DOM 节点
 */
function isDisabledElement(el: HTMLElement): boolean {
  return "disabled" in el &&
    (el as HTMLElement & { disabled: boolean }).disabled === true;
}

/**
 * 把外部 ref 接到可聚焦元素；`autoFocus` 时在插入 DOM 后调用 `focus()`。
 *
 * @param inputRef - 已有对象 ref 或回调 ref，可省略
 * @param autoFocus - 为 true 时挂载后聚焦（元素 disabled 时不聚焦）
 */
export function bindAutoFocusRef<T extends HTMLElement>(
  inputRef: AutoFocusableRef<T> | undefined,
  autoFocus: boolean | undefined,
): AutoFocusableRef<T> | undefined {
  if (!autoFocus) return inputRef;
  return (el: T | null) => {
    if (typeof inputRef === "function") inputRef(el);
    else if (inputRef) inputRef.current = el;
    if (el && !isDisabledElement(el)) el.focus();
  };
}

/**
 * 仅在为 true 时写出原生 `autofocus`，避免 SSR 把 false 序列化成 `autofocus="false"`。
 *
 * @param autoFocus - 是否自动聚焦
 */
export function autoFocusAttr(
  autoFocus: boolean | undefined,
): { autoFocus: true } | Record<PropertyKey, never> {
  return autoFocus ? { autoFocus: true } : {};
}
