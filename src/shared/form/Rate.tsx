/**
 * Rate 评分（View）。
 * 星级评分，count 颗星，value 当前分数（0～count），支持 half 半星可选。
 */

import { twMerge } from "tailwind-merge";

export interface RateProps {
  /** 星数，默认 5 */
  count?: number;
  /** 当前分数，0～count */
  /** 当前星级；可为 getter / `() => ref.value`（SignalRef） */
  value?: number | (() => number);
  /** 是否允许半星 */
  allowHalf?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 变更回调，回传新分数 */
  onChange?: (value: number) => void;
  /** 额外 class（作用于容器） */
  class?: string;
}

const starCls = "size-6 text-slate-300 dark:text-slate-500 transition-colors";
const starActiveCls = "text-amber-400 dark:text-amber-500";

export function Rate(props: RateProps) {
  const {
    count = 5,
    value,
    allowHalf = false,
    disabled = false,
    onChange,
    class: className,
  } = props;

  return () => {
    const v = typeof value === "function" ? value() : (value ?? 0);
    return (
      <span
        class={twMerge(
          "inline-flex gap-0.5",
          disabled && "pointer-events-none opacity-70",
          className,
        )}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={count}
        aria-valuenow={v}
        aria-readonly={disabled}
      >
        {Array.from({ length: count }, (_, i) => {
          const idx = i + 1;
          const full = v >= idx;
          const half = allowHalf && v >= idx - 0.5 && v < idx;
          return (
            <span
              class="cursor-pointer"
              onClick={() => !disabled && onChange?.(idx)}
              onKeyDown={(e: Event) => {
                const ev = e as KeyboardEvent;
                if (disabled) return;
                if (ev.key === "Enter" || ev.key === " ") onChange?.(idx);
              }}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-label={`${idx} 星`}
            >
              {allowHalf && half
                ? (
                  <span class="inline-block relative">
                    <span class={starCls} aria-hidden="true">
                      ★
                    </span>
                    <span
                      class={twMerge(
                        starCls,
                        starActiveCls,
                        "absolute left-0 top-0 w-1/2 overflow-hidden",
                      )}
                      aria-hidden="true"
                    >
                      ★
                    </span>
                  </span>
                )
                : (
                  <span
                    class={full ? twMerge(starCls, starActiveCls) : starCls}
                    aria-hidden="true"
                  >
                    ★
                  </span>
                )}
            </span>
          );
        })}
      </span>
    );
  };
}
