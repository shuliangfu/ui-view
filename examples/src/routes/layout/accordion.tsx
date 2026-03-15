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
        手风琴折叠：expandedKeys + onChange，allowMultiple；常见于 FAQ、设置。
      </Paragraph>

      <Accordion
        items={items}
        expandedKeys={expandedKeys()}
        onChange={setExpandedKeys}
        allowMultiple
      />

      <Title level={2}>单选（allowMultiple=false）</Title>
      <Accordion
        items={items}
        expandedKeys={expandedKeys()}
        onChange={setExpandedKeys}
        allowMultiple={false}
      />
    </div>
  );
}
