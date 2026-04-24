/**
 * FormItem 与主控件的 `id` / `label[for]` 自动关联。
 *
 * - 未在 {@link import("./FormItem.tsx").FormItem} 上写 `id` 时，按组件实例（View `Owner`）生成稳定 `form-item-…`。
 * - 子控件经 {@link FormItemControlIdContext} 获得同一 `id`；子组件显式 `id` 仍优先于上下文。
 */

import { type Context, createContext, type Owner } from "@dreamer/view";

/**
 * 当 `FormItem` 未传 `id` 时，向子树提供自动生成的 `controlId`；无 Provider 时为 `undefined`。
 */
export const FormItemControlIdContext: Context<string | undefined> =
  createContext<
    string | undefined
  >(undefined);

/**
 * 每个 `FormItem` 组件实例对应一个 `Owner`：在此缓存自动 id，供多次渲染复用；显式 `id` 会覆盖并写回。
 */
const formItemControlIdByOwner = new WeakMap<Owner, string>();

/**
 * 解析本表单项在 DOM 中使用的 `controlId`：与 `label[for]`、错误区 `id`、子控件默认 `id` 一致。
 *
 * @param owner - 在 `FormItem` 函数**开头**、同步体内调用 `getOwner()` 的结果（本组件项 Owner）
 * @param explicitId - `FormItem` 的 `id` 属性
 * @returns 非空字符串，可作为 HTML `id` 使用
 */
export function resolveFormItemControlId(
  owner: Owner | null,
  explicitId: string | undefined,
): string {
  if (explicitId != null && explicitId !== "") {
    if (owner != null) {
      formItemControlIdByOwner.set(owner, explicitId);
    }
    return explicitId;
  }
  if (owner != null) {
    const existing = formItemControlIdByOwner.get(owner);
    if (existing != null) {
      return existing;
    }
    const gen = `form-item-${globalThis.crypto.randomUUID()}`;
    formItemControlIdByOwner.set(owner, gen);
    return gen;
  }
  return `form-item-${globalThis.crypto.randomUUID()}`;
}
