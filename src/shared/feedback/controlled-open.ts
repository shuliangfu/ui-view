/**
 * 浮层受控开关解析：与桌面 `Modal` 一致。
 * 须传 `open={createSignal 返回值}` 或 `open={() => sig()}`；勿依赖 `open={sig.value}` 在 Hybrid/函数子插入下随点击更新。
 */

import { isSignal, type Signal } from "@dreamer/view";

/** 是否打开：快照、`Signal<boolean>`、零参 getter（勿把带参函数当 getter） */
export type ControlledOpenInput = boolean | (() => boolean) | Signal<boolean>;

/** 字符串受控：快照、`Signal<string>`、零参 getter（用于 TabBar `activeKey` 等） */
export type ControlledStringInput = string | (() => string) | Signal<string>;

/**
 * 将 `open` prop 规范为 boolean；在 `createMemo` 内调用以订阅 `Signal` / getter。
 *
 * @param v - 受控开关原始值
 */
export function readControlledOpenInput(
  v: ControlledOpenInput | undefined,
): boolean {
  if (v === undefined) return false;
  if (isSignal(v)) return !!(v as Signal<boolean>).value;
  if (typeof v === "function") {
    if ((v as () => unknown).length !== 0) return false;
    return !!(v as () => boolean)();
  }
  return !!v;
}

/**
 * 将字符串受控 prop 规范为 `string | undefined`；在 `createMemo` 内调用以订阅 `Signal` / getter。
 *
 * @param v - 原始值
 */
export function readControlledStringInput(
  v: ControlledStringInput | undefined,
): string | undefined {
  if (v === undefined) return undefined;
  if (isSignal(v)) return (v as Signal<string>).value;
  if (typeof v === "function") {
    if ((v as () => unknown).length !== 0) return undefined;
    return (v as () => string)();
  }
  return v;
}
