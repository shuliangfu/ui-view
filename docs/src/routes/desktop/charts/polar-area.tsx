/**
 * 路由: /charts/polar-area
 * 极区图示例
 */
import { ChartPolarArea, Paragraph, Title } from "@dreamer/ui-view";

const sampleData = {
  labels: ["红", "绿", "蓝", "黄", "紫"],
  datasets: [{
    data: [11, 16, 7, 14, 9],
    backgroundColor: [
      "rgba(102, 126, 234, 0.6)",
      "rgba(118, 75, 162, 0.6)",
      "rgba(79, 172, 254, 0.6)",
      "rgba(67, 233, 123, 0.6)",
      "rgba(250, 112, 154, 0.6)",
    ],
    borderWidth: 1,
  }],
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "right" as const } },
};

export default function ChartsPolarArea() {
  return (
    <div class="space-y-4">
      <Title level={1}>PolarAreaChart</Title>
      <Paragraph>极区图，极坐标下的扇形面积。</Paragraph>
      <div class="w-full max-w-md h-64">
        <ChartPolarArea
          data={sampleData}
          options={options}
          class="w-full h-64"
        />
      </div>
    </div>
  );
}
