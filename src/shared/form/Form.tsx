/**
 * Form 表单容器（View）。
 * 提供布局（vertical / horizontal / inline）、提交回调；与 FormItem 组合使用。
 * 可通过 `size` 为内部未显式指定尺寸的控件统一注入默认规格（见 {@link FormControlSizeContext}）。
 * 传入 {@link FormProps.form}（{@link createForm} 实例）时注入 {@link FormStoreContext}，
 * 提交前可自动 `validateFields`（`validateOnSubmit` 默认 true）。
 */

import { twMerge } from "tailwind-merge";
import type { JSXRenderable } from "@dreamer/view";
import type { SizeVariant } from "../types.ts";
import type { FormStore } from "./create-form.ts";
import { FormControlSizeContext } from "./form-control-context.ts";
import { FormStoreContext } from "./form-context.ts";

export type FormLayout = "vertical" | "horizontal" | "inline";

export interface FormProps {
  /** 布局：垂直堆叠 / 水平标签 / 行内 */
  layout?: FormLayout;
  /**
   * 子级 Input / Select / Button 等未传 `size` 时采用的尺寸，默认 `md`。
   */
  size?: SizeVariant;
  /**
   * {@link createForm} 返回的 store；注入上下文供 FormItem `name`/`rules` 与 `form.bind` 协作。
   * 使用宽松泛型，避免具体 values 类型与默认 `FormValues` 不兼容。
   */
  // deno-lint-ignore no-explicit-any
  form?: FormStore<any>;
  /**
   * 提交时是否先校验；仅当传入 `form` 时生效，默认 `true`。
   * 使用 `onFinish` 时始终会校验；若 `onSubmit` 已是 `form.handleSubmit(...)`，请设 `validateOnSubmit={false}`。
   */
  validateOnSubmit?: boolean;
  /**
   * 校验通过后的业务回调（推荐与 `form` 联用）。内部走 `form.submit`，自动维护 `submitting`。
   */
  onFinish?: (values: Record<string, unknown>) => void | Promise<void>;
  /**
   * 原生提交钩子（已 preventDefault）。
   * 有 `form` 且 `validateOnSubmit` 时，仅在校验通过后调用；有 `onFinish` 时仍会先走校验再调本回调（在 onFinish 之前）。
   */
  onSubmit?: (e: Event) => void;
  /** 额外 class（作用于 form） */
  class?: string;
  /** 表单项等子节点 */
  children?: unknown;
}

const layoutClasses: Record<FormLayout, string> = {
  vertical: "flex flex-col gap-4",
  horizontal: "flex flex-col gap-4 md:flex-row md:flex-wrap md:items-start",
  inline: "flex flex-wrap items-end gap-x-4 gap-y-2",
};
/**
 * 返回渲染 getter，使 View 为 Form 创建带 data-view-dynamic 的容器；
 * patch 时复用容器、只更新内容，避免子组件（如 Password）被整棵替换导致失焦。
 * 与 **`Signal`** 受控值（子组件 `value={() => ref.value}`）可组合使用。
 */
export function Form(props: FormProps): JSXRenderable {
  return () => {
    const {
      layout = "vertical",
      size = "md",
      form: formStore,
      validateOnSubmit = true,
      onFinish,
      onSubmit,
      class: className,
      children,
    } = props;
    const layoutCls = layoutClasses[layout];

    const handleSubmit = (e: Event) => {
      e.preventDefault();
      if (formStore && onFinish) {
        void formStore.submit(async (values) => {
          onSubmit?.(e);
          await onFinish(values);
        });
        return;
      }
      if (formStore && validateOnSubmit) {
        void formStore.validateFields().then((result) => {
          if (!result.ok) return;
          onSubmit?.(e);
        });
        return;
      }
      onSubmit?.(e);
    };

    const body = (
      <FormControlSizeContext.Provider value={size}>
        <form
          class={twMerge(layoutCls, className)}
          onSubmit={handleSubmit}
          noValidate
        >
          {children}
        </form>
      </FormControlSizeContext.Provider>
    );

    if (formStore) {
      return (
        <FormStoreContext.Provider value={formStore}>
          {body}
        </FormStoreContext.Provider>
      );
    }
    return body;
  };
}
