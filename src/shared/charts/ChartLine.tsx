/**
 * 折线图（Chart Line）
 * 用于趋势、时序数据，支持多系列与面积填充
 */

import { ChartBase } from "./ChartBase.tsx";
import type { JSXRenderable } from "@dreamer/view";
import type { ChartData, ChartOptions } from "./types.ts";

export interface ChartLineProps {
  data: ChartData<"line">;
  options?: ChartOptions<"line">;
  class?: string;
  width?: number;
  height?: number;
}

/**
 * 折线图组件：将 `line` 类型的 Chart.js 配置交给 {@link ChartBase} 渲染。
 *
 * @param props - `data` 为必填；`options` 可选；`class`/`width`/`height` 控制画布容器样式与尺寸
 * @returns 延迟求值的视图树（{@link JSXRenderable}），与 `@dreamer/view` 的 `jsx` 一致
 */
export function ChartLine(props: ChartLineProps): JSXRenderable {
  return <ChartBase type="line" {...props} />;
}
