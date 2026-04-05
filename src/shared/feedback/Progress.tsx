/**
 * Progress 进度条/环形（View）。
 * 支持线性、环形；百分比、状态（成功/异常/进行中）、是否显示文案、自定义颜色。
 *
 * **手写 JSX**：`percent={sig.value}` 会在创建 VNode 时变成快照、不订阅；须传 **`percent={sig}`**（`Signal<number>`，`createSignal` 返回值）
 * 或 **`percent={() => n}`**（零参 getter）。有可用 `document`（浏览器或 SSR 影子 document）且 `percent` 为响应式时，
 * 本组件用 {@link createMemo} 返回子树走 **函数子响应式插入**；**纯 SSR 无 document** 时退回同步 VNode，避免
 * 无可用 document 时 `insert()` 路径访问 DOM 抛错。
 */

import { createMemo, getDocument, type Signal } from "@dreamer/view";
import { twMerge } from "tailwind-merge";

export type ProgressType = "line" | "circle";
export type ProgressStatus = "normal" | "success" | "exception" | "active";

/** 是否为 `createSignal` 返回的、可读 `.value` 的访问器 */
function isViewSignal(v: unknown): v is Signal<unknown> {
  if (typeof v !== "function") return false;
  // Signal 为函数形态，与 Record 无直接重叠，经 unknown 再收窄以满足 TS2352
  const f = v as unknown as Record<PropertyKey, unknown>;
  return f.__VIEW_SIGNAL === true &&
    Object.prototype.hasOwnProperty.call(f, "value");
}

/** 进度值：快照、`createSignal` 容器，或零参 getter（与 Drawer `open` 同向） */
export type ProgressPercentInput =
  | number
  | Signal<number>
  | (() => number);

export interface ProgressProps {
  /** 进度 0–100；推荐 `percent={sig}`，勿仅 `percent={sig.value}`（手写路径无订阅） */
  percent?: ProgressPercentInput;
  /** 线性 或 环形，默认 line */
  type?: ProgressType;
  /** 状态：正常/成功/异常/进行中（条纹动画） */
  status?: ProgressStatus;
  /** 是否显示百分比文案，默认 true */
  showInfo?: boolean;
  /** 线性条高度（px），默认 8 */
  strokeWidth?: number;
  /** 环形直径（px），默认 120 */
  size?: number;
  /** 环形时线宽（px），默认 6 */
  strokeWidthCircle?: number;
  /** 进度条颜色（CSS 颜色），可选 */
  strokeColor?: string;
  /** 轨道颜色（CSS 颜色），可选 */
  trailColor?: string;
  /** 自定义文案（如 "3/10"），覆盖 percent 显示 */
  format?: (percent: number) => string;
  /** 额外 class（作用于外层容器） */
  class?: string;
}

const statusSuccessCls = "bg-green-500 dark:bg-green-400";
const statusExceptionCls = "bg-red-500 dark:bg-red-400";
const statusNormalCls = "bg-blue-500 dark:bg-blue-400";
const statusActiveCls = "bg-blue-500 dark:bg-blue-400 animate-pulse";

function percentCls(status: ProgressStatus): string {
  if (status === "success") return statusSuccessCls;
  if (status === "exception") return statusExceptionCls;
  if (status === "active") return statusActiveCls;
  return statusNormalCls;
}

/**
 * 将 `percent` prop 规范为 0–100 数字；读 `Signal` / 零参 getter 时建立订阅。
 *
 * @param v - {@link ProgressProps.percent}
 * @returns  clamp 后的百分比
 */
function readProgressPercentInput(
  v: ProgressPercentInput | undefined,
): number {
  if (v === undefined) return 0;
  if (isViewSignal(v)) {
    const n = Number(v.value);
    return clampProgressPercent(n);
  }
  if (typeof v === "function") {
    if ((v as () => unknown).length !== 0) return 0;
    const n = Number((v as () => number)());
    return clampProgressPercent(n);
  }
  return clampProgressPercent(Number(v));
}

/**
 * 将数值限制在 [0,100]；非有限数视为 0。
 *
 * @param n - 原始读数
 * @returns 合法百分比
 */
