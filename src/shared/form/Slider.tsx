/**
 * Slider 滑块（View）。
 * 支持 min、max、step、value；竖排（vertical）、双滑块（range）；light/dark 主题。
 *
 * 与文档里 `value={30}` 流畅、`value={() => val.value}` 卡顿的原因：
 * - 字面量 `value` 不会走 `needsReactiveDomProp`，View 不会每帧用 effect 写 `el.value`；
 * - getter 受控时父级 signal 每变一次就重绘 patch，`value={num}` 反复同步 DOM，与拖动冲突。
 *
 * 做法：原生 `input` **不写** `value` prop（避免编译器/补丁按受控值写回）；用 `ref` + `createEffect`
 * 在「非指针按下」时把 props 同步到 `el.value`；指针拖动期间跳过同步，由浏览器跟手。
 *
 * **重要**：`onChange` 对齐原生，只在松手时触发；拖动中**不得**用 `onChange` 按帧更新父级，否则易换掉 `input` 拖不动。
 * 父级传 `createSignal` 时，拖动中由内部 rAF 调用 `commitMaybeSignal` 更新该 Signal（**无需**再传 `onInput` 才能跟手）；`onInput` 仅用于额外回调（合成事件等）。
 */

import { createEffect, createRef } from "@dreamer/view";
import type { JSXRenderable } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { commitMaybeSignal, type MaybeSignal } from "./maybe-signal.ts";

export interface SliderProps {
  /** 当前值；见 {@link MaybeSignal}（单值或 range 元组） */
  value?: MaybeSignal<number | [number, number]>;
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
  /**
   * 变更回调：仅在原生 `change`（松手）时触发。拖动中不会调用，避免父级 signal 每帧更新导致子树重绘、换掉 input。
   */
  onChange?: (e: Event) => void;
  /** 拖动过程回调（经 rAF 合并）；需要拖动时同步父级 state 时请用本回调。range 时合成事件 target.value 为 [minVal, maxVal] */
  onInput?: (e: Event) => void;
  /** 额外 class（作用于容器） */
  class?: string;
  /** 原生 name */
  name?: string;
  /** 原生 id */
  id?: string;
}

/**
 * 在下一帧同步 DOM（双轨 ref 挂载时机）；浏览器用 rAF，SSR/Hybrid（Deno 等）无 rAF 时用 microtask，避免 `requestAnimationFrame is not a function`。
 */
function scheduleAfterPaint(fn: () => void): void {
  const raf = globalThis.requestAnimationFrame;
  if (typeof raf === "function") {
    raf.call(globalThis, fn);
  } else {
    queueMicrotask(fn);
  }
}

const trackCls =
  "rounded-full bg-slate-200 dark:bg-slate-600 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 dark:[&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-600 dark:[&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer";

/** 单滑块轨道：横向 */
const trackHorizontalCls = "h-2 w-full";

/**
 * 横向 range：原生轨道透明，由底层 div 画灰轨与蓝条，两枚 input 叠放只负责拇指交互。
 * - input 设 pointer-events-none，仅 thumb 设 pointer-events-auto，避免叠放时上层整条轨道抢走左侧拖动（误拖成另一枚）。
 * - WebKit 拇指相对 h-2 轨道易偏下，用 -mt-[6px] 与 track 高约对齐（h-5 thumb、h-2 track）。
 */
