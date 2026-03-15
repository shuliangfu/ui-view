/**
 * 路由: /charts/bubble
 * 气泡图示例
 */
import { ChartBubble, Paragraph, Title } from "@dreamer/ui-view";

const sampleData = {
  datasets: [
    {
      label: "系列 A",
      data: [{ x: 20, y: 30, r: 15 }, { x: 40, y: 10, r: 10 }, {
        x: 50,
        y: 45,
        r: 20,
      }, { x: 70, y: 25, r: 12 }],
      backgroundColor: "rgba(102, 126, 234, 0.6)",
      borderColor: "rgb(102, 126, 234)",
    },
    {
      label: "系列 B",
      data: [{ x: 25, y: 45, r: 8 }, { x: 55, y: 20, r: 18 }, {
        x: 60,
        y: 55,
        r: 10,
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

export default function ChartsBubble() {
  return (
    <div class="space-y-4">
      <Title level={1}>ChartBubble</Title>
      <Paragraph>气泡图，二维坐标 + 气泡大小表示第三维。</Paragraph>
      <div class="w-full max-w-2xl h-64">
        <ChartBubble data={sampleData} options={options} class="w-full h-64" />
      </div>
    </div>
  );
}