function clampProgressPercent(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

/**
 * 是否应走 `createMemo` + **函数子响应式插入**（仅在有 DOM / 影子 document 时安全）。
 *
 * @param v - {@link ProgressProps.percent}
 * @returns 为 `Signal` 或零参 getter 时为 true
 */
function percentPropIsReactive(
  v: ProgressPercentInput | undefined,
): boolean {
  if (v === undefined) return false;
  if (isViewSignal(v)) return true;
  return typeof v === "function" && (v as () => unknown).length === 0;
}

/** 线性进度条 */
function ProgressLine(props: {
  percent: number;
  status: ProgressStatus;
  showInfo: boolean;
  strokeWidth: number;
  strokeColor?: string;
  trailColor?: string;
  format?: (p: number) => string;
  class?: string;
}) {
  const {
    percent,
    status,
    showInfo,
    strokeWidth,
    strokeColor,
    trailColor,
    format,
    class: className,
  } = props;
  const p = Math.min(100, Math.max(0, percent));
  const trailStyle = trailColor ? { backgroundColor: trailColor } : undefined;
  const strokeStyle = strokeColor
    ? { backgroundColor: strokeColor }
    : undefined;
  const barCls = strokeColor ? "" : percentCls(status);

  return (
    <div class={twMerge("flex items-center gap-3 w-full", className)}>
      <div
        class="flex-1 h-full rounded-full overflow-hidden bg-slate-200 dark:bg-slate-600"
        style={{ height: `${strokeWidth}px`, ...trailStyle }}
      >
        <div
          class={twMerge(
            "h-full rounded-full transition-all duration-300",
            barCls,
          )}
          style={{
            width: `${p}%`,
            ...strokeStyle,
          }}
        />
      </div>
      {showInfo && (
        <span class="shrink-0 text-sm text-slate-600 dark:text-slate-400 min-w-[2.5rem] text-right">
          {format ? format(p) : `${p}%`}
        </span>
      )}
    </div>
  );
}

/** 环形进度条（SVG） */
function ProgressCircle(props: {
  percent: number;
  status: ProgressStatus;
  showInfo: boolean;
  size: number;
  strokeWidth: number;
  strokeColor?: string;
  trailColor?: string;
  format?: (p: number) => string;
  class?: string;
}) {
  const {
    percent,
    status,
    showInfo,
    size,
    strokeWidth,
    strokeColor,
    trailColor,
    format,
    class: className,
  } = props;
  const p = Math.min(100, Math.max(0, percent));
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (p / 100) * circumference;
  const stroke = strokeColor ??
    (status === "success"
      ? "#22c55e"
      : status === "exception"
      ? "#ef4444"
      : "#3b82f6");

  return (
    <div
      class={twMerge("relative inline-flex", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        class="rotate-[-90deg]"
        aria-hidden
      >
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke-width={strokeWidth}
          class={trailColor ? "" : "stroke-slate-200 dark:stroke-slate-600"}
          style={trailColor ? { stroke: trailColor } : undefined}
        />
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={stroke}
          stroke-width={strokeWidth}
          stroke-dasharray={circumference}
          stroke-dashoffset={offset}
          stroke-linecap="round"
          class="transition-all duration-300"
        />
      </svg>
      {showInfo && (
        <span class="absolute inset-0 flex items-center justify-center text-sm font-medium text-slate-700 dark:text-slate-300">
          {format ? format(p) : `${p}%`}
        </span>
      )}
    </div>
  );
}

/**
 * 渲染进度 UI；响应式 `percent` 在**有** {@link getDocument} 时返回 `createMemo` 子树，否则返回同步 VNode（Hybrid SSR 安全）。
 */
export function Progress(props: ProgressProps) {
  const {
    percent: percentIn,
    type = "line",
    status = "normal",
    showInfo = true,
    strokeWidth = 8,
    size = 120,
    strokeWidthCircle = 6,
    strokeColor,
    trailColor,
    format,
    class: className,
  } = props;

  const canUseReactiveSubtree = percentPropIsReactive(percentIn) &&
    getDocument() != null;

  const renderResolved = (percent: number) => {
    if (type === "circle") {
      return (
        <ProgressCircle
          percent={percent}
          status={status}
          showInfo={showInfo}
          size={size}
          strokeWidth={strokeWidthCircle}
          strokeColor={strokeColor}
          trailColor={trailColor}
          format={format}
          class={className}
        />
      );
    }
    return (
      <ProgressLine
        percent={percent}
        status={status}
        showInfo={showInfo}
        strokeWidth={strokeWidth}
        strokeColor={strokeColor}
        trailColor={trailColor}
        format={format}
        class={className}
      />
    );
  };

  if (!canUseReactiveSubtree) {
    return renderResolved(readProgressPercentInput(percentIn));
  }

  return createMemo(() => renderResolved(readProgressPercentInput(percentIn)));
}
