/**
 * PullRefresh 文档与示例。路由: /mobile/feedback/pull-refresh
 */

import { PullRefresh } from "@dreamer/ui-view/mobile";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

export default function MobilePullRefreshDoc() {
  const loading = createSignal(false);

  return () => (
    <div class="w-full max-w-lg space-y-8">
      <div>
        <Title level={1} class="text-2xl sm:text-3xl">
          PullRefresh
        </Title>
        <Paragraph class="mt-2 text-slate-600 dark:text-slate-400">
          列表顶部下拉刷新；<code class="text-sm">loading</code> 由父组件在{" "}
          <code class="text-sm">onRefresh</code> 中置 true/false。
        </Paragraph>
      </div>

      <div class="rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden bg-white dark:bg-slate-900 h-48">
        <PullRefresh
          loading={loading.value}
          onRefresh={async () => {
            loading.value = true;
            await new Promise((r) => setTimeout(r, 900));
            loading.value = false;
          }}
        >
          <div class="p-6 text-slate-600 dark:text-slate-400 text-sm">
            在此区域向下拖拽触发刷新（演示约 0.9s）
          </div>
        </PullRefresh>
      </div>

      <CodeBlock
        language="tsx"
        copyable
        code={`import { PullRefresh } from "@dreamer/ui-view/mobile";

<PullRefresh loading={loading.value} onRefresh={async () => { ... }}>
  {children}
</PullRefresh>`}
      />
    </div>
  );
}
