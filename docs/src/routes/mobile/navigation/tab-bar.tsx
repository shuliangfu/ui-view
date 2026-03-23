/**
 * TabBar 文档与示例。路由: /mobile/navigation/tab-bar
 */

import { TabBar } from "@dreamer/ui-view/mobile";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

export default function MobileTabBarDoc() {
  const activeKey = createSignal("home");

  return () => (
    <div class="w-full max-w-lg space-y-8">
      <div>
        <Title level={1} class="text-2xl sm:text-3xl">
          TabBar
        </Title>
        <Paragraph class="mt-2 text-slate-600 dark:text-slate-400">
          底部标签导航；当前示例使用 <code class="text-sm">fixed={false}</code>
          {" "}
          以免遮挡文档布局。
        </Paragraph>
      </div>

      <div class="rounded-xl border border-slate-200 dark:border-slate-600 p-4 bg-white dark:bg-slate-900 relative min-h-[120px]">
        <p class="text-sm text-slate-500 mb-2">
          当前：<span class="font-mono">{activeKey.value}</span>
        </p>
        <TabBar
          fixed={false}
          items={[
            { key: "home", label: "首页" },
            { key: "list", label: "列表" },
            { key: "me", label: "我的" },
          ]}
          activeKey={activeKey.value}
          onChange={(k) => (activeKey.value = k)}
        />
      </div>

      <CodeBlock
        language="tsx"
        copyable
        code={`import { TabBar } from "@dreamer/ui-view/mobile";

<TabBar
  items={[{ key: "a", label: "首页" }]}
  activeKey={activeKey.value}
  onChange={(k) => (activeKey.value = k)}
/>`}
      />
    </div>
  );
}
