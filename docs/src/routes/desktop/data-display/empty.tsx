/** 路由: /data-display/empty */
import { Button, Empty, Paragraph, Title } from "@dreamer/ui-view";

export default function DataDisplayEmpty() {
  return (
    <div class="space-y-6">
      <Title level={1}>Empty</Title>
      <Paragraph>
        空状态：无数据占位，支持自定义插图、描述、底部操作。
      </Paragraph>
      <Empty description="暂无数据" />
      <Empty
        description="没有找到相关结果"
        simple
        footer={<Button variant="primary">新建</Button>}
      />
    </div>
  );
}
