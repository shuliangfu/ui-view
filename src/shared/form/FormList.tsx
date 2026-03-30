/**
 * FormList 动态表单项（View）。
 * 用于动态增减表单项（如多条联系人）；由父组件持有列表数据，通过 items + onAdd + onRemove 受控。
 *
 * 使用 `renderRow` 且需要删除与输入**同一水平线**时：将第二参数里的 `removeButton` 赋给 {@link FormItemProps.trailing}，
 * 勿把删除放在表单项外侧（标签在上时外侧 flex 无法与仅输入区对齐）。
 */

import { twMerge } from "tailwind-merge";

/** `renderRow` 第二参数：由 FormList 注入，供与输入同行展示 */
export interface FormListRenderRowContext {
  /**
   * 在传了 `onRemove` 时为删除按钮；否则为 `null`。
   * 应赋给 FormItem 的 `trailing`，与 `children`（如 Input）同一 flex 行、`items-center`。
   */
  removeButton: unknown | null;
}

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
   * 按行索引渲染内容（如每行不同 FormItem + Input）。
   * 须用**属性**传入：View JSX 会把**子节点**编成单参挂载函数 `(parent)=>void`，与 `(index)=>` 形冲突；
   * 若写在子节点里会被当成挂载父节点调用，行内表单不会显示。
   *
   * 第二参数始终传入；有 `onRemove` 时 `removeButton` 为删除控件，请赋给 FormItem `trailing` 与输入同一水平线。
   */
  renderRow?: (index: number, ctx: FormListRenderRowContext) => unknown;
  /**
   * 无 `renderRow` 时：每行挂载同一套子树（编译产物为 `(parent)=>void`，由运行时挂到该行容器）。
   * 需要按 `index` 变化内容时请用 {@link FormListProps.renderRow}，勿在子节点写 `(index)=>...`。
   */
  children?: unknown;
}

const wrapCls = "flex flex-col gap-3";
/** 仅无 `renderRow`、删除挂在行尾时使用：`items-end` 与表单项底边对齐（无法与输入区单独同一水平线） */
const rowCls = "flex flex-row flex-wrap items-end justify-start gap-2";
/** 不占满剩余宽度 */
const rowMainCls = "min-w-0 w-fit max-w-full";
/** `renderRow` 时每行外层 */
const renderRowWrapCls = "min-w-0 max-w-full";

const removeBtnCls =
  "inline-flex shrink-0 items-center px-2 py-1 text-sm leading-5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50";

/**
 * 构建单行删除按钮。
 *
 * @param index 行索引（从 0 起）
 * @param onRemove 删除回调
 */
function removeButtonForRow(
  index: number,
  onRemove: (i: number) => void,
): unknown {
  return (
    <button
      type="button"
      class={removeBtnCls}
      onClick={() => onRemove(index)}
      aria-label={`删除第 ${index + 1} 项`}
    >
      删除
    </button>
  );
}

export function FormList(props: FormListProps) {
  const {
    items,
    onAdd,
    onRemove,
    addButtonText = "添加一项",
    class: className,
    children,
    renderRow: renderRowProp,
  } = props;

  const length = typeof items === "number" ? items : items.length;

  return (
    <div class={twMerge(wrapCls, className)} role="group" aria-label="动态列表">
      {Array.from({ length }, (_, index) => {
        const removeButton: unknown | null = onRemove != null
          ? removeButtonForRow(index, onRemove)
          : null;

        if (renderRowProp != null) {
          return (
            <div key={index} class={renderRowWrapCls}>
              {renderRowProp(index, { removeButton })}
            </div>
          );
        }

        return (
          <div key={index} class={rowCls}>
            <div class={rowMainCls}>{children}</div>
            {removeButton}
          </div>
        );
      })}
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
