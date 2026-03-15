/** 路由: /data-display/statistic */
import { Paragraph, Statistic, Title } from "@dreamer/ui-view";

export default function DataDisplayStatistic() {
  return (
    <div class="space-y-6">
      <Title level={1}>Statistic</Title>
      <Paragraph>统计数值：标题、数值、前缀/后缀、精度、千分位。</Paragraph>
      <div class="flex gap-8 flex-wrap">
        <Statistic title="总销售额" value={112893.5} prefix="¥" precision={2} />
        <Statistic title="访问量" value={8846} suffix="次" groupSeparator="," />
        <Statistic title="完成率" value={93.5} suffix="%" precision={1} />
      </div>
    </div>
  );
}
