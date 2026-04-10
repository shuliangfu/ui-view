/**
 * PullRefresh 文档页（概述、引入、示例、API）。路由: /mobile/feedback/pull-refresh
 */

import { PullRefresh } from "@dreamer/ui-view/mobile";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const PULL_REFRESH_API: DocsApiTableRow[] = [
  {
    name: "loading",
    type: "Signal | () => boolean",
    default: "-",
    description: "是否加载中；推荐 `loading={sig}`，勿仅传 `sig.value`",
  },
  {
    name: "onRefresh",
    type: "() => void | Promise<void>",
    default: "-",
    description: "下拉释放后触发；父级拉取数据后应将 loading 置 false",
  },
  {
    name: "pullingText",
    type: "string",
    default: "内置文案",
    description: "下拉过程提示",
  },
  {
    name: "loosingText",
    type: "string",
    default: "内置文案",
    description: "释放过程提示",
  },
  {
    name: "loadingText",
    type: "string",
    default: "内置文案",
    description: "加载中提示",
  },
  {
    name: "successText",
    type: "string | null",
    default: "null",
    description: "成功态文案；空则不显示成功动画",
  },
  {
    name: "successDuration",
    type: "number",
    default: "500",
    description: "成功提示展示时长（ms）",
  },
  {
    name: "headHeight",
    type: "number",
    default: "50",
    description: "头部指示区高度（px）",
  },
  {
    name: "pullDistance",
    type: "number",
    default: "同 headHeight",
    description: "触发刷新的下拉距离（px）",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "禁用下拉刷新",
  },
  { name: "class", type: "string", default: "-", description: "最外层 class" },
  {
    name: "scrollContainerRef",
    type: "(el: HTMLDivElement | null) => void",
    default: "-",
    description:
      "内层滚动容器（data-pull-refresh-content）挂载/卸载回调；供 ScrollList 等挂 IntersectionObserver",
  },
  {
    name: "children",
    type: "unknown",
    default: "-",
    description: "通常为可滚动列表主体",
  },
];

const importCode = `import { PullRefresh } from "@dreamer/ui-view/mobile";
import { createSignal } from "@dreamer/view";

const loading = createSignal(false);

<PullRefresh
  loading={loading}
  onRefresh={async () => {
    loading.value = true;
    await fetchData();
    loading.value = false;
  }}
>
  {listContent}
</PullRefresh>`;

export default function MobilePullRefreshDoc() {
  const loading = createSignal(false);

  return () => (
    <div class="w-full max-w-3xl space-y-10">
      <section>
        <Title level={1}>PullRefresh 下拉刷新</Title>
        <Paragraph class="mt-2">
          列表页顶部下拉触发刷新；<code class="text-sm">loading</code>{" "}
          由父组件在 <code class="text-sm">onRefresh</code>{" "}
          内控制，与桌面无对应单一组件，为移动端常见交互。
        </Paragraph>
      </section>

      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock
          title="代码示例"
          code={importCode}
          language="tsx"
          showLineNumbers
          wrapLongLines
        />
      </section>

      <section class="space-y-8">
        <Title level={2}>示例</Title>

        <div class="space-y-4">
          <Title level={3}>基础</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            在下方区域内向下拖拽即可触发（演示约 0.9s 后结束加载）。
          </Paragraph>
          <MobileDocDemo class="h-52 overflow-hidden p-0">
            <PullRefresh
              loading={loading}
              onRefresh={async () => {
                loading.value = true;
                await new Promise((r) => setTimeout(r, 900));
                loading.value = false;
              }}
            >
              <div class="p-6 text-sm text-slate-600 dark:text-slate-400">
                在此区域向下拖拽触发刷新
              </div>
            </PullRefresh>
          </MobileDocDemo>
          <CodeBlock
            title="代码示例"
            code={importCode}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>
      </section>

      <section class="space-y-4">
        <Title level={2}>API</Title>
        <DocsApiTable rows={PULL_REFRESH_API} />
      </section>
    </div>
  );
}
