/** 路由: /data-display/descriptions */
import { Descriptions, Paragraph, Title } from "@dreamer/ui-view";

export default function DataDisplayDescriptions() {
  const items = [
    { label: "姓名", children: "张三" },
    { label: "年龄", children: "28" },
    { label: "城市", children: "北京" },
    { label: "备注", children: "描述列表键值对展示", span: 2 },
  ];

  return (
    <div class="space-y-6">
      <Title level={1}>Descriptions</Title>
      <Paragraph>描述列表：键值对、标题、列数、边框、尺寸、布局。</Paragraph>
      <Descriptions title="用户信息" items={items} column={3} bordered />
      <Descriptions items={items.slice(0, 3)} layout="vertical" />
    </div>
  );
}
