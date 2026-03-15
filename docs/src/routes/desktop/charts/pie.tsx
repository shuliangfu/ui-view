/**
 * 路由: /charts/pie
 * 饼图示例
 */
import { ChartPie, Paragraph, Title } from "@dreamer/ui-view";

const sampleData = {
  labels: ["A", "B", "C", "D", "E"],
  datasets: [{
    data: [30, 25, 20, 15, 10],
    backgroundColor: ["#667eea", "#764ba2", "#4facfe", "#43e97b", "#fa709a"],
    borderWidth: 1,
  }],
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "right" as const } },
};

export default function ChartsPie() {
  return (
    <div class="space-y-4">
      <Title level={1}>PieChart</Title>
      <Paragraph>
        饼图：data、options、class、width、height。用于占比、构成展示；data.labels、data.datasets[].data、backgroundColor、borderWidth；options.plugins.legend 控制图例位置。
      </Paragraph>
      <div class="w-full max-w-md h-64">
        <ChartPie data={sampleData} options={options} class="w-full h-64" />
      </div>
    </div>
  );
}
