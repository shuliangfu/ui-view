/** 路由: /mobile/tab-bar */
import { createSignal } from "@dreamer/view";
import {
  IconHome,
  IconSearch,
  IconShoppingCart,
  IconUser,
  Paragraph,
  TabBar,
  Title,
} from "@dreamer/ui-view";

export default function MobileTabBar() {
  const [activeKey, setActiveKey] = createSignal("home");

  const items = [
    { key: "home", label: "首页", icon: <IconHome class="w-6 h-6" /> },
    { key: "search", label: "发现", icon: <IconSearch class="w-6 h-6" /> },
    { key: "cart", label: "购物车", icon: <IconShoppingCart class="w-6 h-6" />, badge: 3 },
    { key: "user", label: "我的", icon: <IconUser class="w-6 h-6" /> },
  ];

  return (
    <div class="space-y-6 pb-24">
      <Title level={1}>TabBar</Title>
      <Paragraph>底部 Tab 导航；支持图标、角标、固定、安全区、边框。</Paragraph>

      <TabBar
        items={items}
        activeKey={activeKey()}
        onChange={setActiveKey}
        fixed
        border
        safeAreaInsetBottom
      />

      <p class="text-sm text-slate-500">当前选中: {activeKey()}</p>
    </div>
  );
}
