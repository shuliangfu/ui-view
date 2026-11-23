import { isDomElement } from "../dom-guards.ts";
/**
 * 内联自绘下拉（Select / MultiSelect / TreeSelect）的「点外部关闭」。
 *
 * 仅用 `fixed inset-0` 遮罩不可靠：祖先 `transform` 会改变 fixed 包含块，且其它控件可能叠在遮罩之上，
 * 导致选项选中与点击外部均无法关闭。与 {@link Cascader} 一致，在 document 冒泡阶段监听 `click`。
 */

import { createEffect, createRenderEffect, onCleanup } from "@dreamer/view";
import {
  type PickerOverlayDisposeSlot,
  registerPickerFixedOverlayPositionAndOutsideClick,
  resolvePickerViewportAttach,
} from "./picker-portal-utils.ts";

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
 * 用 `elementsFromPoint` 最上层命中兜底重绘后的目标判断；不穿透外部遮挡层。
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

  // 仅最上层实际命中有效；被页头等遮住的全屏下拉遮罩不能把外部点击算成内部。
  const top = stack.find(isDomElement);
  return top != null && root.contains(top);
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

/**
 * 当应使用视口定位且浮层打开时，把 listbox 改为视口 `fixed` 并跟随触发器，
 * 避免被表格 `overflow-x-auto`、Modal 正文 overflow、底栏等裁切或遮挡。
 * `isViewport` 为 false 时仍会检测裁切祖先（含 Modal），自动升级为视口定位。
 * 最小宽度取 `panelMinWidth` 与触发器宽度的较大值。
 *
 * @param isViewport 是否显式使用视口定位。
 * @param isOpen 浮层是否打开。
 * @param getPanel listbox 根节点。
 * @param triggerRef 触发器。
 * @param close 点外部时关闭。
 * @param panelMinWidth 最小宽度（像素），多选顶栏按钮需要约 216。
 */
export function bindFixedDropdownPanelWhenOpen(
  isViewport: () => boolean,
  isOpen: () => boolean,
  getPanel: () => HTMLElement | null,
  triggerRef: { current: HTMLElement | null },
  close: () => void,
  panelMinWidth?: number,
): void {
  const outsideSlot: PickerOverlayDisposeSlot = { dispose: null };
  const scrollSlot: PickerOverlayDisposeSlot = { dispose: null };

  const clear = (panel?: HTMLElement | null): void => {
    outsideSlot.dispose?.();
    scrollSlot.dispose?.();
    outsideSlot.dispose = null;
    scrollSlot.dispose = null;
    if (!panel) return;
    panel.style.removeProperty("top");
    panel.style.removeProperty("left");
    panel.style.removeProperty("z-index");
    panel.style.removeProperty("min-width");
    panel.style.removeProperty("position");
    panel.style.removeProperty("margin-top");
  };

  const shouldViewport = (panel?: HTMLElement | null): boolean =>
    resolvePickerViewportAttach(
      isViewport() ? "viewport" : "anchored",
      triggerRef.current ?? panel ?? null,
    );

  createEffect(() => {
    if (!isOpen()) {
      clear(getPanel());
      return;
    }
    const panel = getPanel();
    if (!panel) return;
    if (!shouldViewport(panel)) {
      clear(panel);
      return;
    }
    queueMicrotask(() => {
      if (!isOpen() || getPanel() !== panel || !shouldViewport(panel)) return;
      const tw = triggerRef.current?.getBoundingClientRect().width ?? 0;
      const minW = Math.max(panelMinWidth ?? 0, tw);
      if (minW > 0) panel.style.minWidth = `${Math.round(minW)}px`;
      registerPickerFixedOverlayPositionAndOutsideClick(
        panel,
        triggerRef,
        close,
        outsideSlot,
        scrollSlot,
        { panelMinWidth: minW || undefined, marginBelow: 4 },
      );
    });
    onCleanup(() => clear(panel));
  });
}
