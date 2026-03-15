/** 路由: /data-display/card */
import { Button, Card, Paragraph, Title } from "@dreamer/ui-view";

export default function DataDisplayCard() {
  return (
    <div class="space-y-6">
      <Title level={1}>Card</Title>
      <Paragraph>
        卡片：标题、extra、封面、footer、边框、悬浮、loading。
      </Paragraph>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        <Card
          title="卡片标题"
          extra={<Button variant="ghost" size="xs">更多</Button>}
        >
          <p class="text-sm text-slate-600 dark:text-slate-400">
            卡片内容区域。
          </p>
        </Card>
        <Card
          title="带底部"
          footer={<span class="text-xs text-slate-500">底部信息</span>}
        >
          <p class="text-sm text-slate-600 dark:text-slate-400">内容。</p>
        </Card>
        <Card hoverable title="悬浮效果">
          <p class="text-sm text-slate-600 dark:text-slate-400">
            hover 时阴影。
          </p>
        </Card>
        <Card loading title="加载中">
          <p>内容被骨架替换</p>
        </Card>
      </div>
    </div>
  );
}
