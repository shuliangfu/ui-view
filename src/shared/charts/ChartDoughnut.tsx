/**
 * 环形图（Chart Doughnut）
 * 与饼图类似，中间留空，常用于占比
 */

import { ChartBase } from "./ChartBase.tsx";
import type { ChartData, ChartOptions } from "./types.ts";

export interface ChartDoughnutProps {
  data: ChartData<"doughnut">;
  options?: ChartOptions<"doughnut">;
  class?: string;
  width?: number;
  height?: number;
}

/** 环形图组件 */
export function ChartDoughnut(props: ChartDoughnutProps) {
  return <ChartBase type="doughnut" {...props} />;
}
