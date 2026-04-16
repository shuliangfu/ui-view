/**
 * ScrollList 文档页（概述、引入、示例、API）。路由: /mobile/data-display/scroll-list
 */

import { ScrollList } from "@dreamer/ui-view/mobile";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import { createMemo, createSignal } from "@dreamer/view";
import type { JSXRenderable } from "@dreamer/view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MOBILE_DOC_DEMO_SHELL_BASE } from "../../../components/MobileDocDemo.tsx";

const SCROLL_LIST_API: DocsApiTableRow[] = [
  {
    name:
      "items / renderItem / header / footer / size / split / bordered / itemClass / grid",
    type: "同 List",
    default: "-",
    description:
      "与 {@link List} 一致；`items` 分页数据请用 `items={() => rows()}` 等形式，勿仅 `items={rows()}`（首帧快照）",
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
    type: "boolean | Signal | () => boolean",
    default: "true",
    description:
      "为 false 时不再调用 onLoadMore；推荐 `hasMore={sig}`，勿只传 `sig.value`（易与观察器重连不同步）",
  },
  {
    name: "onLoadMore",
    type: "() => void | Promise<void>",
    default: "-",
    description:
      "滚动接近底部时触发分页请求；须在列表内产生过滚动，且上一发完成后须再次滚动才会触发下一发，避免 IO 重连时连载多页",
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
    default: '"0px 0px 0px 0px"',
    description:
      "IntersectionObserver 的 rootMargin；默认 0 须滚到哨兵进视口；略提前可用如 0px 0px 48px 0px",
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
  items={() => items()}
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

/** 首屏条数（与每页追加条数一致，便于演示） */
const FIRST_SCREEN = 10;
/** 每页上拉追加条数 */
const PAGE = 10;
/** 演示数据上限（首屏 10 + 两页各 10 = 30） */
const MAX = 30;

/**
 * 文档示例里**仅列表与分页状态**所在层：`items` 变化时只重算本组件，不重跑外层示意外壳，
 * 减少 `data-ui-scrolllist-doc-demo` 与内层 `PullRefresh` 在 reconcile 时「整块像被换掉」的观感；
 * 行级增量仍由 {@link ScrollList} 内 `List` + 键控 `For` 完成。
 *
 * @returns 内嵌 ScrollList
 */
function ScrollListDocListBody(): JSXRenderable {
  const refreshLoading = createSignal(false);
  const loadMoreLoading = createSignal(false);
  /** 当前列表行（上拉只追加新页，勿每次 `makePage(0, n)` 整表换新对象） */
  const listRows = createSignal(makePage(0, FIRST_SCREEN));
  const hasMore = createSignal(true);

  /* 父级示意外壳为 flex 列 + h-72：须 min-h-0 flex-1 把可滚高度交给 PullRefresh */
  return (
    <ScrollList
      class="min-h-0 flex-1"
      listClass="border-0 rounded-none"
      bordered={false}
      split
      size="sm"
      items={() => listRows.value}
      refreshLoading={refreshLoading}
      onRefresh={async () => {
        refreshLoading.value = true;
        await new Promise((r) => setTimeout(r, 700));
        listRows.value = makePage(0, FIRST_SCREEN);
        hasMore.value = true;
        refreshLoading.value = false;
      }}
      loadMoreLoading={loadMoreLoading}
      hasMore={hasMore}
      onLoadMore={async () => {
        if (!hasMore.value || loadMoreLoading.value) return;
        loadMoreLoading.value = true;
        await new Promise((r) => setTimeout(r, 600));
        const cur = listRows.value.length;
        const add = Math.min(PAGE, MAX - cur);
        if (add > 0) {
          listRows.value = [...listRows.value, ...makePage(cur, add)];
        }
        hasMore.value = listRows.value.length < MAX;
        loadMoreLoading.value = false;
      }}
    />
  );
}

/**
 * ScrollList 文档内嵌示例：外壳与列表子树分离，外壳 class 用 memo 固定。
 *
 * @returns 带固定高度外框的 ScrollList 演示
 */
function ScrollListDocInteractiveDemo(): JSXRenderable {
  /** 与原先 `MobileDocDemo class="h-72 overflow-hidden p-0"` 一致，用 memo 固定字符串引用 */
  const demoRootClass = createMemo(
    () =>
      `${MOBILE_DOC_DEMO_SHELL_BASE} flex h-72 min-h-0 flex-col overflow-hidden p-0`,
  );

  return (
    <div
      class={demoRootClass()}
      data-ui-scrolllist-doc-demo=""
    >
      <ScrollListDocListBody />
    </div>
  );
}

export default function MobileScrollListDoc() {
  return (
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
            在框内<strong>向下拖拽</strong>模拟刷新（重置为{" "}
            <strong>{FIRST_SCREEN}</strong> 条）；须先在列表内<strong>
              滚动
            </strong>
            ，再<strong>滚到底部</strong>才会加载下一页（每页{" "}
            <strong>{PAGE}</strong> 条）；加载后视口仍停在原
            <code class="text-sm">scrollTop</code>
            ，新行在下方需继续下滑查看；演示累计最多 {MAX}{" "}
            条，模拟真实分页而非首屏一次拉满。
          </Paragraph>
          <ScrollListDocInteractiveDemo />
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
