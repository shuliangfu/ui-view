/**
 * ScrollList 文档页（概述、引入、示例、API）。路由: /mobile/data-display/scroll-list
 */

import { ScrollList } from "@dreamer/ui-view/mobile";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import { createMemo, createSignal } from "@dreamer/view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const SCROLL_LIST_API: DocsApiTableRow[] = [
  {
    name:
      "items / renderItem / header / footer / size / split / bordered / itemClass / grid",
    type: "同 List",
    default: "-",
    description: "与 {@link List} 一致的列表展示配置",
  },
  {
    name: "class / listClass",
    type: "string",
    default: "-",
    description: "外层（PullRefresh）与 List 根节点 class",
  },
  {
    name: "refreshLoading",
    type: "Signal | () => boolean",
    default: "-",
    description: "下拉刷新中；推荐 `refreshLoading={sig}`",
  },
  {
    name: "onRefresh",
    type: "() => void | Promise<void>",
    default: "-",
    description: "下拉释放后刷新首页数据",
  },
  {
    name: "loadMoreLoading",
    type: "Signal | () => boolean",
    default: "-",
    description: "加载更多中；为 true 时底部不会重复触发",
  },
  {
    name: "hasMore",
    type: "boolean",
    default: "true",
    description: "为 false 时不再调用 onLoadMore，底部展示 noMoreText",
  },
  {
    name: "onLoadMore",
    type: "() => void | Promise<void>",
    default: "-",
    description: "滚动接近底部时触发分页请求",
  },
  {
    name: "disabledPull",
    type: "boolean",
    default: "false",
    description: "禁用下拉刷新",
  },
  {
    name: "noMoreText",
    type: "string",
    default: '"没有更多了"',
    description: "无更多时的底部文案",
  },
  {
    name: "loadMoreRootMargin",
    type: "string",
    default: '"80px 0px"',
    description: "IntersectionObserver 的 rootMargin，可提前触发加载",
  },
  {
    name: "pullRefreshTexts",
    type: "object",
    default: "-",
    description: "透传 PullRefresh 的 pullingText、loadingText 等",
  },
];

const importCode = `import { ScrollList } from "@dreamer/ui-view/mobile";
import { createSignal } from "@dreamer/view";

const refreshLoading = createSignal(false);
const loadMoreLoading = createSignal(false);
const items = createSignal<Item[]>([]);

<ScrollList
  items={items}
  renderItem={(row) => <span>{row.title}</span>}
  refreshLoading={refreshLoading}
  onRefresh={async () => { /* 重置页码并拉首屏 */ }}
  loadMoreLoading={loadMoreLoading}
  hasMore={page < totalPages}
  onLoadMore={async () => { /* 下一页 */ }}
/>`;

/** 演示用：生成一页假数据 */
function makePage(start: number, len: number) {
  return Array.from({ length: len }, (_, i) => ({
    key: `k-${start + i}`,
    children: `条目 ${start + i + 1}`,
  }));
}

export default function MobileScrollListDoc() {
  const refreshLoading = createSignal(false);
  const loadMoreLoading = createSignal(false);
  /** 当前已加载条数（演示分页） */
  const totalLoaded = createSignal(12);
  /** 是否还有下一页 */
  const hasMore = createSignal(true);
  const PAGE = 8;
  const MAX = 28;

  /** 由条数派生列表数据，供 ScrollList 使用 */
  const listItems = createMemo(() => makePage(0, totalLoaded.value));

  return () => (
    <div class="w-full max-w-3xl space-y-10">
      <section>
        <Title level={1}>ScrollList 滚动列表</Title>
        <Paragraph class="mt-2">
          组合 <code class="text-sm">PullRefresh</code> 与{" "}
          <code class="text-sm">List</code>
          ：顶部下拉刷新，底部接近可视区域时自动触发{" "}
          <code class="text-sm">onLoadMore</code>（基于内层滚动容器的{" "}
          <code class="text-sm">IntersectionObserver</code>）。
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
          <Title level={3}>下拉刷新 + 上拉加载</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            在框内<strong>向下拖拽</strong>模拟刷新（重置为 12 条）；<strong>
              滚到底部
            </strong>{" "}
            自动加载更多，演示数据最多 28 条。
          </Paragraph>
          <MobileDocDemo class="h-72 overflow-hidden p-0">
            <ScrollList
              class="h-full"
              listClass="border-0 rounded-none"
              bordered={false}
              split
              size="sm"
              items={listItems()}
              refreshLoading={refreshLoading}
              onRefresh={async () => {
                refreshLoading.value = true;
                await new Promise((r) => setTimeout(r, 700));
                totalLoaded.value = 12;
                hasMore.value = true;
                refreshLoading.value = false;
              }}
              loadMoreLoading={loadMoreLoading}
              hasMore={hasMore.value}
              onLoadMore={async () => {
                if (!hasMore.value || loadMoreLoading.value) return;
                loadMoreLoading.value = true;
                await new Promise((r) => setTimeout(r, 600));
                const next = Math.min(totalLoaded.value + PAGE, MAX);
                totalLoaded.value = next;
                hasMore.value = next < MAX;
                loadMoreLoading.value = false;
              }}
            />
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
        <DocsApiTable rows={SCROLL_LIST_API} />
      </section>
    </div>
  );
}
