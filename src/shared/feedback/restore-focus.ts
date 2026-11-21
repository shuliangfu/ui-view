/**
 * 弹层／抽屉关闭后还焦：记住打开前的触发器，并在卸载后把焦点从 body 再还回去。
 */
import { onCleanup } from "@dreamer/view";

const PANEL_SELECTOR = "[data-ui-modal-panel], [data-ui-drawer-panel]";
const FOCUSABLE_SELECTOR =
  "button, [href], input:not([type='hidden']), select, textarea, [tabindex]:not([tabindex='-1'])";

let lastOutsideFocus: HTMLElement | null = null;
let listenCount = 0;
let listenDoc: Document | null = null;

/** 取弹层外最近的可聚焦宿主（点到按钮内文字或图标时还到按钮本身）。 */
function focusableOutside(el: EventTarget | null): HTMLElement | null {
  if (!(el instanceof Element)) return null;
  if (el.closest(PANEL_SELECTOR)) return null;
  const host = el.closest(FOCUSABLE_SELECTOR);
  const node = host instanceof HTMLElement
    ? host
    : el instanceof HTMLElement
    ? el
    : null;
  if (!node) return null;
  const doc = node.ownerDocument;
  if (node === doc.body || node === doc.documentElement) return null;
  return node;
}

function rememberOutsideFocus(event: Event): void {
  const node = focusableOutside(event.target);
  if (node) lastOutsideFocus = node;
}

/** 在 Modal／Drawer 组件体里调用：多实例共用一份捕获监听，随最后一实例卸载。 */
export function retainOutsideFocusListener(doc: Document | null): void {
  if (!doc) return;
  if (listenCount === 0) {
    listenDoc = doc;
    doc.addEventListener("pointerdown", rememberOutsideFocus, true);
    doc.addEventListener("focusin", rememberOutsideFocus, true);
  }
  listenCount += 1;
  onCleanup(() => {
    listenCount -= 1;
    if (listenCount === 0 && listenDoc) {
      listenDoc.removeEventListener("pointerdown", rememberOutsideFocus, true);
      listenDoc.removeEventListener("focusin", rememberOutsideFocus, true);
      listenDoc = null;
    }
  });
}

/** 优先用打开前记下的触发器；若尚未记下，再用当前焦点（须仍在弹层外）。 */
export function resolveRestoreFocusTarget(doc: Document): HTMLElement | null {
  return focusableOutside(lastOutsideFocus) ??
    focusableOutside(doc.activeElement);
}

export type RestoreFocusScheduler = {
  cancel: () => void;
  schedule: (doc: Document, target: HTMLElement | null) => void;
};

/** 在组件体里调用：关闭后延迟还焦，躲开浏览器把焦点收到 body 的那一拍。 */
export function createRestoreFocusScheduler(): RestoreFocusScheduler {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => {
    if (timer != null) {
      globalThis.clearTimeout(timer);
      timer = undefined;
    }
  };
  onCleanup(cancel);
  return {
    cancel,
    schedule(doc, target) {
      cancel();
      if (!target) return;
      timer = globalThis.setTimeout(() => {
        timer = undefined;
        if (typeof target.focus === "function" && doc.contains(target)) {
          target.focus({ preventScroll: true });
        }
      }, 0);
    },
  };
}
