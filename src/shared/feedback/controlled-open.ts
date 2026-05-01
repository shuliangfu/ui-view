/**
 * 浮层受控开关解析：与桌面 `Modal` 一致。
 * 须传 `open={createSignal 返回值}` 或 `open={() => sig()}`；勿依赖 `open={sig.value}` 在 Hybrid/函数子插入下随点击更新。
 */

import { isSignal, type Signal } from "@dreamer/view";

/** 是否打开：快照、`Signal<boolean>`、零参 getter（勿把带参函数当 getter） */
export type ControlledOpenInput = boolean | (() => boolean) | Signal<boolean>;

/**
 * 「是否仍有更多」分页标记：与 `ControlledOpenInput` 类似，但未传时语义为「仍有更多」
 * （与 `open` 类布尔默认 false 不同）。
 */
export type HasMoreInput = boolean | (() => boolean) | Signal<boolean>;

/** 字符串受控：快照、`Signal<string>`、零参 getter（用于 TabBar `activeKey` 等） */
export type ControlledStringInput = string | (() => string) | Signal<string>;

/**
 * 将 `open` prop 规范为 boolean；在 `createMemo` 内调用以订阅 `Signal` / getter。
 *
 * 优化：先检查 `isSignal`（O(1) 标记），再检查 `typeof === "function"`。
 * 对函数值，不再检查 `.length`——在 @dreamer/view 中 Signal 的 `.length === 2`
 * 但零参 getter `.length === 0`，统一调用即可，无需区分。
 *
 * @param v - 受控开关原始值
 */
export function readControlledOpenInput(
  v: ControlledOpenInput | undefined,
): boolean {
  if (v === undefined) return false;
  if (isSignal(v)) return !!(v as Signal<boolean>).value;
  if (typeof v === "function") return !!(v as () => boolean)();
  return !!v;
}

/**
 * 解析「是否仍有更多」：未传视为 true；`false` / `Signal(false)` 表示无下一页。
 * 在 `createMemo` 内调用可订阅 `Signal` / getter，避免父级只传一次 `.value` 快照后子树不再更新。
 *
 * 优化：同 {@link readControlledOpenInput}，移除 `.length` 检查。
 *
 * @param v - 原始 `hasMore` 值
 */
export function readHasMoreInput(v: HasMoreInput | undefined): boolean {
  if (v === undefined) return true;
  if (isSignal(v)) return !!(v as Signal<boolean>).value;
  if (typeof v === "function") return !!(v as () => boolean)();
  return !!v;
}

/**
 * 将字符串受控 prop 规范为 `string | undefined`；在 `createMemo` 内调用以订阅 `Signal` / getter。
 *
 * 优化：同 {@link readControlledOpenInput}，移除 `.length` 检查。
 *
 * @param v - 原始值
 */
export function readControlledStringInput(
  v: ControlledStringInput | undefined,
): string | undefined {
  if (v === undefined) return undefined;
  if (isSignal(v)) return (v as Signal<string>).value;
  if (typeof v === "function") return (v as () => string)();
  return v;
}
