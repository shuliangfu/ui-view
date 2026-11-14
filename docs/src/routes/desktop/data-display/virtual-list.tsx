/**
 * VirtualList 文档页。路由: /desktop/data-display/virtual-list
 */

import { CodeBlock, VirtualList } from "@dreamer/ui-view/data-display";
import { Paragraph, Title } from "@dreamer/ui-view/basic";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { DOCS_DEMO_CODE_MAX_HEIGHT } from "../../../components/DocsDemo.tsx";

const API: DocsApiTableRow[] = [
  { name: "data", type: "T[]", default: "-", description: "数据" },
  {
    name: "itemHeight",
    type: "number",
    default: "-",
    description: "定高 px；与 getItemHeight 二选一",
  },
  {
    name: "getItemHeight",
    type: "(item, index) => number",
    default: "-",
    description: "动态行高",
  },
  { name: "height", type: "number", default: "320", description: "容器高" },
  { name: "overscan", type: "number", default: "4", description: "上下缓冲行" },
  {
    name: "rowKey",
    type: "(item,i)=>string|number",
    default: "index",
    description: "行 key",
  },
  { name: "empty", type: "unknown", default: "-", description: "空态" },
  {
    name: "renderItem",
    type: "(item,i)=>unknown",
    default: "-",
    description: "行渲染",
  },
];

const TOTAL = 2000;
const importCode = `import { VirtualList } from "@dreamer/ui-view/data-display";

const rows = Array.from({ length: ${TOTAL} }, (_, i) => i + 1);

<VirtualList
  height={320}
  itemHeight={36}
  data={rows}
  renderItem={(n) => <div class="px-3 leading-9">Item {n}</div>}
/>`;

const exampleFixed =
  `const rows = Array.from({ length: 2000 }, (_, i) => i + 1);

<VirtualList
  height={320}
  itemHeight={36}
  data={rows}
  renderItem={(n) => (
    <div class="px-3 leading-9 border-b border-slate-100">Item {n}</div>
  )}
/>`;

const exampleDynamic = `const dynamic = [/* { id, text }… */];

<VirtualList
  height={240}
  overscan={6}
  data={dynamic}
  rowKey={(r) => r.id}
  getItemHeight={(r) => (r.text.includes("\\n") ? 56 : 36)}
  renderItem={(r) => (
    <div class="px-3 py-2 text-sm whitespace-pre-line">{r.text}</div>
  )}
/>`;

const exampleEmpty = `<VirtualList
  height={120}
  itemHeight={36}
  data={[]}
  empty={<p class="text-sm text-slate-500 p-4">暂无数据</p>}
  renderItem={() => null}
/>`;

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
export const metadata = {
  title: "VirtualList · ui-view",
};

export default function Page() {
  const rows = Array.from({ length: TOTAL }, (_, i) => i + 1);
  const dynamic = Array.from({ length: 200 }, (_, i) => ({
    id: i + 1,
    text: i % 3 === 0 ? `多行文案 #${i + 1}\n第二行说明` : `短行 #${i + 1}`,
  }));
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>VirtualList</Title>
        <Paragraph>
          虚拟列表仅渲染可视区。定高示例共 {TOTAL} 条；另有动态行高与空态。
        </Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock
          code={importCode}
          language="tsx"
          maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
        />
      </section>
      <section class="space-y-6">
        <Title level={2}>示例</Title>

        <div class="space-y-2">
          <Title level={3}>定高 · {TOTAL} 条</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
            <VirtualList
              height={320}
              itemHeight={36}
              data={rows}
              renderItem={(n) => (
                <div class="px-3 leading-9 border-b border-slate-100 dark:border-slate-800">
                  Item {n}
                </div>
              )}
            />
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleFixed}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>

        <div class="space-y-2">
          <Title level={3}>动态行高 getItemHeight</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
            <VirtualList
              height={240}
              overscan={6}
              data={dynamic}
              rowKey={(r) => r.id}
              getItemHeight={(r) => (r.text.includes("\n") ? 56 : 36)}
              renderItem={(r) => (
                <div class="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-sm whitespace-pre-line">
                  {r.text}
                </div>
              )}
            />
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleDynamic}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>

        <div class="space-y-2">
          <Title level={3}>空态 empty</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
            <VirtualList
              height={120}
              itemHeight={36}
              data={[]}
              empty={<p class="text-sm text-slate-500 p-4">暂无数据</p>}
              renderItem={() => null}
            />
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleEmpty}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
