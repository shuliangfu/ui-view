/**
 * Slider 滑块（View）。
 * 支持 min、max、step、value；竖排（vertical）、双滑块（range）；light/dark 主题。
 */

import { twMerge } from "tailwind-merge";

export interface SliderProps {
  /** 当前值；可为 getter / `() => ref.value`（SignalRef）以配合 View 细粒度更新 */
  value?: number | [number, number] | (() => number) | (() => [number, number]);
  /** 最小值 */
  min?: number;
  /** 最大值 */
  max?: number;
  /** 步进 */
  step?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否竖排显示 */
  vertical?: boolean;
  /** 是否双滑块范围选择（value 为 [number, number]） */
  range?: boolean;
  /** 变更回调（单滑块 e.target.value 为 string；range 时由内部合成事件传 [minVal, maxVal]） */
  onChange?: (e: Event) => void;
  /** 输入中回调（拖动时） */
  onInput?: (e: Event) => void;
  /** 额外 class（作用于容器） */
  class?: string;
  /** 原生 name */
  name?: string;
  /** 原生 id */
  id?: string;
}

const trackCls =
  "rounded-full bg-slate-200 dark:bg-slate-600 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 dark:[&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-600 dark:[&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer";

/** 单滑块轨道：横向 */
const trackHorizontalCls = "h-2 w-full";

/**
 * 触发 range 模式的 onChange/onInput，合成事件 target.value 为 [minVal, maxVal]
 */
function fireRangeChange(
  payload: [number, number],
  onChange?: (e: Event) => void,
  onInput?: (e: Event) => void,
  type: "change" | "input" = "change",
) {
  const handler = type === "change" ? onChange : onInput;
  if (!handler) return;
  const e = {
    target: { value: payload },
  } as unknown as Event;
  handler(e);
}

export function Slider(props: SliderProps) {
  const {
    value,
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    vertical = false,
    range = false,
    onChange,
    onInput,
    class: className,
    name,
    id,
  } = props;

  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  return () => {
    const resolved = typeof value === "function" ? value() : (value ?? 0);
    const numValue = typeof resolved === "number"
      ? resolved
      : (resolved as [number, number])[0];
    const rangeValues: [number, number] = Array.isArray(resolved)
      ? [resolved[0], resolved[1]]
      : [numValue, numValue];

    if (range) {
      const [v0, v1] = rangeValues;
      const low = clamp(typeof v0 === "number" ? v0 : min);
      const high = clamp(typeof v1 === "number" ? v1 : max);
      const ordered: [number, number] = low <= high ? [low, high] : [high, low];

      const handleLow = (e: Event) => {
        const el = e.target as HTMLInputElement;
        const newLow = clamp(parseFloat(el.value) || min);
        const next: [number, number] = [
          newLow,
          newLow > ordered[1] ? newLow : ordered[1],
        ];
        fireRangeChange(next, onChange, onInput, "input");
        fireRangeChange(next, onChange, undefined, "change");
      };
      const handleHigh = (e: Event) => {
        const el = e.target as HTMLInputElement;
        const newHigh = clamp(parseFloat(el.value) || max);
        const next: [number, number] = [
          ordered[0] > newHigh ? newHigh : ordered[0],
          newHigh,
        ];
        fireRangeChange(next, onChange, onInput, "input");
        fireRangeChange(next, onChange, undefined, "change");
      };

      const trackClsWithDir = vertical
        ? twMerge(trackCls, "w-40 h-8 -rotate-90")
        : twMerge(trackCls, trackHorizontalCls);
      const wrapperCls = vertical
        ? "flex flex-row gap-2 items-center w-8 h-40"
        : "flex flex-row gap-2 items-center w-full";
      const singleWrapCls = vertical
        ? "flex items-center justify-center shrink-0"
        : "";

      return (
        <div class={twMerge(wrapperCls, className)}>
          <div class={singleWrapCls}>
            <input
              type="range"
              aria-label="范围最小值"
              value={ordered[0]}
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              class={trackClsWithDir}
              onChange={handleLow}
              onInput={handleLow}
            />
          </div>
          <div class={singleWrapCls}>
            <input
              type="range"
              aria-label="范围最大值"
              value={ordered[1]}
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              class={trackClsWithDir}
              onChange={handleHigh}
              onInput={handleHigh}
            />
          </div>
        </div>
      );
    }

    const trackClsWithDir = vertical
      ? twMerge(trackCls, "w-full h-2") // 旋转后视觉为竖条，用 width 控制“高度”
      : twMerge(trackCls, trackHorizontalCls);
    const wrapperCls = vertical
      ? "inline-flex justify-center items-center w-8 h-40 [&>input]:rotate-[-90deg] [&>input]:w-40 [&>input]:h-8"
      : "";

    const input = (
      <input
        type="range"
        id={id}
        name={name}
        value={numValue}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        class={twMerge(
          trackClsWithDir,
          !vertical && "w-full",
          !vertical && className,
        )}
        onChange={onChange}
        onInput={onInput}
      />
    );

    if (vertical) {
      return (
        <div class={twMerge(wrapperCls, className)}>
          {input}
        </div>
      );
    }
    return input;
  };
}
