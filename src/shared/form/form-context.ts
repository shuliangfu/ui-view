/**
 * Form store 上下文：由 {@link Form} 注入，{@link FormItem} / {@link useFormStore} 读取。
 */

import { type Context, createContext, useContext } from "@dreamer/view";
import type { FormStore } from "./create-form.ts";

/** 当前表单 store；未包裹在带 `form` 的 Form 内时为 `undefined` */
// deno-lint-ignore no-explicit-any
export const FormStoreContext: Context<FormStore<any> | undefined> =
  createContext<FormStore<any> | undefined>(undefined);

/**
 * 读取最近祖先 Form 注入的 store。
 *
 * @returns store，或 `undefined`
 */
// deno-lint-ignore no-explicit-any
export function useFormStore(): FormStore<any> | undefined {
  return useContext(FormStoreContext);
}
