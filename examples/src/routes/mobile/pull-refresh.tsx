/** 路由: /mobile/pull-refresh */
import { createSignal } from "@dreamer/view";
import { Paragraph, PullRefresh, Title } from "@dreamer/ui-view";

export default function MobilePullRefresh() {
  const [loading, setLoading] = createSignal(false);
  const [list, setList] = createSignal([1, 2, 3, 4, 5]);

  const onRefresh = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setList((prev) => [prev.length + 1, ...prev]);
    setLoading(false);
  };

  return (
    <div class="space-y-6">
      <Title level={1}>PullRefresh</Title>
      <Paragraph>下拉刷新列表；支持自定义文案、阈值、loading 状态。</Paragraph>

      <div class="h-[320px] border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
        <PullRefresh
          loading={loading()}
          onRefresh={onRefresh}
          pullingText="下拉即可刷新…"
          loosingText="释放即可刷新…"
          loadingText="加载中…"
          headHeight={50}
          pullDistance={50}
        >
          <ul class="divide-y divide-slate-200 dark:divide-slate-600">
            {list().map((n) => (
              <li key={n} class="px-4 py-3 text-sm">
                列表项 {n}
              </li>
            ))}
          </ul>
        </PullRefresh>
      </div>
    </div>
  );
}
