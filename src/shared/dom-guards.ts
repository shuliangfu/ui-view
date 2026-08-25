/**
 * DOM 类型守卫：避免在 Deno SSR / 无 DOM 全局时裸用 `instanceof HTMLElement`
 * 触发 `ReferenceError: HTMLElement is not defined`。
 */

/** `HTMLElement` 构造器（可能不存在） */
function htmlElementCtor(): typeof HTMLElement | undefined {
  return (globalThis as unknown as { HTMLElement?: typeof HTMLElement })
    .HTMLElement;
}

/** `Element` 构造器（可能不存在） */
function elementCtor(): typeof Element | undefined {
  return (globalThis as unknown as { Element?: typeof Element }).Element;
}

/**
 * 是否为 HTMLElement（SSR 安全）。
 */
export function isHtmlElement(node: unknown): node is HTMLElement {
  const Ctor = htmlElementCtor();
  if (typeof Ctor === "function") return node instanceof Ctor;
  return typeof node === "object" && node != null &&
    (node as Node).nodeType === 1 &&
    typeof (node as HTMLElement).getBoundingClientRect === "function";
}

/**
 * 是否为 Element（SSR 安全）。
 */
export function isDomElement(node: unknown): node is Element {
  const Ctor = elementCtor();
  if (typeof Ctor === "function") return node instanceof Ctor;
  return typeof node === "object" && node != null &&
    (node as Node).nodeType === 1;
}

/**
 * 是否为 Node（SSR 安全）。
 */
export function isDomNode(node: unknown): node is Node {
  const Ctor = (globalThis as unknown as { Node?: typeof Node }).Node;
  if (typeof Ctor === "function") return node instanceof Ctor;
  return typeof node === "object" && node != null &&
    typeof (node as Node).nodeType === "number";
}

/**
 * 是否为指定 HTML*Element 子类（SSR 安全，带类型收窄）。
 *
 * @param name - 如 `"HTMLInputElement"` / `"HTMLTextAreaElement"` / `"HTMLDivElement"`
 */
export function isHtmlElementOf(
  node: unknown,
  name: "HTMLInputElement",
): node is HTMLInputElement;
export function isHtmlElementOf(
  node: unknown,
  name: "HTMLTextAreaElement",
): node is HTMLTextAreaElement;
export function isHtmlElementOf(
  node: unknown,
  name: "HTMLDivElement",
): node is HTMLDivElement;
export function isHtmlElementOf(
  node: unknown,
  name: "HTMLSpanElement",
): node is HTMLSpanElement;
export function isHtmlElementOf(
  node: unknown,
  name: "HTMLButtonElement",
): node is HTMLButtonElement;
export function isHtmlElementOf(
  node: unknown,
  name:
    | "HTMLInputElement"
    | "HTMLTextAreaElement"
    | "HTMLDivElement"
    | "HTMLSpanElement"
    | "HTMLButtonElement",
): boolean {
  const Ctor = (globalThis as unknown as Record<string, unknown>)[name];
  if (typeof Ctor === "function") {
    return node instanceof (Ctor as new () => HTMLElement);
  }
  return isHtmlElement(node);
}
