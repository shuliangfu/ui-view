import { isDomElement } from "../dom-guards.ts";
/**
 * 内联自绘下拉（Select / MultiSelect / TreeSelect）的「点外部关闭」。
 *
 * 仅用 `fixed inset-0` 遮罩不可靠：祖先 `transform` 会改变 fixed 包含块，且其它控件可能叠在遮罩之上，
 * 导致选项选中与点击外部均无法关闭。与 {@link Cascader} 一致，在 document 冒泡阶段监听 `click`。
 */

import { createEffect, createRenderEffect, onCleanup } from "@dreamer/view";

/** 浮层根节点：关闭时 `hidden` + `aria-hidden`，避免依赖 Show 卸载导致委托句柄丢失。 */
export const inlineDropdownPanelHiddenClass = "hidden";

/**
 * 将浮层 DOM 可见性与 openState 同步（直接写 classList，兜底 Show/insert 未卸载场景）。
 *
 * @param isOpen 是否展开。
 * @param getPanelEl 浮层包裹元素（含 backdrop + listbox）。
 */
export function syncInlineDropdownPanelVisibility(
  isOpen: () => boolean,
  getPanelEl: () => HTMLElement | null,
): void {
  createRenderEffect(() => {
    const open = isOpen();
    const panel = getPanelEl();
    if (!panel) return;
    panel.classList.toggle(inlineDropdownPanelHiddenClass, !open);
    if (open) {
      panel.removeAttribute("aria-hidden");
      panel.removeAttribute("inert");
    } else {
      panel.setAttribute("aria-hidden", "true");
      panel.setAttribute("inert", "");
    }
  });
}

/**
 * 选项主键选择：在 pointerdown 执行 pick，避免部分页面 click 未派发或 Show 重挂载导致 onClick 失效。
 *
 * @param ev pointer/mouse 事件。
 * @param pick 选中逻辑（写 value + 关面板）。
 * @param disabled 是否禁用。
 */
export function pickInlineDropdownOption(
  ev: Event,
  pick: () => void,
  disabled?: boolean,
): void {
  if (disabled) return;
  const pe = ev as PointerEvent;
  if (typeof pe.button === "number" && pe.button !== 0) return;
  /**
   * 阻止默认行为并停止冒泡：dreamerweave 等页面常用 `<label>` 包住整个 Select，
   * 若不拦截，点选项会触发 label 关联到 hidden input/触发按钮，表现为选不中、面板不关。
   * 文档站用 FormItem（label 与控件兄弟节点）故无此问题。
   */
  ev.preventDefault();
  ev.stopPropagation();
  pick();
}

/**
 * 判断指针事件是否发生在 `root` 子树内。
 *
 * @param e DOM 事件。
 * @param root 组件根节点（触发器 + 浮层）。
 */
export function eventTargetInsideRoot(
  e: Event,
  root: HTMLElement | null,
): boolean {
  if (!root) return false;
  if (typeof e.composedPath === "function") {
    const path = e.composedPath();
    if (path.length > 0 && path.includes(root)) return true;
  }
  const raw = e.target;
  let n: Node | null = raw instanceof Node ? raw : null;
  if (n && n.nodeType === 3) {
    n = n.parentNode;
  }
  return n instanceof Node && root.contains(n);
}

/**
 * 用 `elementsFromPoint` 兜底：叠层导致 `target` 落在 root 外时仍视为内部点击。
 *
 * @param e 鼠标类事件。
 * @param root 组件根。
 */
export function pressEventLikelyInsideRoot(
  e: Event,
  root: HTMLElement | null,
): boolean {
  if (!root) return false;
  if (eventTargetInsideRoot(e, root)) return true;

  const me = e as Partial<MouseEvent>;
  const x = me.clientX;
  const y = me.clientY;
  if (
    typeof x !== "number" ||
    typeof y !== "number" ||
    Number.isNaN(x) ||
    Number.isNaN(y)
  ) {
    return false;
  }

  const doc = root.ownerDocument;
  if (!doc || typeof doc.elementsFromPoint !== "function") {
    return false;
  }

  let stack: Element[];
  try {
    stack = doc.elementsFromPoint(x, y) as Element[];
  } catch {
    return false;
  }
  if (!stack || stack.length === 0) return false;

  for (let i = 0; i < stack.length; i++) {
    const el = stack[i]!;
    if (isDomElement(el) && root.contains(el)) {
      return true;
    }
  }
  return false;
}

/**
 * 本次 `click` 的 `composedPath` 是否经过 `root`。
 *
 * @param e click 事件。
 * @param root 组件根。
 */
export function clickComposedPathIncludesRoot(
  e: Event,
  root: HTMLElement | null,
): boolean {
  if (!root || typeof e.composedPath !== "function") return false;
  try {
    return e.composedPath().includes(root);
  } catch {
    return false;
  }
}

/**
 * 下拉展开时在 document 冒泡阶段注册「点外部关闭」。
 *
 * @param isOpen 是否展开的 getter（读取 `openState.value`）。
 * @param getRootEl 组件根 DOM。
 * @param close 关闭回调（应写 `openState.value = false`）。
 */
export function installInlineDropdownOutsideClickClose(
  isOpen: () => boolean,
  getRootEl: () => HTMLElement | null,
  close: () => void,
): void {
  createEffect(() => {
    if (!isOpen()) return;
    const doc = globalThis.document;
    if (!doc) return;

    let disposed = false;
    let attached = false;

    const onClickOutsideBubble = (e: Event) => {
      if (!isOpen()) return;
      if (
        e instanceof MouseEvent &&
        typeof e.button === "number" &&
        e.button !== 0
      ) {
        return;
      }
      const root = getRootEl();
      if (!root) return;
      if (clickComposedPathIncludesRoot(e, root)) return;
      if (pressEventLikelyInsideRoot(e, root)) return;
      close();
    };

    const attach = () => {
      if (disposed || !isOpen()) return;
      attached = true;
      doc.addEventListener("click", onClickOutsideBubble, false);
    };

    queueMicrotask(attach);

    onCleanup(() => {
      disposed = true;
      if (attached) {
        doc.removeEventListener("click", onClickOutsideBubble, false);
      }
    });
  });
}
