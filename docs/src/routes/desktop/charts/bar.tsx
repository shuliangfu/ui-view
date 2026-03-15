/**
 * 路由: /charts/bar
 * 柱状图示例
 */
import { ChartBar, Paragraph, Title } from "@dreamer/ui-view";

const sampleData = {
  labels: ["红", "绿", "蓝", "黄", "紫", "橙"],
  datasets: [{
    label: "数量",
    data: [12, 19, 6, 14, 8, 11],
    backgroundColor: [
      "#667eea",
      "#764ba2",
      "#4facfe",
      "#43e97b",
      "#fa709a",
      "#fee140",
    ],
  }],
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true } },
};

export default function ChartsBar() {
  return (
    <div class="space-y-4">
      <Title level={1}>ChartBar</Title>
      <Paragraph>
        柱状图：data、options、class、width、height。用于分类对比，支持水平/垂直、堆叠；data.datasets 支持 label、data、backgroundColor；options.scales 控制坐标轴。
      </Paragraph>
      <div class="w-full max-w-2xl h-64">
        <ChartBar data={sampleData} options={options} class="w-full h-64" />
      </div>
    </div>
  );
}
