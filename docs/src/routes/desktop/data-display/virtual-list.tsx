/**
 * VirtualList 文档页。路由: /desktop/data-display/virtual-list
 */

import { VirtualList } from "@dreamer/ui-view";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";

const API: DocsApiTableRow[] = [
  { name: "data", type: "T[]", default: "-", description: "数据" },
  { name: "itemHeight", type: "number", default: "-", description: "定高 px；与 getItemHeight 二选一" },
  { name: "getItemHeight", type: "(item, index) => number", default: "-", description: "动态行高" },
  { name: "height", type: "number", default: "320", description: "容器高" },
  { name: "renderItem", type: "(item,i)=>unknown", default: "-", description: "行渲染" },
];

const TOTAL = 2000;

const importCode = `import { VirtualList } from "@dreamer/ui-view";

const rows = Array.from({ length: ${TOTAL} }, (_, i) => i + 1);

<VirtualList
  height={320}
  itemHeight={36}
  data={rows}
  renderItem={(n) => <div class="px-3 leading-9">Item {n}</div>}
/>`;

export default function Page() {
  const rows = Array.from({ length: TOTAL }, (_, i) => i + 1);
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>VirtualList</Title>
        <Paragraph>
          定高虚拟列表，仅渲染可视区附近行。示例共 {TOTAL}{" "}
          条（Item 1…{TOTAL}），滚动高度与条数一致。
        </Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
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
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
