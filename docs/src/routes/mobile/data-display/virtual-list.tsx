/**
 * VirtualList 文档页。路由: /mobile/data-display/virtual-list
 */

import { VirtualList } from "@dreamer/ui-view/mobile";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  { name: "data", type: "T[]", default: "-", description: "数据" },
  { name: "itemHeight", type: "number", default: "-", description: "定高 px；与 getItemHeight 二选一" },
  { name: "getItemHeight", type: "(item, index) => number", default: "-", description: "动态行高" },
  { name: "height", type: "number", default: "320", description: "容器高" },
  { name: "renderItem", type: "(item,i)=>unknown", default: "-", description: "行渲染" }
];

const importCode = `import { VirtualList } from "@dreamer/ui-view/mobile";\n\n<VirtualList data={rows} itemHeight={36} renderItem={…} />`;

export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>VirtualList</Title>
        <Paragraph>定高／动态行高虚拟列表，仅渲染可视区附近行。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <MobileDocDemo>
          <VirtualList height={240} itemHeight={36} data={Array.from({length:200},(_,i)=>i)} renderItem={(n)=> <div class="px-3 leading-9 text-sm">Item {n}</div>} />
        </MobileDocDemo>
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
