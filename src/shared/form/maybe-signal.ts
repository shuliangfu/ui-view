/**
 * @module shared/form/maybe-signal
 * @description 表单受控 props 与 `@dreamer/view` {@link Signal} 的统一类型与读值工具。
 *
 * `createSignal` 返回值为零参可调用，运行时与显式 `() => T` 一致；透传至 JSX 时由 View 对「函数型」属性做细粒度绑定。
 */

import { createSignal, type Signal } from "@dreamer/view";
import {
  readSignalValue,
  safeIsSignal,
  writeSignalValue,
} from "../safe-signal.ts";

/**
 * 标量、零参 getter，或 `createSignal` 返回值；用于 `value` / `checked` / `targetKeys` 等受控 props。
 *
 * @template T 非函数的数据形态（勿把业务回调当作 `T`）
 */
export type MaybeSignal<T> = T | (() => T) | Signal<T>;

/**
 * 同步读取 {@link MaybeSignal}：未传时返回 `undefined`；Signal 或 getter 则调用一次。
 *
 * 优化：先检查 `safeIsSignal`（兼容 view 3 props Proxy），再 `typeof === "function"`。
 *
 * @template T 值类型
 * @param v - 受控 prop
 * @returns 解包后的值，或 `undefined`
 */
export function readMaybeSignal<T>(
  v: MaybeSignal<T> | undefined,
): T | undefined {
  if (v === undefined) return undefined;
  if (safeIsSignal(v)) return readSignalValue(v as Signal<T>);
  if (typeof v === "function") return (v as () => T)();
  return v as T;
}

/**
 * 若受控源为 `createSignal` 返回值，将 `next` 写入；字面量或普通 getter 则忽略。
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
  if (v !== undefined && safeIsSignal(v)) {
    writeSignalValue(v as Signal<T>, next);
  }
}

/**
 * 判断 `value` 是否为受控源：`createSignal` 返回值或零参 getter。
 * 字面量与 `undefined` 视为非受控（字面量作初始值）。
 */
export function isControlledMaybeSignal<T>(
  value: MaybeSignal<T> | undefined,
): value is Signal<T> | (() => T) {
  if (value === undefined) return false;
  if (safeIsSignal(value)) return true;
  return typeof value === "function";
}

/** {@link createOptionalValueState} 的读写句柄 */
export interface OptionalValueState<T> {
  read: () => T;
  commit: (next: T) => void;
  /**
   * 绑到原生 `value`：受控时沿用原 Signal/getter，非受控时为内部 Signal。
   * 须直接透传，勿在组件体里调用 `read()`，以免订阅后整树重跑、输入失焦。
   */
  bind: MaybeSignal<T>;
}

/**
 * 统一表单值状态：
 * - 未传 `value`：内部 Signal，初始为 `fallback`（非受控）
 * - 字面量：内部 Signal，初始为该字面量（当作 defaultValue，选择/输入可回写显示）
 * - Signal / getter：仍按 {@link MaybeSignal} 受控读写（仅 Signal 可写回）
 */
export function createOptionalValueState<T>(
  value: MaybeSignal<T> | undefined,
  fallback: T,
): OptionalValueState<T> {
  const controlled = isControlledMaybeSignal(value);
  const initial = !controlled && value !== undefined ? value as T : fallback;
  const inner = createSignal(initial);
  return {
    read: () => controlled ? (readMaybeSignal(value) ?? fallback) : inner(),
    commit: (next) => {
      if (controlled) commitMaybeSignal(value, next);
      else inner.value = next;
    },
    bind: controlled ? value : inner,
  };
}
