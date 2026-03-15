/**
 * 路由: /charts/line
 * 折线图示例
 */
import { ChartLine, Paragraph, Title } from "@dreamer/ui-view";

const sampleData = {
  labels: ["1月", "2月", "3月", "4月", "5月", "6月"],
  datasets: [
    {
      label: "系列 A",
      data: [12, 19, 8, 15, 22, 18],
      borderColor: "rgb(102, 126, 234)",
      backgroundColor: "rgba(102, 126, 234, 0.2)",
      fill: true,
      tension: 0.3,
    },
    {
      label: "系列 B",
      data: [2, 9, 14, 11, 6, 12],
      borderColor: "rgb(118, 75, 162)",
      backgroundColor: "rgba(118, 75, 162, 0.2)",
      fill: true,
      tension: 0.3,
    },
  ],
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "top" as const } },
};

export default function ChartsLine() {
  return (
    <div class="space-y-4">
      <Title level={1}>LineChart</Title>
      <Paragraph>
        折线图：data、options、class、width、height。用于趋势、时序数据，支持多系列与面积填充；data.datasets 支持 label、data、borderColor、backgroundColor、fill、tension。
      </Paragraph>
      <div class="w-full max-w-2xl h-64">
        <ChartLine data={sampleData} options={options} class="w-full h-64" />
      </div>
    </div>
  );
}
