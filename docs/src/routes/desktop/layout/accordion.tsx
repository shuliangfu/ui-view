/** 路由: /layout/accordion */
import { createSignal } from "@dreamer/view";
import { Accordion, Paragraph, Title } from "@dreamer/ui-view";

export default function LayoutAccordion() {
  const [expandedKeys, setExpandedKeys] = createSignal<string[]>(["1"]);

  const items = [
    {
      key: "1",
      header: "第一项",
      children: <p class="text-sm">第一项展开内容。</p>,
    },
    {
      key: "2",
      header: "第二项",
      children: <p class="text-sm">第二项展开内容。</p>,
    },
    {
      key: "3",
      header: "第三项",
      children: <p class="text-sm">第三项展开内容。</p>,
    },
  ];

  return (
    <div class="space-y-6">
      <Title level={1}>Accordion</Title>
      <Paragraph>
        手风琴：items（key、header、disabled、children）、expandedKeys、defaultExpandedKeys、onChange、allowMultiple、class、itemClass、headerClass、contentClass。
      </Paragraph>

      <Title level={2}>allowMultiple=true</Title>
      <Accordion
        items={items}
        expandedKeys={expandedKeys()}
        onChange={setExpandedKeys}
        allowMultiple
      />
      <Title level={2}>allowMultiple=false（单选）</Title>
      <Accordion
        items={items}
        expandedKeys={expandedKeys()}
        onChange={setExpandedKeys}
        allowMultiple={false}
      />
      <Title level={2}>items 含 disabled</Title>
      <Accordion
        items={[
          { key: "1", header: "可展开", children: <p class="text-sm">内容</p> },
          { key: "2", header: "禁用项", disabled: true, children: <p class="text-sm">不可点击</p> },
        ]}
        expandedKeys={["1"]}
        onChange={() => {}}
      />
    </div>
  );
}
