/**
 * Shrink-wrapped picker trigger label: reserve at least the placeholder
 * width so clearing a short value does not widen the control.
 */
import type { JSXRenderable } from "@dreamer/view";
import { twMerge } from "tailwind-merge";

export interface PickerTriggerTextProps {
  /** Visible label (value or placeholder). */
  text: () => string;
  /** Empty-state copy; sized invisibly so the trigger does not shrink-wrap to a shorter value. */
  placeholder: () => string;
  /** When true, use the filled text color instead of the placeholder color. */
  filled: () => boolean;
}

/** Stack both labels in the first grid cell; also set as inline styles so
 * a missed Tailwind scan cannot leave the sizer as a leading empty column. */
const stackCellStyle = { gridArea: "1 / 1" } as const;

/**
 * Renders the visible trigger text stacked on an invisible placeholder of the
 * same typography, so the cell is as wide as `max(placeholder, text)`.
 * The visible value is start-aligned; leftover width sits to its right.
 */
export function PickerTriggerText(
  props: PickerTriggerTextProps,
): JSXRenderable {
  return (
    <span
      class="inline-grid justify-items-start"
      style={{ display: "inline-grid", justifyItems: "start" }}
    >
      <span
        class="invisible col-start-1 row-start-1 whitespace-nowrap"
        style={stackCellStyle}
        aria-hidden
        data-ui-picker-placeholder=""
      >
        {() => props.placeholder()}
      </span>
      <span
        class={() =>
          twMerge(
            "col-start-1 row-start-1 whitespace-nowrap text-left",
            props.filled()
              ? "text-slate-900 dark:text-slate-100"
              : "text-slate-400 dark:text-slate-500",
          )}
        style={stackCellStyle}
      >
        {() => props.text()}
      </span>
    </span>
  );
}
