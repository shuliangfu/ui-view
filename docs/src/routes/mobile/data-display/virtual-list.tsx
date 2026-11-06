/**
 * VirtualList 文档页。路由: /mobile/data-display/virtual-list
 */
import { VirtualList, CodeBlock } from "@dreamer/ui-view/mobile/data-display";
import { Paragraph, Title } from "@dreamer/ui-view/mobile/basic";
import { DocsApiTable, type DocsApiTableRow } from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const TOTAL = 2000;
const API: DocsApiTableRow[] = [
  { name: "itemHeight / getItemHeight / empty / overscan", type: "—", default: "-", description: "与桌面一致" },
];
const importCode = `import { VirtualList } from "@dreamer/ui-view/mobile/data-display";`;


const exampleFixed = `const rows = Array.from({ length: 2000 }, (_, i) => i + 1);

<VirtualList
  height={280}
  itemHeight={36}
  data={rows}
  renderItem={(n) => <div class="px-3 leading-9 text-sm">Item {n}</div>}
/>`;

const exampleDynamic = `const dyn = [/* { id, h, t }… */];

<VirtualList
  height={200}
  data={dyn}
  rowKey={(r) => r.id}
  getItemHeight={(r) => r.h}
  renderItem={(r) => <div class="px-3 py-2 text-sm">{r.t}</div>}
/>`;

const exampleEmpty = `<VirtualList
  height={100}
  itemHeight={36}
  data={[]}
  empty={<p class="text-xs text-slate-500 p-3">暂无数据</p>}
  renderItem={() => null}
/>`;


export default function Page() {
  const rows = Array.from({ length: TOTAL }, (_, i) => i + 1);
  const dyn = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    h: i % 4 === 0 ? 52 : 36,
    t: i % 4 === 0 ? `高行 ${i}` : `行 ${i}`,
  }));
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>VirtualList</Title>
        <Paragraph>定高 {TOTAL} 条 + 动态行高 + 空态。</Paragraph>
      </div>
      <section class="space-y-3"><Title level={2}>引入</Title><CodeBlock code={importCode} language="tsx" /></section>
      <section class="space-y-6">
        <Title level={2}>示例</Title>
        <div class="space-y-2">
          <Title level={3}>定高 · {TOTAL} 条</Title>
          <MobileDocDemo class="p-2">
            <VirtualList height={280} itemHeight={36} data={rows}
              renderItem={(n) => <div class="px-3 leading-9 text-sm border-b border-slate-100 dark:border-slate-800">Item {n}</div>} />
          </MobileDocDemo>
          <CodeBlock title="代码示例" code={exampleFixed} language="tsx" showLineNumbers copyable wrapLongLines />

        </div>
        <div class="space-y-2">
          <Title level={3}>动态行高</Title>
          <MobileDocDemo class="p-2">
            <VirtualList height={200} data={dyn} rowKey={(r) => r.id} getItemHeight={(r) => r.h}
              renderItem={(r) => <div class="px-3 py-2 text-sm border-b border-slate-100 dark:border-slate-800">{r.t}</div>} />
          </MobileDocDemo>
          <CodeBlock title="代码示例" code={exampleDynamic} language="tsx" showLineNumbers copyable wrapLongLines />

        </div>
        <div class="space-y-2">
          <Title level={3}>空态</Title>
          <MobileDocDemo class="p-2">
            <VirtualList height={100} itemHeight={36} data={[]} empty={<p class="text-xs text-slate-500 p-3">暂无数据</p>} renderItem={() => null} />
          </MobileDocDemo>
          <CodeBlock title="代码示例" code={exampleEmpty} language="tsx" showLineNumbers copyable wrapLongLines />

        </div>
      </section>
      <section class="space-y-3"><Title level={2}>API</Title><DocsApiTable rows={API} /></section>
    </div>
  );
}
