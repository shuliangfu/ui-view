/** 路由: /layout/tabs */
import { createSignal } from "@dreamer/view";
import { Paragraph, Tabs, Title } from "@dreamer/ui-view";

export default function LayoutTabs() {
  const [activeKey, setActiveKey] = createSignal("a");

  const items = [
    {
      key: "a",
      label: "标签 A",
      children: (
        <p class="text-sm text-slate-600 dark:text-slate-400">
          内容 A
        </p>
      ),
    },
    {
      key: "b",
      label: "标签 B",
      children: (
        <p class="text-sm text-slate-600 dark:text-slate-400">
          内容 B
        </p>
      ),
    },
    {
      key: "c",
      label: "标签 C",
      children: (
        <p class="text-sm text-slate-600 dark:text-slate-400">
          内容 C
        </p>
      ),
    },
  ];

  return (
    <div class="space-y-6">
      <Title level={1}>Tabs</Title>
      <Paragraph>标签页：受控 activeKey + onChange，line/card 样式。</Paragraph>

      <Tabs
        items={items}
        activeKey={activeKey()}
        onChange={(k) => setActiveKey(k)}
        type="line"
      />

      <Tabs
        items={items}
        activeKey={activeKey()}
        onChange={(k) => setActiveKey(k)}
        type="card"
      />
    </div>
  );
}
