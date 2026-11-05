/**
 * 图表基座组件：基于 Chart.js 与 canvas，统一处理创建/更新/销毁。
 * 按需 `Chart.register` 本库用到的 controller／element／scale／plugin，
 * **勿** `import "chart.js/auto"`（会注册全量控制器增大包体）。
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
import type { BaseChartProps } from "./types.ts";

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
  chartJsRegistered = true;
}

/** canvas 元素上挂载的 Chart 实例（用于更新与销毁） */
interface CanvasWithChart extends HTMLCanvasElement {
  // deno-lint-ignore no-explicit-any
  _chart?: Chart<any, any, any>;
}

/**
 * 通用图表组件：根据 type / data / options 渲染 Chart.js 图表。
 * 在 canvas 挂载时创建 Chart，在 data/options 变化时 update，在 unmount 时 destroy。
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
      if (ext._chart) {
        ext._chart.data = data as never;
        ext._chart.options = { ...ext._chart.options, ...(options as object) };
        ext._chart.update();
      } else {
        // data／options 保持业务宽类型；构造时交给 Chart.js 运行时校验
        ext._chart = new Chart(el, {
          type,
          data: data as never,
          options: options as never,
        }) as Chart<any, any, any>;
      }
    } else {
      if (myCanvas) {
        const ext = myCanvas as CanvasWithChart;
        ext._chart?.destroy();
        ext._chart = undefined;
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
