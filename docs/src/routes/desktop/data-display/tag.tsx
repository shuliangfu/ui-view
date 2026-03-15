/** 路由: /data-display/tag */
import { createSignal } from "@dreamer/view";
import { Paragraph, Tag, Title } from "@dreamer/ui-view";

export default function DataDisplayTag() {
  const [closed, setClosed] = createSignal(false);

  return (
    <div class="space-y-6">
      <Title level={1}>Tag</Title>
      <Paragraph>标签：多色、可关闭、图标、尺寸、圆角。</Paragraph>
      <div class="flex flex-wrap gap-2">
        <Tag>默认</Tag>
        <Tag variant="primary">Primary</Tag>
        <Tag variant="success">Success</Tag>
        <Tag variant="warning">Warning</Tag>
        <Tag variant="danger">Danger</Tag>
        <Tag variant="outline">Outline</Tag>
      </div>
      <div class="flex flex-wrap gap-2">
        <Tag size="xs">xs</Tag>
        <Tag size="sm">sm</Tag>
        <Tag size="md">md</Tag>
        <Tag size="lg">lg</Tag>
      </div>
      {!closed() && (
        <Tag closable onClose={() => setClosed(true)}>
          可关闭
        </Tag>
      )}
    </div>
  );
}
