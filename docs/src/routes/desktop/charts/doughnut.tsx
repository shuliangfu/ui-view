/**
 * 路由: /charts/doughnut
 * 环形图示例
 */
import { ChartDoughnut, Paragraph, Title } from "@dreamer/ui-view";

const sampleData = {
  labels: ["A", "B", "C", "D"],
  datasets: [{
    data: [35, 30, 20, 15],
    backgroundColor: ["#667eea", "#764ba2", "#4facfe", "#43e97b"],
    borderWidth: 1,
  }],
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "right" as const } },
};

export default function ChartsDoughnut() {
  return (
    <div class="space-y-4">
      <Title level={1}>ChartDoughnut</Title>
      <Paragraph>
        环形图：data、options、class、width、height。与饼图类似，中间留空；data 结构与饼图一致。
      </Paragraph>
      <div class="w-full max-w-md h-64">
        <ChartDoughnut
          data={sampleData}
          options={options}
          class="w-full h-64"
        />
      </div>
    </div>
  );
}
