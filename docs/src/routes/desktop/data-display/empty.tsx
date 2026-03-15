/** 路由: /data-display/empty */
import { Button, Empty, Paragraph, Title } from "@dreamer/ui-view";

export default function DataDisplayEmpty() {
  return (
    <div class="space-y-6">
      <Title level={1}>Empty</Title>
      <Paragraph>
        空状态：description、image、simple、footer；可自定义插图与描述样式（imageClass、descriptionClass）。
      </Paragraph>
      <Empty description="暂无数据" />
      <Empty
        description="没有找到相关结果"
        simple
        footer={<Button variant="primary">新建</Button>}
      />
      <Empty
        description="自定义插图可通过 image 传入节点"
        footer={<Button variant="ghost" size="sm">刷新</Button>}
      />
    </div>
  );
}
