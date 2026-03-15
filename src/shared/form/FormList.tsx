/**
 * FormList 动态表单项（View）。
 * 用于动态增减表单项（如多条联系人）；由父组件持有列表数据，通过 items + onAdd + onRemove 受控。
 */

import { twMerge } from "tailwind-merge";

export interface FormListProps {
  /** 当前列表项数量或项列表（用于渲染行数）；若为 number 则仅用于长度，每行用 index 区分 */
  items: unknown[] | number;
  /** 新增一项时回调 */
  onAdd?: () => void;
  /** 移除指定索引项时回调 */
  onRemove?: (index: number) => void;
  /** 新增按钮文案 */
  addButtonText?: string;
  /** 额外 class（作用于容器） */
  class?: string;
  /**
   * 渲染单行的内容；传入 index，返回该行的表单项（如 FormItem + Input）。
   * 若为函数则调用 (index) => child；否则将 children 视为单行模板（不推荐，建议用 renderRow）。
   */
  children?: ((index: number) => unknown) | unknown;
}

const wrapCls = "flex flex-col gap-3";
const rowCls = "flex items-start gap-2";
const removeBtnCls =
  "shrink-0 px-2 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50";

export function FormList(props: FormListProps) {
  const {
    items,
    onAdd,
    onRemove,
    addButtonText = "添加一项",
    class: className,
    children,
  } = props;

  const length = typeof items === "number" ? items : items.length;
  const renderRow = typeof children === "function" ? children : () => children;

  return () => (
    <div class={twMerge(wrapCls, className)} role="group" aria-label="动态列表">
      {Array.from({ length }, (_, index) => (
        <div key={index} class={rowCls}>
          <div class="flex-1 min-w-0">{renderRow(index)}</div>
          {onRemove != null && (
            <button
              type="button"
              class={removeBtnCls}
              onClick={() => onRemove(index)}
              aria-label={`删除第 ${index + 1} 项`}
            >
              删除
            </button>
          )}
        </div>
      ))}
      {onAdd != null && (
        <button
          type="button"
          class="text-sm text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-0"
          onClick={onAdd}
        >
          {addButtonText}
        </button>
      )}
    </div>
  );
}
