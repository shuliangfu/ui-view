/** 路由: /data-display/timeline */
import { Paragraph, Timeline, Title } from "@dreamer/ui-view";

export default function DataDisplayTimeline() {
  const items = [
    {
      key: "1",
      label: "2024-01-01",
      children: "创建项目",
      color: "primary" as const,
    },
    { key: "2", label: "2024-02-01", children: "完成设计" },
    {
      key: "3",
      label: "2024-03-01",
      children: "开发完成",
      color: "success" as const,
    },
    { key: "4", children: "待定", pending: true },
  ];

  return (
    <div class="space-y-6">
      <Title level={1}>Timeline</Title>
      <Paragraph>
        时间轴：items（key、label、children、color、dot、pending）、mode（left/right/alternate）、pending。
      </Paragraph>
      <Title level={2}>mode=left</Title>
      <Timeline items={items} mode="left" />
      <Title level={2}>mode=alternate</Title>
      <Timeline items={items.slice(0, 3)} mode="alternate" />
      <Title level={2}>mode=right</Title>
      <Timeline items={items.slice(0, 2)} mode="right" />
    </div>
  );
}
