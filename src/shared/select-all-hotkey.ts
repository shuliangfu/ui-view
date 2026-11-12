/**
 * Shared Ctrl+A / Command+A handling for multi-select widgets.
 * Text fields keep the browser's "select all text" behavior.
 */

/** True when the event target is a field that should keep native text selection. */
export function isTextEditTarget(target: EventTarget | null): boolean {
  if (typeof HTMLElement === "undefined") return false;
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "TEXTAREA") return true;
  if (tag === "INPUT") {
    const type = (target as HTMLInputElement).type || "text";
    return !/^(button|checkbox|radio|file|submit|reset|image|hidden|range|color)$/i
      .test(type);
  }
  return false;
}

/** Subset of KeyboardEvent used by the select-all helper. */
export interface SelectAllKeyEvent {
  defaultPrevented?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  key: string;
  target?: EventTarget | null;
}

/**
 * Ctrl+A or Command+A that should select items in a widget, not the page.
 * Returns false when the target is a text field, or when modifiers don't match.
 */
export function isSelectAllHotkey(event: SelectAllKeyEvent): boolean {
  if (event.defaultPrevented) return false;
  if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) {
    return false;
  }
  const key = (event.key ?? "").toLowerCase();
  const code = "code" in event ? String((event as { code?: string }).code) : "";
  if (key !== "a" && code !== "KeyA") return false;
  if (isTextEditTarget(event.target ?? null)) return false;
  return true;
}

/** Stop the browser from selecting the whole page. */
export function preventSelectAllDefault(event: KeyboardEvent): void {
  event.preventDefault();
  event.stopPropagation();
}

/** True when the element itself is a control that should keep focus. */
export function isFocusableControl(target: EventTarget | null): boolean {
  if (typeof HTMLElement === "undefined") return false;
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (
    tag === "BUTTON" || tag === "SELECT" || tag === "TEXTAREA" ||
    tag === "A" || tag === "SUMMARY" || tag === "OPTION"
  ) {
    return true;
  }
  if (tag === "INPUT") return true;
  return target.tabIndex >= 0;
}

/**
 * Focus the widget host after a click so Command+A has a target.
 * Leaves text fields alone. For buttons and checkboxes, prevent the default
 * mousedown focus change (Safari often leaves focus on the page otherwise).
 * Callers should use tabIndex={-1}.
 */
export function focusSelectAllHost(event: MouseEvent): void {
  const host = event.currentTarget as HTMLElement | null;
  if (!host || typeof host.focus !== "function") return;
  if (isTextEditTarget(event.target ?? null)) return;
  if (event.type === "mousedown" && event.target !== host) {
    event.preventDefault();
  }
  if (!host.hasAttribute("tabindex")) {
    host.setAttribute("tabindex", "-1");
  }
  host.focus({ preventScroll: true });
}

/** Select every key, or clear the selection when they are already all selected. */
export function toggleSelectAllKeys(
  current: Iterable<string>,
  all: readonly string[],
): string[] {
  if (all.length === 0) return [];
  const have = current instanceof Set ? current : new Set(current);
  const complete = all.every((key) => have.has(key));
  return complete ? [] : [...all];
}

/** Mark a widget host so the capture-phase listener can find it. */
export const SELECT_ALL_HOST_ATTR = "data-select-all-host";

type SelectAllHost = {
  el: HTMLElement;
  onSelectAll: () => void;
};

const selectAllHosts = new Set<SelectAllHost>();
const HOST_KEY = "__dreamerSelectAllHost";
let selectAllCaptureBound = false;

function pruneSelectAllHosts(): void {
  for (const host of [...selectAllHosts]) {
    if (!host.el.isConnected) {
      selectAllHosts.delete(host);
      try {
        delete (host.el as unknown as Record<string, unknown>)[HOST_KEY];
      } catch {
        /* ignore */
      }
    }
  }
}

function findSelectAllHost(event: KeyboardEvent): HTMLElement | null {
  const doc = event.target instanceof Node
    ? event.target.ownerDocument
    : typeof document !== "undefined"
    ? document
    : null;
  const candidates: EventTarget[] = [];
  if (event.target) candidates.push(event.target);
  if (doc?.activeElement) candidates.push(doc.activeElement);
  for (const node of candidates) {
    if (node instanceof Element) {
      const host = node.closest(`[${SELECT_ALL_HOST_ATTR}]`);
      if (host instanceof HTMLElement) return host;
    }
  }
  return null;
}

function invokeSelectAll(host: HTMLElement): void {
  const bag = host as unknown as Record<string, SelectAllHost | undefined>;
  const registered = bag[HOST_KEY];
  if (registered) {
    registered.onSelectAll();
    return;
  }
  const delegated = (host as unknown as Record<string, unknown>)["__onkeydown"];
  if (typeof delegated === "function") {
    // The real event is already defaultPrevented; synthesize a fresh one
    // so existing onKeyDown handlers still pass isSelectAllHotkey.
    (delegated as (event: KeyboardEvent) => void).call(
      host,
      new KeyboardEvent("keydown", {
        key: "a",
        metaKey: true,
        ctrlKey: true,
        bubbles: true,
      }),
    );
  }
}

function onSelectAllCapture(event: KeyboardEvent): void {
  pruneSelectAllHosts();
  if (!isSelectAllHotkey(event)) return;
  const host = findSelectAllHost(event);
  if (!host) return;
  preventSelectAllDefault(event);
  event.stopImmediatePropagation();
  invokeSelectAll(host);
}

/** Bind once on window capture so Command+A is caught before the page selects. */
export function ensureSelectAllCapture(): void {
  if (selectAllCaptureBound) return;
  const root = globalThis as {
    addEventListener?: typeof addEventListener;
  };
  if (typeof root.addEventListener !== "function") return;
  root.addEventListener("keydown", onSelectAllCapture, true);
  selectAllCaptureBound = true;
}

ensureSelectAllCapture();

/**
 * Register a widget host so Ctrl+A / Command+A is handled in the capture phase
 * whenever focus or the event target is inside it. Safe to call again on the
 * same element to update the callback. Disconnected hosts are pruned automatically.
 */
export function setSelectAllHost(
  el: HTMLElement | null,
  onSelectAll: () => void,
): void {
  if (!el) return;
  el.setAttribute(SELECT_ALL_HOST_ATTR, "");
  ensureSelectAllCapture();
  const bag = el as unknown as Record<string, SelectAllHost | undefined>;
  const existing = bag[HOST_KEY];
  if (existing) {
    existing.onSelectAll = onSelectAll;
    selectAllHosts.add(existing);
    return;
  }
  const host: SelectAllHost = { el, onSelectAll };
  bag[HOST_KEY] = host;
  selectAllHosts.add(host);
}
