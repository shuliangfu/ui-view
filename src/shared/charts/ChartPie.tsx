/**
 * 饼图（Chart Pie）
 * 用于占比、构成展示
 */

import { ChartBase } from "./ChartBase.tsx";
import type { ChartData, ChartOptions } from "./types.ts";

export interface ChartPieProps {
  data: ChartData<"pie">;
  options?: ChartOptions<"pie">;
  class?: string;
  width?: number;
  height?: number;
}

/** 饼图组件 */
export function ChartPie(props: ChartPieProps) {
  return <ChartBase type="pie" {...props} />;
}
