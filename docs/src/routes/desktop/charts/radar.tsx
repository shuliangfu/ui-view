/**
 * 路由: /charts/radar
 * 雷达图示例
 */
import { ChartRadar, Paragraph, Title } from "@dreamer/ui-view";

const sampleData = {
  labels: ["速度", "力量", "耐力", "技巧", "防守", "进攻"],
  datasets: [
    {
      label: "系列 A",
      data: [65, 59, 90, 81, 56, 55],
      borderColor: "rgb(102, 126, 234)",
      backgroundColor: "rgba(102, 126, 234, 0.2)",
      pointBackgroundColor: "rgb(102, 126, 234)",
    },
    {
      label: "系列 B",
      data: [28, 48, 40, 19, 96, 27],
      borderColor: "rgb(118, 75, 162)",
      backgroundColor: "rgba(118, 75, 162, 0.2)",
      pointBackgroundColor: "rgb(118, 75, 162)",
    },
  ],
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "top" as const } },
};

export default function ChartsRadar() {
  return (
    <div class="space-y-4">
      <Title level={1}>ChartRadar</Title>
      <Paragraph>
        雷达图：data、options、class、width、height。多维度对比；data.labels 为维度名，datasets 含 label、data、borderColor、backgroundColor、pointBackgroundColor。
      </Paragraph>
      <div class="w-full max-w-md h-64">
        <ChartRadar data={sampleData} options={options} class="w-full h-64" />
      </div>
    </div>
  );
}
