/**
 * 折线图（Chart Line）
 * 用于趋势、时序数据，支持多系列与面积填充
 */

import { ChartBase } from "./ChartBase.tsx";
import type { ChartData, ChartOptions } from "./types.ts";

export interface ChartLineProps {
  data: ChartData<"line">;
  options?: ChartOptions<"line">;
  class?: string;
  width?: number;
  height?: number;
}

/** 折线图组件 */
export function ChartLine(props: ChartLineProps) {
  return () => <ChartBase type="line" {...props} />;
}
