/** 路由: /data-display/collapse */
import { createSignal } from "@dreamer/view";
import { Collapse, Paragraph, Title } from "@dreamer/ui-view";

export default function DataDisplayCollapse() {
  const [activeKey, setActiveKey] = createSignal<string[]>(["1"]);

  const items = [
    {
      key: "1",
      header: "面板 1",
      children: <p class="text-sm text-slate-600">内容一</p>,
    },
    {
      key: "2",
      header: "面板 2",
      children: <p class="text-sm text-slate-600">内容二</p>,
    },
    {
      key: "3",
      header: "面板 3",
      children: <p class="text-sm text-slate-600">内容三</p>,
    },
  ];

  return (
    <div class="space-y-6">
      <Title level={1}>Collapse</Title>
      <Paragraph>折叠面板：手风琴/多开、边框、尺寸、showArrow。</Paragraph>
      <Collapse items={items} activeKey={activeKey()} onChange={setActiveKey} />
      <Collapse
        items={items}
        defaultActiveKey={["1"]}
        accordion
        bordered={false}
      />
    </div>
  );
}