const rangeOverlayThumbCls =
  "pointer-events-none absolute inset-x-0 top-1/2 z-[3] h-10 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent disabled:cursor-not-allowed disabled:opacity-50 " +
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:-mt-[6px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 dark:[&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow " +
  "[&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent " +
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-blue-600 dark:[&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:-translate-y-1.5 " +
  "[&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent";

/**
 * 横向 range 蓝色区间条：直接写 DOM，拖动中父级 committed 未变时也能跟手更新。
 */
function paintRangeFillBar(
  el: HTMLDivElement | null | undefined,
  low: number,
  high: number,
  min: number,
  max: number,
): void {
  if (el == null) return;
  const span = max - min || 1;
  const a = Math.min(max, Math.max(min, low));
  const b = Math.min(max, Math.max(min, high));
  const o0 = Math.min(a, b);
  const o1 = Math.max(a, b);
  const p0 = ((o0 - min) / span) * 100;
  const p1 = ((o1 - min) / span) * 100;
  el.style.left = `${Math.min(p0, p1)}%`;
  el.style.width = `${Math.abs(p1 - p0)}%`;
}

/**
 * 通知 range 受控方：合成事件 target.value 为 [a, b]（与文档示例一致）。
 */
function emitRangeTuple(
  payload: [number, number],
  handler?: (e: Event) => void,
) {
  if (!handler) return;
  const e = {
    target: { value: payload },
  } as unknown as Event;
  handler(e);
}

/**
 * 在捕获阶段监听全局 pointerup/cancel，松手后清除「正在拖动」标记（含在轨道外释放的情况）。
 */
function armPointerDragEnd(flag: { current: boolean }) {
  const end = () => {
    flag.current = false;
    globalThis.removeEventListener("pointerup", end, true);
    globalThis.removeEventListener("pointercancel", end, true);
  };
  globalThis.addEventListener("pointerup", end, true);
  globalThis.addEventListener("pointercancel", end, true);
}

export function Slider(props: SliderProps): JSXRenderable {
  const singleInputRef = createRef<HTMLInputElement>();
  const rangeLowRef = createRef<HTMLInputElement>();
  const rangeHighRef = createRef<HTMLInputElement>();
  /** 横向 range 中间蓝色填充（样式由 paintRangeFillBar 维护，避免仅靠 props 时在拖动中滞后） */
  const rangeFillBarRef = createRef<HTMLDivElement>();
  /** 单滑块：指针在轨道上按下后为 true，直到全局 pointerup/cancel 或 change */
  const pointerDraggingSingle = { current: false };
  /** range：任一枚拇指拖动中 */
  const pointerDraggingRange = { current: false };

  let singleRaf: number | null = null;
  let pendingSingleEvent: Event | null = null;

  /**
   * 拖动中合并 input：始终 {@link commitMaybeSignal}（父级传 Signal 时首屏绑文案可不传 onInput）；
   * `userOnInput` 仅作可选回调，与 commit 解耦。
   */
  const scheduleSingleNotify = (
    e: Event,
    userOnInput?: (e: Event) => void,
  ) => {
    pendingSingleEvent = e;
    if (singleRaf !== null) return;
    singleRaf = globalThis.requestAnimationFrame(() => {
      singleRaf = null;
      const ev = pendingSingleEvent;
      pendingSingleEvent = null;
      if (ev) {
        const min = props.min ?? 0;
        const max = props.max ?? 100;
        const clampN = (v: number) => Math.min(max, Math.max(min, v));
        const n = clampN(
          parseFloat((ev.target as HTMLInputElement).value) || min,
        );
        commitMaybeSignal(props.value, n);
        if (userOnInput) userOnInput(ev);
      }
    });
  };

  /**
   * 取消待处理的 rAF：松手时先把积压帧写入 Signal，再可选调用 onInput（不走 onChange）。
   */
  const flushSingleRaf = () => {
    if (singleRaf !== null) {
      globalThis.cancelAnimationFrame(singleRaf);
      singleRaf = null;
    }
    const move = props.onInput;
    if (pendingSingleEvent) {
      const min = props.min ?? 0;
      const max = props.max ?? 100;
      const clampN = (v: number) => Math.min(max, Math.max(min, v));
      const n = clampN(
        parseFloat((pendingSingleEvent.target as HTMLInputElement).value) ||
          min,
      );
      commitMaybeSignal(props.value, n);
      if (move) move(pendingSingleEvent);
      pendingSingleEvent = null;
    }
  };

  let rangeRaf: number | null = null;
  let pendingRangePayload: [number, number] | null = null;

  /**
   * range 拖动合并：始终 commit；无 `onInput` 时仍更新父级 Signal（与单轨一致）。
   */
  const scheduleRangeNotify = (
    payload: [number, number],
    userOnInput?: (e: Event) => void,
  ) => {
    pendingRangePayload = payload;
    if (rangeRaf !== null) return;
    rangeRaf = globalThis.requestAnimationFrame(() => {
      rangeRaf = null;
      const p = pendingRangePayload;
      pendingRangePayload = null;
      if (p) {
        commitMaybeSignal(props.value, p);
        emitRangeTuple(p, userOnInput);
      }
    });
  };

  const flushRangeRaf = () => {
    if (rangeRaf !== null) {
      globalThis.cancelAnimationFrame(rangeRaf);
      rangeRaf = null;
    }
    const move = props.onInput;
    if (pendingRangePayload) {
      commitMaybeSignal(props.value, pendingRangePayload);
      if (move) emitRangeTuple(pendingRangePayload, move);
      pendingRangePayload = null;
    }
  };

  /**
   * 从 props 同步到真实 DOM：仅在非指针拖动时写入，避免与浏览器拖动打架。
   * 依赖 `props.value`（含 getter）以便父级受控更新时跟新。
   */
  createEffect(() => {
    const min = props.min ?? 0;
    const max = props.max ?? 100;
    const range = props.range ?? false;
    const vertical = props.vertical ?? false;
    const raw = props.value;
    const resolved = typeof raw === "function" ? raw() : (raw ?? 0);

    const clampLocal = (v: number) => Math.min(max, Math.max(min, v));

    if (range) {
      if (pointerDraggingRange.current) return;
      const v0 = Array.isArray(resolved) ? resolved[0] : (resolved as number);
      const v1 = Array.isArray(resolved) ? resolved[1] : (resolved as number);
      const low = clampLocal(typeof v0 === "number" ? v0 : min);
      const high = clampLocal(typeof v1 === "number" ? v1 : max);
      const ordered: [number, number] = low <= high ? [low, high] : [high, low];
      const s0 = String(ordered[0]);
      const s1 = String(ordered[1]);
      /**
       * 双轨 input 的 ref 可能在首次 effect 时尚未挂上；若跳过写入，浏览器对无 value 的 range 默认取 (min+max)/2，
       * 两枚 thumb 会叠在同一点，看起来像「只有一个滑点」。下一帧再同步一次即可。
       */
      const applyRangeDom = () => {
        const lo = rangeLowRef.current;
        const hi = rangeHighRef.current;
        if (lo && lo.value !== s0) lo.value = s0;
        if (hi && hi.value !== s1) hi.value = s1;
        if (!vertical) {
          paintRangeFillBar(
            rangeFillBarRef.current,
            ordered[0],
            ordered[1],
            min,
            max,
          );
        }
      };
      applyRangeDom();
      if (!rangeLowRef.current || !rangeHighRef.current) {
        scheduleAfterPaint(() => {
          if (pointerDraggingRange.current) return;
          applyRangeDom();
        });
      }
    } else {
      if (pointerDraggingSingle.current) return;
      const num = typeof resolved === "number"
        ? resolved
        : (resolved as [number, number])[0];
      const n = clampLocal(typeof num === "number" ? num : min);
      const s = String(n);
      const applySingleDom = () => {
        const el = singleInputRef.current;
        if (el && el.value !== s) el.value = s;
      };
      applySingleDom();
      if (!singleInputRef.current) {
        scheduleAfterPaint(() => {
          if (pointerDraggingSingle.current) return;
          applySingleDom();
        });
      }
    }
  });

  return () => {
    const {
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

    /** 仅 onInput 参与拖动中的 rAF 通知；onChange 只在松手 change 时触发，避免父级重绘换节点。 */
    const rangeOnMove = onInput;

    if (range) {
      /**
       * 区间逻辑以两枚 input 的 DOM 为准（onInput/onChange），避免闭包滞后；蓝色条见 paintRangeFillBar。
       */
      const onLowInput = (e: Event) => {
        const el = e.target as HTMLInputElement;
        const newLow = clamp(parseFloat(el.value) || min);
        const other = clamp(
          parseFloat(rangeHighRef.current?.value ?? String(max)) || max,
        );
        const o0 = Math.min(newLow, other);
        const o1 = Math.max(newLow, other);
        if (!vertical) {
          paintRangeFillBar(rangeFillBarRef.current, o0, o1, min, max);
        }
        const next: [number, number] = [o0, o1];
        scheduleRangeNotify(next, rangeOnMove);
      };
      const onLowChange = (e: Event) => {
        pointerDraggingRange.current = false;
        flushRangeRaf();
        const el = e.target as HTMLInputElement;
        const newLow = clamp(parseFloat(el.value) || min);
        const other = clamp(
          parseFloat(rangeHighRef.current?.value ?? String(max)) || max,
        );
        const o0 = Math.min(newLow, other);
        const o1 = Math.max(newLow, other);
        if (!vertical) {
          paintRangeFillBar(rangeFillBarRef.current, o0, o1, min, max);
        }
        const tuple: [number, number] = [o0, o1];
        commitMaybeSignal(props.value, tuple);
        emitRangeTuple(tuple, onChange);
      };

      const onHighInput = (e: Event) => {
        const el = e.target as HTMLInputElement;
        const newHigh = clamp(parseFloat(el.value) || max);
        const other = clamp(
          parseFloat(rangeLowRef.current?.value ?? String(min)) || min,
        );
        const o0 = Math.min(other, newHigh);
        const o1 = Math.max(other, newHigh);
        if (!vertical) {
          paintRangeFillBar(rangeFillBarRef.current, o0, o1, min, max);
        }
        const next: [number, number] = [o0, o1];
        scheduleRangeNotify(next, rangeOnMove);
      };
      const onHighChange = (e: Event) => {
        pointerDraggingRange.current = false;
        flushRangeRaf();
        const el = e.target as HTMLInputElement;
        const newHigh = clamp(parseFloat(el.value) || max);
        const other = clamp(
          parseFloat(rangeLowRef.current?.value ?? String(min)) || min,
        );
        const o0 = Math.min(other, newHigh);
        const o1 = Math.max(other, newHigh);
        if (!vertical) {
          paintRangeFillBar(rangeFillBarRef.current, o0, o1, min, max);
        }
        const tupleH: [number, number] = [o0, o1];
        commitMaybeSignal(props.value, tupleH);
        emitRangeTuple(tupleH, onChange);
      };

      const onRangePointerDown = () => {
        if (disabled) return;
        pointerDraggingRange.current = true;
        armPointerDragEnd(pointerDraggingRange);
      };

      /** 竖向与横向单轨一致 h-2 细轨，拇指仍为 h-5，旋转后视觉上滑线细、滑点大于滑线 */
      const trackClsWithDir = vertical
        ? twMerge(trackCls, "w-40 h-2 -rotate-90")
        : twMerge(trackCls, trackHorizontalCls);
      const wrapperCls = vertical
        ? "flex flex-row gap-2 items-center min-h-40 min-w-0 h-40"
        : "";
      const singleWrapCls = vertical
        ? "flex items-center justify-center shrink-0"
        : "";

      if (!vertical) {
        return (
          <div class={twMerge("relative w-full py-1", className)}>
            <div class="relative h-10 w-full">
              <div
                class="pointer-events-none absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-slate-200 dark:bg-slate-600"
                aria-hidden="true"
              />
              <div
                ref={rangeFillBarRef}
                class="pointer-events-none absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-blue-600 dark:bg-blue-500"
                style={{ left: "0%", width: "0%" }}
                aria-hidden="true"
              />
              <input
                ref={rangeLowRef}
                type="range"
                aria-label="范围最小值"
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                class={rangeOverlayThumbCls}
                onPointerDown={onRangePointerDown}
                onInput={onLowInput}
                onChange={onLowChange}
              />
              <input
                ref={rangeHighRef}
                type="range"
                aria-label="范围最大值"
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                class={rangeOverlayThumbCls}
                onPointerDown={onRangePointerDown}
                onInput={onHighInput}
                onChange={onHighChange}
              />
            </div>
          </div>
        );
      }

      return (
        <div class={twMerge(wrapperCls, className)}>
          <div class={singleWrapCls}>
            <input
              ref={rangeLowRef}
              type="range"
              aria-label="范围最小值"
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              class={trackClsWithDir}
              onPointerDown={onRangePointerDown}
              onInput={onLowInput}
              onChange={onLowChange}
            />
          </div>
          <div class={singleWrapCls}>
            <input
              ref={rangeHighRef}
              type="range"
              aria-label="范围最大值"
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              class={trackClsWithDir}
              onPointerDown={onRangePointerDown}
              onInput={onHighInput}
              onChange={onHighChange}
            />
          </div>
        </div>
      );
    }

    /** 竖向：旋转前 w-40=轨长、h-2=与横向相同的细轨宽（旋转后即为竖条粗细） */
    const trackClsWithDir = vertical
      ? twMerge(trackCls, "w-40 h-2")
      : twMerge(trackCls, trackHorizontalCls);
    const wrapperCls = vertical
      ? "inline-flex justify-center items-center h-40 min-h-40 min-w-5 shrink-0 [&>input]:rotate-[-90deg] [&>input]:w-40 [&>input]:h-2"
      : "";

    /**
     * 拖动中始终经 rAF 提交 Signal；`onInput` 可选，仅作额外回调。
     */
    const handleSingleInput = (e: Event) => {
      scheduleSingleNotify(e, onInput);
    };

    const handleSingleChange = (e: Event) => {
      pointerDraggingSingle.current = false;
      flushSingleRaf();
      const el = e.target as HTMLInputElement;
      const n = clamp(parseFloat(el.value) || min);
      commitMaybeSignal(props.value, n);
      if (onChange) onChange(e);
    };

    const onSinglePointerDown = () => {
      if (disabled) return;
      pointerDraggingSingle.current = true;
      armPointerDragEnd(pointerDraggingSingle);
    };

    const input = (
      <input
        ref={singleInputRef}
        type="range"
        id={id}
        name={name}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        class={twMerge(
          trackClsWithDir,
          !vertical && "w-full",
          !vertical && className,
        )}
        onPointerDown={onSinglePointerDown}
        onChange={handleSingleChange}
        onInput={handleSingleInput}
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
