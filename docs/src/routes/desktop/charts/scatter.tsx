/**
 * 路由: /charts/scatter
 * 散点图示例
 */
import { ChartScatter, Paragraph, Title } from "@dreamer/ui-view";

const sampleData = {
  datasets: [
    {
      label: "系列 A",
      data: [{ x: 10, y: 20 }, { x: 25, y: 35 }, { x: 40, y: 15 }, {
        x: 55,
        y: 45,
      }, { x: 70, y: 30 }],
      backgroundColor: "rgba(102, 126, 234, 0.6)",
      borderColor: "rgb(102, 126, 234)",
    },
    {
      label: "系列 B",
      data: [{ x: 15, y: 40 }, { x: 35, y: 25 }, { x: 50, y: 50 }, {
        x: 65,
        y: 10,
      }],
      backgroundColor: "rgba(118, 75, 162, 0.6)",
      borderColor: "rgb(118, 75, 162)",
    },
  ],
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "top" as const } },
  scales: { x: { beginAtZero: true }, y: { beginAtZero: true } },
};

export default function ChartsScatter() {
  return (
    <div class="space-y-4">
      <Title level={1}>ScatterChart</Title>
      <Paragraph>散点图，二维分布、相关性展示。</Paragraph>
      <div class="w-full max-w-2xl h-64">
        <ChartScatter data={sampleData} options={options} class="w-full h-64" />
      </div>
    </div>
  );
}
