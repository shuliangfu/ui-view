/**
 * CountDown 倒计时（View）。
 * 目标时刻倒数；支持格式化渲染与结束回调。
 */

import {
  createEffect,
  createSignal,
  type JSXRenderable,
  onCleanup,
} from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import {
  type MaybeSignal,
  readMaybeSignal,
} from "../form/maybe-signal.ts";

export interface CountDownTimeParts {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
}

export interface CountDownProps {
  /**
   * 目标结束时间：epoch ms、`Date`，或 `MaybeSignal`。
   * 也可用 `remaining` 直接给剩余毫秒（与 `target` 二选一，`remaining` 优先）。
   */
  target?: MaybeSignal<number | Date>;
  /** 剩余毫秒（受控／一次性起点）；与 target 二选一 */
  remaining?: MaybeSignal<number>;
  /** 刷新间隔 ms，默认 1000；毫秒展示可传 50～100 */
  interval?: number;
  /** 结束回调（仅触发一次） */
  onFinish?: () => void;
  /** 自定义渲染；不传则默认 `HH:mm:ss`（含天则 `D:HH:mm:ss`） */
  render?: (parts: CountDownTimeParts) => unknown;
  /** 额外 class */
  class?: string;
}

function partsFromMs(totalMs: number): CountDownTimeParts {
  const ms = Math.max(0, Math.floor(totalMs));
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  const milliseconds = ms % 1000;
  return { totalMs: ms, days, hours, minutes, seconds, milliseconds };
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function defaultFormat(p: CountDownTimeParts): string {
  const hms = `${pad2(p.hours)}:${pad2(p.minutes)}:${pad2(p.seconds)}`;
  return p.days > 0 ? `${p.days}:${hms}` : hms;
}

function resolveRemainingMs(
  target: MaybeSignal<number | Date> | undefined,
  remaining: MaybeSignal<number> | undefined,
): number {
  const rem = readMaybeSignal(remaining);
  if (typeof rem === "number" && Number.isFinite(rem)) return Math.max(0, rem);
  const t = readMaybeSignal(target);
  if (t == null) return 0;
  const end = typeof t === "number" ? t : t.getTime();
  return Math.max(0, end - Date.now());
}

export function CountDown(props: CountDownProps): JSXRenderable {
  const {
    interval = 1000,
    onFinish,
    render,
    class: className,
  } = props;

  const left = createSignal(0);
  const finished = createSignal(false);

  createEffect(() => {
    finished.value = false;
    const tick = () => {
      const ms = resolveRemainingMs(props.target, props.remaining);
      left.value = ms;
      if (ms <= 0 && !finished.value) {
        finished.value = true;
        onFinish?.();
      }
    };
    tick();
    const id = globalThis.setInterval?.(tick, Math.max(16, interval));
    onCleanup(() => {
      if (id != null) globalThis.clearInterval?.(id);
    });
  });

  return () => {
    const p = partsFromMs(left.value);
    const node = render ? render(p) : defaultFormat(p);
    return (
      <span class={twMerge("countdown tabular-nums", className)} role="timer">
        {node}
      </span>
    );
  };
}
