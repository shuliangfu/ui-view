/** 路由: /navigation/tab-bar */
import { createSignal } from "@dreamer/view";
import { Paragraph, TabBar, Title } from "@dreamer/ui-view";

export default function NavigationTabBar() {
  const [activeKey, setActiveKey] = createSignal("home");

  const items = [
    { key: "home", label: "首页", icon: <span class="text-lg">🏠</span> },
    {
      key: "list",
      label: "列表",
      icon: <span class="text-lg">📋</span>,
      badge: 3,
    },
    { key: "user", label: "我的", icon: <span class="text-lg">👤</span> },
  ];

  return (
    <div class="space-y-6">
      <Title level={1}>TabBar</Title>
      <Paragraph>
        底部标签栏：items(key/label/icon/badge)、activeKey、onChange；常用于移动端底部导航。
      </Paragraph>

      <div class="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
        <div class="h-48 flex items-center justify-center text-slate-500">
          当前: {activeKey()}
        </div>
        <TabBar
          items={items}
          activeKey={activeKey()}
          onChange={setActiveKey}
          fixed={false}
        />
      </div>
    </div>
  );
}
