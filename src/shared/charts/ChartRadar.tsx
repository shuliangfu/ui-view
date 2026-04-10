/**
 * 雷达图（Chart Radar）
 * 多维度对比
 */

import { ChartBase } from "./ChartBase.tsx";
import type { JSXRenderable } from "@dreamer/view";
import type { ChartData, ChartOptions } from "./types.ts";

export interface ChartRadarProps {
  data: ChartData<"radar">;
  options?: ChartOptions<"radar">;
  class?: string;
  width?: number;
  height?: number;
}

/** 雷达图组件 */
export function ChartRadar(props: ChartRadarProps): JSXRenderable {
  return <ChartBase type="radar" {...props} />;
}
