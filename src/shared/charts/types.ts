/**
 * Chart 组件通用类型
 * 与 Chart.js 的 data / options 结构对齐，便于业务传入
 */

/** Chart.js 支持的图表类型（本库子集，均已在 ChartBase 注册） */
export type ChartType =
  | "line"
  | "bar"
  | "pie"
  | "doughnut"
  | "radar"
  | "polarArea"
  | "bubble"
  | "scatter";

/**
 * 图表 data 结构（Chart.js ChartData）。
 * 保持宽类型以免各 Chart* 包装在严格泛型下与 Chart 构造器不兼容。
 */
export type ChartData<T extends ChartType = ChartType> = {
  // T 仅作文档区分；运行时由 ChartBase `type` 决定控制器
  labels?: unknown[];
  datasets: unknown[];
} & Record<string, unknown>;

/** 图表 options（Chart.js ChartOptions） */
export type ChartOptions<T extends ChartType = ChartType> = Record<
  string,
  unknown
>;

export interface BaseChartProps<T extends ChartType = ChartType> {
  /** 图表类型 */
  type: T;
  /** Chart.js data 结构 */
  data: ChartData<T>;
  /** Chart.js options，可选 */
  options?: ChartOptions<T>;
  /** 容器 class，用于控制尺寸与布局 */
  class?: string;
  /** 画布宽度（可选，也可用 class 控制） */
  width?: number;
  /** 画布高度（可选） */
  height?: number;
}
