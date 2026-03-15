/**
 * 气泡图（Chart Bubble）
 * 二维坐标 + 气泡大小表示第三维
 */

import { ChartBase } from "./ChartBase.tsx";
import type { ChartData, ChartOptions } from "./types.ts";

export interface ChartBubbleProps {
  data: ChartData<"bubble">;
  options?: ChartOptions<"bubble">;
  class?: string;
  width?: number;
  height?: number;
}

/** 气泡图组件 */
export function ChartBubble(props: ChartBubbleProps) {
  return () => <ChartBase type="bubble" {...props} />;
}
