/**
 * 图表基座组件：基于 Chart.js 与 canvas，统一处理创建/更新/销毁。
 * 按需 `Chart.register` 本库用到的 controller／element／scale／plugin，
 * **勿** `import "chart.js/auto"`（会注册全量控制器增大包体）。
 *
 * 主题：跟随容器／`html.dark`（或 `[data-theme=dark]`）。
 * Chart.js 默认 `color: #666` 在暗色下对比不足；径向轴默认
 * `ticks.showLabelBackdrop: true` + 半透明白底会画出灰框——此处只改文字色，
 * **关闭**一切 tick／pointLabel backdrop，不为对比度加底。
 *
 * SSR／Hybrid（Deno `ssr-dom` 假 canvas 无 `getContext`）：**勿** `new Chart`，
 * 否则 Chart.js 会打 `Failed to create chart: can't acquire context from the given item`。
 * 仅在能拿到真实 2d context（且 `ctx.canvas === canvas`，对齐 DomPlatform）时创建；
 * 客户端水合后 ref 再挂真实 canvas 再 create。
 */

import {
  ArcElement,
  BarController,
  BarElement,
  BubbleController,
  CategoryScale,
  Chart,
  DoughnutController,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  LogarithmicScale,
  PieController,
  PointElement,
  PolarAreaController,
  RadarController,
  RadialLinearScale,
  ScatterController,
  Title,
  Tooltip,
} from "chart.js";
import type { JSXRenderable } from "@dreamer/view";
import type { BaseChartProps, ChartType } from "./types.ts";

/** 暗色正文近白（对齐文档壳 `dark:text-slate-100`）；浅色对齐 `text-slate-900` */
const CHART_TEXT_DARK = "#f1f5f9";
const CHART_TEXT_LIGHT = "#0f172a";
const CHART_GRID_DARK = "rgba(148, 163, 184, 0.25)";
const CHART_GRID_LIGHT = "rgba(15, 23, 42, 0.12)";

/** 一次性注册 ui-view 图表面所需控制器与元素（幂等） */
let chartJsRegistered = false;
function ensureChartJsRegistered(): void {
  if (chartJsRegistered) return;
  Chart.register(
    LineController,
    BarController,
    PieController,
    DoughnutController,
    RadarController,
    PolarAreaController,
    BubbleController,
    ScatterController,
    CategoryScale,
    LinearScale,
    LogarithmicScale,
    RadialLinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Filler,
    Legend,
    Title,
    Tooltip,
  );
  // 径向默认 showLabelBackdrop:true + backdropColor 半透明白 → dark 下灰框；全局关掉
  // deno-lint-ignore no-explicit-any
  const radial: any = Chart.defaults.scales.radialLinear;
  if (radial?.ticks) {
    radial.ticks.showLabelBackdrop = false;
    radial.ticks.backdropColor = "transparent";
  }
  if (radial?.pointLabels) {
    radial.pointLabels.backdropColor = "transparent";
  }
  // 笛卡尔 tick 默认也带 backdropColor 定义；显式关，避免被打开
  // deno-lint-ignore no-explicit-any
  const commonTicks: any = (Chart.defaults as any).scale?.ticks;
  if (commonTicks) {
    commonTicks.showLabelBackdrop = false;
    commonTicks.backdropColor = "transparent";
  }
  chartJsRegistered = true;
}

/** 是否处于暗色主题（html／祖先 `.dark` 或 `data-theme=dark`） */
function resolveIsDark(el: Element | null): boolean {
  if (el?.closest(".dark, [data-theme='dark']")) return true;
  if (el?.closest("[data-theme='light']")) return false;
  const root = el?.ownerDocument?.documentElement ??
    (typeof document !== "undefined" ? document.documentElement : null);
  if (!root) return false;
  return root.classList.contains("dark") ||
    root.getAttribute("data-theme") === "dark";
}

/** 浅合并：对象递归，数组／原值以右侧为准 */
function deepMerge(
  base: Record<string, unknown>,
  over: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const key of Object.keys(over)) {
    const bv = base[key];
    const ov = over[key];
    if (
      bv && ov &&
      typeof bv === "object" && typeof ov === "object" &&
      !Array.isArray(bv) && !Array.isArray(ov)
    ) {
      out[key] = deepMerge(
        bv as Record<string, unknown>,
        ov as Record<string, unknown>,
      );
    } else {
      out[key] = ov;
    }
  }
  return out;
}

/** 无底、仅文字色的 tick 选项（笛卡尔＋径向共用） */
function tickTextOnly(color: string): Record<string, unknown> {
  return {
    color,
    showLabelBackdrop: false,
    backdropColor: "transparent",
  };
}

/**
 * 按图表类型给出主题 options：只设 color／ticks.color／关 backdrop。
 * 不给 pie／doughnut 塞 x／y／r，避免多余 scale。
 */
