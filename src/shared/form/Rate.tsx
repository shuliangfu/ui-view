/**
 * Rate 评分（View）。
 * 星级评分，count 颗星，value 当前分数（0～count），支持 half 半星可选。
 *
 * 外壳稳定；星面与 aria-valuenow 由局部 getter / effect 订阅 value，避免整段重建。
 */

import { type JSXRenderable, useContext } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import {
  resolveFormControlDisabled,
  resolveFormControlSize,
} from "./form-control-context.ts";
import { FormItemControlIdContext } from "./form-item-control-id.ts";
import { controlErrorBorder } from "./input-focus-ring.ts";
import { createOptionalValueState, type MaybeSignal } from "./maybe-signal.ts";
import type { SizeVariant } from "../types.ts";

/**
 * Rate 内置文案。
 */
export interface RateMessages {
  /** 单颗星 `aria-label`，参数为该星序号（1-based） */
  starLabel: (idx: number) => string;
}

/** 默认中文文案 */
export const defaultRateMessages: RateMessages = {
  starLabel: (idx) => `${idx} 星`,
};

export interface RateProps {
  /** 尺寸，与 {@link import("./Input.tsx").Input} 相同：xs、sm、md、lg */
  size?: SizeVariant;
  /** 星数，默认 5 */
  count?: number;
  /** 当前分数 0～count；见 {@link MaybeSignal} */
  value?: MaybeSignal<number>;
  /**
   * 是否允许半星（分数可为 .5 步进，如 3.5）。
   * 为 true 时：用鼠标点某颗星**左半边**选 `idx-0.5`、**右半边**选 `idx`；仅设 `value` 为 3.5 也会画出「半颗橙」。
   */
  allowHalf?: boolean;
  /** 再次点击当前分数对应的星时清零；默认 false，以免改变既有点选行为 */
  allowClear?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 错误状态（容器红框 + aria-invalid）；可与 FormItem / createForm bindValue 联用 */
  error?: boolean;
  /** 变更回调，回传新分数 */
  onChange?: (value: number) => void;
  /** 额外 class（作用于容器） */
  class?: string;
  /** 表单字段名（隐藏域同步提交） */
  name?: string;
  /** 控件 id（label for）；未传时取 FormItemControlIdContext */
  id?: string;
  /** 多语言/自定义文案；未传字段走 {@link defaultRateMessages} */
  messages?: Partial<RateMessages>;
}

const starCls =
  "text-slate-300 dark:text-slate-500 transition-colors motion-reduce:transition-none";
const starSizeClasses: Record<SizeVariant, string> = {
  xs: "inline-flex size-4 items-center justify-center text-base leading-none",
  sm: "inline-flex size-5 items-center justify-center text-xl leading-none",
  md: "inline-flex size-6 items-center justify-center text-2xl leading-none",
  lg: "inline-flex size-8 items-center justify-center text-3xl leading-none",
};
const starActiveCls = "text-amber-400 dark:text-amber-500";

/**
 * 根据指针在星上的水平位置得到应写入的分值（整星或半星）。
 * 键盘等合成 click 常见 `offsetX === 0`，此时整星，避免误选半星。
 */
function scoreFromStarClick(
  e: Event,
  idx: number,
  allowHalf: boolean,
): number {
  if (!allowHalf) return idx;
  if (!(e instanceof MouseEvent)) return idx;
  const el = e.currentTarget as HTMLElement;
  const w = el.offsetWidth;
  if (!(w > 0)) return idx;
  const ox = e.offsetX;
  if (ox <= 0) return idx;
  return ox < w / 2 ? idx - 0.5 : idx;
}

export function Rate(props: RateProps): JSXRenderable {
  const {
    size: sizeProp,
    count = 5,
    value,
    allowHalf = false,
    allowClear = false,

    error = false,
    onChange,
    class: className,
    name,
    id,
    messages,
  } = props;
  const disabled = resolveFormControlDisabled(props.disabled);
  const selected = createOptionalValueState(value, 0);
  const m = { ...defaultRateMessages, ...messages };
  const size = resolveFormControlSize(sizeProp);
  const starClsSized = twMerge(starCls, starSizeClasses[size]);
  const fromFormItem = useContext(FormItemControlIdContext);
  const resolvedId = id ?? fromFormItem;

  return (
    <span
      id={resolvedId}
      class={twMerge(
        "inline-flex gap-0.5 rounded-md",
        disabled && "pointer-events-none opacity-70",
        error &&
          twMerge("ring-1 ring-red-500 dark:ring-red-500", controlErrorBorder),
        className,
      )}
      role="slider"
      aria-valuenow={() => selected.read()}
      aria-valuemin={0}
      aria-valuemax={count}
      aria-readonly={disabled}
      aria-invalid={error}
    >
      {name
        ? (
          <input
            type="hidden"
            name={name}
            value={() => String(selected.read())}
          />
        )
        : null}
      {() => {
        const v = selected.read();
        return Array.from({ length: count }, (_, i) => {
          const idx = i + 1;
          const full = v >= idx;
          const half = allowHalf && v >= idx - 0.5 && v < idx;
          return (
            <span
              key={idx}
              class="cursor-pointer"
              onClick={(e: Event) => {
                if (disabled) return;
                const next = scoreFromStarClick(e, idx, allowHalf);
                const cur = selected.read();
                const written = allowClear && next === cur ? 0 : next;
                selected.commit(written);
                onChange?.(written);
              }}
              onKeyDown={(e: Event) => {
                const ev = e as KeyboardEvent;
                if (disabled) return;
                /** 键盘仅选整星，与鼠标左/右半边语义一致的可读默认 */
                if (ev.key === "Enter" || ev.key === " ") {
                  const cur = selected.read();
                  const written = allowClear && idx === cur ? 0 : idx;
                  selected.commit(written);
                  onChange?.(written);
                }
              }}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-label={m.starLabel(idx)}
            >
              {allowHalf && half
                ? (
                  <span class="relative inline-block">
                    <span class={starClsSized} aria-hidden="true">
                      ★
                    </span>
                    <span
                      class="absolute inset-y-0 left-0 w-1/2 overflow-hidden"
                      aria-hidden="true"
                    >
                      <span class={twMerge(starClsSized, starActiveCls)}>
                        ★
                      </span>
                    </span>
                  </span>
                )
                : (
                  <span
                    class={full
                      ? twMerge(starClsSized, starActiveCls)
                      : starClsSized}
                    aria-hidden="true"
                  >
                    ★
                  </span>
                )}
            </span>
          );
        });
      }}
    </span>
  );
}
