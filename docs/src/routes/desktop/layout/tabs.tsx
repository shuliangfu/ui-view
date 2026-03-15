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
      <Paragraph>
        标签页：items（key、label、disabled、children）、activeKey、onChange、type（line/card）、fullWidth、class、tabListClass、panelClass。
      </Paragraph>

      <Title level={2}>type=line</Title>
      <Tabs
        items={items}
        activeKey={activeKey()}
        onChange={(k) => setActiveKey(k)}
        type="line"
      />
      <Title level={2}>type=card</Title>
      <Tabs
        items={items}
        activeKey={activeKey()}
        onChange={(k) => setActiveKey(k)}
        type="card"
      />
      <Title level={2}>fullWidth</Title>
      <Tabs
        items={items}
        activeKey={activeKey()}
        onChange={(k) => setActiveKey(k)}
        type="line"
        fullWidth
      />
      <Title level={2}>items 含 disabled</Title>
      <Tabs
        items={[
          ...items.slice(0, 2),
          { key: "c", label: "标签 C（禁用）", disabled: true, children: <p class="text-sm">不可选</p> },
        ]}
        activeKey={activeKey()}
        onChange={(k) => setActiveKey(k)}
        type="line"
      />
    </div>
  );
}
