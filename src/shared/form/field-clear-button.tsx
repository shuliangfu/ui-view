/**
 * 表单控件共用的清除按钮（避免 Input / Select / 选择器各自复制一份 SVG）。
 */
import type { JSXRenderable } from "@dreamer/view";
import { twMerge } from "tailwind-merge";

/** 清除按钮用的 X 图标 */
export function FieldClearIcon(): JSXRenderable {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="h-4 w-4"
      aria-hidden
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export interface FieldClearButtonProps {
  /** 无障碍名称 */
  label: string;
  /** 清除回调（组件内已 stopPropagation） */
  onClear: (e: Event) => void;
  class?: string;
  /**
   * Use a span when this control sits inside another button (picker
   * triggers) so the markup does not nest buttons.
   */
  as?: "button" | "span";
}

/** 点击清除且不触发表单触发器的开合 */
export function FieldClearButton(props: FieldClearButtonProps): JSXRenderable {
  const className = twMerge(
    "inline-flex shrink-0 items-center justify-center rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200",
    props.class,
  );
  const onPointerDown = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const onClick = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    props.onClear(e);
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    e.stopPropagation();
    props.onClear(e);
  };
  if (props.as === "span") {
    return (
      <span
        class={className}
        role="button"
        tabIndex={0}
        aria-label={props.label}
        onPointerDown={onPointerDown}
        onClick={onClick}
        onKeyDown={onKeyDown}
      >
        <FieldClearIcon />
      </span>
    );
  }
  return (
    <button
      type="button"
      class={className}
      aria-label={props.label}
      onPointerDown={onPointerDown}
      onClick={onClick}
    >
      <FieldClearIcon />
    </button>
  );
}

/** 有清除按钮时，在文案与右侧图标之间预留与 {@link FieldClearButton} 同宽的空位，避免重叠。 */
export function PickerClearReserve(): JSXRenderable {
  return <span class="inline-block w-5 shrink-0" aria-hidden />;
}

/**
 * Stable slot for {@link FieldClearButton}. Keep this element in the tree
 * whenever allowClear is on, and only toggle the button inside it, so a
 * reactive unmount/remount cannot append the control after later siblings
 * (suffix, steppers) or leave the trigger's reserved gap.
 */
export interface FieldClearSlotProps extends FieldClearButtonProps {
  /** When false, the button is omitted but this slot stays mounted. */
  visible: () => boolean;
  /**
   * Keep a `w-5` gap when the control is hidden so picker triggers do not
   * shrink and cause the trailing icon to overlap the value or the clear control.
   */
  reserve?: boolean;
}

export function FieldClearSlot(props: FieldClearSlotProps): JSXRenderable {
  return (
    <span
      class={twMerge(
        "inline-flex items-center",
        props.reserve ? "w-5 shrink-0 justify-center" : "shrink-0",
        props.class,
      )}
    >
      {() =>
        props.visible()
          ? (
            <FieldClearButton
              label={props.label}
              onClear={props.onClear}
              as={props.as}
            />
          )
          : null}
    </span>
  );
}
