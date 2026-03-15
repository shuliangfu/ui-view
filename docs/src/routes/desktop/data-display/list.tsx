/** 路由: /data-display/list */
import { List, Paragraph, Title } from "@dreamer/ui-view";

export default function DataDisplayList() {
  const items = [
    { key: "1", children: "列表项 1", extra: "详情" },
    {
      key: "2",
      children: "列表项 2",
      thumb: <span class="w-8 h-8 rounded bg-slate-200 dark:bg-slate-600" />,
    },
    { key: "3", children: "列表项 3", disabled: true },
  ];

  return (
    <div class="space-y-6">
      <Title level={1}>List</Title>
      <Paragraph>
        列表：header、footer、split、loading、bordered、grid。
      </Paragraph>
      <List
        header="列表标题"
        items={items}
        footer="共 3 条"
        bordered
      />
    </div>
  );
}
