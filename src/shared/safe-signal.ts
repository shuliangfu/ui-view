/**
 * @module shared/safe-signal
 * @description view 3.0 起，Signal-of-object 的 props／Context 值可能经
 * `wrapComponentProps`／`wrapSignalValue` 包成 Proxy。对 Proxy 直接读
 * `__VIEW_SIGNAL` 会触发不变量错误（target 上该属性 non-configurable），
 * 且 `.value` 会被 Proxy 误当成数据字段 thunk。本模块用自有描述符检测，
 * 并以调用形式读写，兼容裸 Signal 与 Proxy(Signal)。
 */

import type { Signal } from "@dreamer/view";

/**
 * 判断是否为 `@dreamer/view` Signal（含 props Proxy 包装）。
 *
 * 优先 `getOwnPropertyDescriptor`（不走 Proxy `get` 陷阱），再回退属性读。
 */
export function safeIsSignal(v: unknown): v is Signal<unknown> {
  if (typeof v !== "function") return false;
  const desc = Object.getOwnPropertyDescriptor(v, "__VIEW_SIGNAL");
  if (desc?.value === true) return true;
  try {
    return (v as { __VIEW_SIGNAL?: boolean }).__VIEW_SIGNAL === true;
  } catch {
    // Proxy get 违反不变量时：描述符已表明是 Signal
    return desc?.value === true;
  }
}

/**
 * 读取 Signal 当前值（调用形式；避免 Proxy 上误读 `.value` 字段）。
 */
export function readSignalValue<T>(
  v: Signal<T> | ((...args: never[]) => T),
): T {
  return (v as () => T)();
}

/**
 * 写入 Signal（调用形式；Proxy(Signal) 上 `.value =` 会写到数据对象字段）。
 */
export function writeSignalValue<T>(
  v: Signal<T> | ((next: T) => T),
  next: T,
): void {
  (v as (n: T) => T)(next);
}
