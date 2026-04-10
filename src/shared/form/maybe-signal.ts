/**
 * @module shared/form/maybe-signal
 * @description 表单受控 props 与 `@dreamer/view` {@link Signal} 的统一类型与读值工具。
 *
 * `createSignal` 返回值为零参可调用，运行时与显式 `() => T` 一致；透传至 JSX 时由 View 对「函数型」属性做细粒度绑定。
 */

import { isSignal, type Signal } from "@dreamer/view";

/**
 * 标量、零参 getter，或 `createSignal` 返回值；用于 `value` / `checked` / `targetKeys` 等受控 props。
 *
 * @template T 非函数的数据形态（勿把业务回调当作 `T`）
 */
export type MaybeSignal<T> = T | (() => T) | Signal<T>;

/**
 * 同步读取 {@link MaybeSignal}：未传时返回 `undefined`；函数或 Signal 则调用一次。
 *
 * @template T 值类型
 * @param v - 受控 prop
 * @returns 解包后的值，或 `undefined`
 */
export function readMaybeSignal<T>(
  v: MaybeSignal<T> | undefined,
): T | undefined {
  if (v === undefined) return undefined;
  if (typeof v === "function") {
    return (v as () => T)();
  }
  return v as T;
}

/**
 * 若受控源为 `createSignal` 返回值，将 `next` 写入 `.value`；字面量或普通 getter 则忽略。
 * 供各表单项在 `onInput`/`onChange`/内部提交路径中统一回写，调用方无需在 `onChange` 里再手写 `sig.value = …`。
 *
 * @typeParam T - 与 {@link MaybeSignal} 一致的数据类型
 * @param v - `value` / `checked` / `targetKeys` 等 prop
 * @param next - 新值
 */
export function commitMaybeSignal<T>(
  v: MaybeSignal<T> | undefined,
  next: T,
): void {
  if (v !== undefined && isSignal(v)) {
    (v as Signal<T>).value = next;
  }
}
