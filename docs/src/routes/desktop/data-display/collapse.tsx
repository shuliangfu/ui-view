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
      <Paragraph>
        折叠面板：items、activeKey、defaultActiveKey、onChange、accordion、bordered、ghost、size、showArrow、expandIcon。
      </Paragraph>
      <Title level={2}>受控 + 多开</Title>
      <Collapse items={items} activeKey={activeKey()} onChange={setActiveKey} />
      <Title level={2}>accordion 手风琴 + bordered=false</Title>
      <Collapse
        items={items}
        defaultActiveKey={["1"]}
        accordion
        bordered={false}
      />
      <Title level={2}>showArrow=false / size=sm</Title>
      <Collapse items={items} defaultActiveKey={[]} showArrow={false} />
      <Collapse items={items} defaultActiveKey={["1"]} size="sm" />
    </div>
  );
}