function themeOptionsFor(
  el: Element | null,
  type: ChartType,
): Record<string, unknown> {
  const dark = resolveIsDark(el);
  const color = dark ? CHART_TEXT_DARK : CHART_TEXT_LIGHT;
  const borderColor = dark ? CHART_GRID_DARK : CHART_GRID_LIGHT;
  const ticks = tickTextOnly(color);

  const base: Record<string, unknown> = {
    color,
    borderColor,
    plugins: {
      legend: { labels: { color } },
      title: { color },
    },
  };

  if (type === "pie" || type === "doughnut") {
    return base;
  }
  if (type === "radar" || type === "polarArea") {
    return {
      ...base,
      scales: {
        r: {
          ticks,
          pointLabels: {
            color,
            backdropColor: "transparent",
          },
        },
      },
    };
  }
  // line / bar / scatter / bubble：笛卡尔轴
  return {
    ...base,
    scales: {
      x: { ticks },
      y: { ticks },
    },
  };
}

/** 主题在下、业务 options 在上（业务显式字段优先） */
function mergeChartOptions(
  el: Element | null,
  type: ChartType,
  userOptions: Record<string, unknown> | undefined,
): Record<string, unknown> {
  return deepMerge(themeOptionsFor(el, type), userOptions ?? {});
}

/** canvas 元素上挂载的 Chart 实例（用于更新与销毁） */
interface CanvasWithChart extends HTMLCanvasElement {
  // deno-lint-ignore no-explicit-any
  _chart?: Chart<any, any, any>;
  /** 主题 class／data-theme 变化时刷新轴标／图例色 */
  _themeObserver?: MutationObserver;
  _chartType?: ChartType;
}

function disconnectThemeWatch(ext: CanvasWithChart): void {
  ext._themeObserver?.disconnect();
  ext._themeObserver = undefined;
}

function applyThemeToChart(
  ext: CanvasWithChart,
  userOptions: Record<string, unknown> | undefined,
): void {
  if (!ext._chart || !ext._chartType) return;
  const merged = mergeChartOptions(ext, ext._chartType, userOptions);
  ext._chart.options = deepMerge(
    (ext._chart.options ?? {}) as Record<string, unknown>,
    merged,
  ) as never;
  ext._chart.update("none");
}

function watchTheme(
  ext: CanvasWithChart,
  userOptions: Record<string, unknown> | undefined,
): void {
  disconnectThemeWatch(ext);
  if (
    typeof document === "undefined" || typeof MutationObserver === "undefined"
  ) {
    return;
  }
  const refresh = () => applyThemeToChart(ext, userOptions);
  const mo = new MutationObserver(refresh);
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-theme"],
  });
  const host = ext.closest(".config-provider") ?? ext.parentElement;
  if (host && host !== document.documentElement) {
    mo.observe(host, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
      subtree: false,
    });
  }
  ext._themeObserver = mo;
}

/**
 * 当前 canvas 能否被 Chart.js DomPlatform 拿到 2d context。
 * Deno SSR 桩／无 getContext 的假节点返回 false——此时禁止 create，避免假绿与 console.error。
 */
function canAcquireChartContext(canvas: HTMLCanvasElement): boolean {
  try {
    if (typeof canvas.getContext !== "function") return false;
    const ctx = canvas.getContext("2d");
    // 与 chart.js DomPlatform.acquireContext 一致：context 存在且绑回同一 canvas
    return !!(ctx && ctx.canvas === canvas);
  } catch {
    return false;
  }
}

/**
 * 通用图表组件：根据 type / data / options 渲染 Chart.js 图表。
 * 在 canvas 挂载时 create Chart，在 data/options 变化时 update，在 unmount 时 destroy。
 * 无真实 2d context（SSR）时只输出空 canvas，不 create。
 */
export function ChartBase<T extends BaseChartProps["type"]>(
  props: BaseChartProps<T>,
): JSXRenderable {
  ensureChartJsRegistered();
  const { type, data, options = {}, class: className, width, height } = props;

  /** 当前实例对应的 canvas，用于 ref(null) 时销毁 */
  let myCanvas: HTMLCanvasElement | null = null;

  const refCb = (el: HTMLCanvasElement | null) => {
    if (el) {
      myCanvas = el;
      const ext = el as CanvasWithChart;
      ext._chartType = type;
      const merged = mergeChartOptions(
        el,
        type,
        options as Record<string, unknown>,
      );
      if (ext._chart) {
        ext._chart.data = data as never;
        ext._chart.options = merged as never;
        ext._chart.update();
      } else {
        if (!canAcquireChartContext(el)) {
          // SSR／stub：保留 <canvas> 占位，等客户端真实 DOM ref 再 create
          return;
        }
        ext._chart = new Chart(el, {
          type,
          data: data as never,
          options: merged as never,
        }) as Chart<any, any, any>;
      }
      watchTheme(ext, options as Record<string, unknown>);
    } else {
      if (myCanvas) {
        const ext = myCanvas as CanvasWithChart;
        disconnectThemeWatch(ext);
        ext._chart?.destroy();
        ext._chart = undefined;
        ext._chartType = undefined;
        myCanvas = null;
      }
    }
  };

  return (
    <div
      class={className ?? "w-full h-64"}
      style={width != null || height != null
        ? { width: width ?? "100%", height: height ?? 256 }
        : undefined}
    >
      <canvas
        ref={refCb as (el: unknown) => void}
        width={width}
        height={height}
        aria-label={`Chart: ${type}`}
      />
    </div>
  );
}
