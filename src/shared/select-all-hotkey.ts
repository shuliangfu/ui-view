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
  if (event.key.toLowerCase() !== "a") return false;
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
 * Focus the widget host after a click so the hotkey has a target.
 * Leaves text fields and interactive children alone. Callers should use tabIndex={-1}.
 */
export function focusSelectAllHost(event: MouseEvent): void {
  const host = event.currentTarget as HTMLElement | null;
  if (!host || typeof host.focus !== "function") return;
  let el: HTMLElement | null = event.target instanceof HTMLElement
    ? event.target
    : null;
  while (el && el !== host) {
    if (isTextEditTarget(el) || isFocusableControl(el)) return;
    el = el.parentElement;
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
