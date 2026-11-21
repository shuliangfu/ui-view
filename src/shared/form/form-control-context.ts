/**
 * {@link Form} 向下注入的控件统一尺寸。
 *
 * 未包裹在 Form 内时上下文为 `undefined`，控件回落到 `props.size ?? "md"`。
 */

import { createContext, useContext } from "@dreamer/view";
import type { SizeVariant } from "../types.ts";

/** 由 {@link import("./Form.tsx").Form} 提供；值为当前表单约定的控件尺寸。 */
export const FormControlSizeContext = createContext<
  SizeVariant | undefined
>(undefined);

/**
 * 合并表单容器尺寸与控件自身 `size`：显式 prop 优先，其次 Form 注入，最后 `md`。
 *
 * @param prop - 控件上传入的 size
 * @returns 最终采用的尺寸
 */
export function resolveFormControlSize(
  prop: SizeVariant | undefined,
): SizeVariant {
  const fromForm = useContext(FormControlSizeContext);
  return prop ?? fromForm ?? "md";
}

/** 由 {@link import("./Form.tsx").Form} 提供；值为当前表单是否整表禁用。 */
export const FormControlDisabledContext = createContext<boolean>(false);

/**
 * 合并表单容器 `disabled` 与控件自身 `disabled`：任一为 true 则禁用。
 *
 * @param prop - 控件上传入的 disabled
 * @returns 最终是否禁用
 */
export function resolveFormControlDisabled(prop?: boolean): boolean {
  const fromForm = useContext(FormControlDisabledContext);
  return Boolean(prop) || Boolean(fromForm);
}
