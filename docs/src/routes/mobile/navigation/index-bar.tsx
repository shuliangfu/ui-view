/**
 * IndexBar 文档页。路由: /mobile/navigation/index-bar
 */

import { IndexBar, Cell } from "@dreamer/ui-view/mobile";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  { name: "items", type: "IndexBarItem[]", default: "-", description: "分组" },
  { name: "onSelect", type: "(index)=>void", default: "-", description: "选中索引" }
];

const importCode = `import { IndexBar } from "@dreamer/ui-view/mobile";

<IndexBar
  items={[
    { index: "A", children: <div>Apple</div> },
    { index: "B", children: <div>Banana</div> },
    { index: "C", children: <div>Cherry</div> },
  ]}
  onSelect={(index) => console.log(index)}
/>`;

export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>IndexBar</Title>
        <Paragraph>右侧索引条 + 分组锚点列表。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <MobileDocDemo class="p-0 overflow-hidden">
          <div class="h-80 flex flex-col">
            <IndexBar
              class="h-full"
              items={[
                { index: "A", children: <div><Cell title="Alice" /><Cell title="Amy" /></div> },
                { index: "B", children: <div><Cell title="Bob" /><Cell title="Bella" /></div> },
                { index: "C", children: <Cell title="Carol" /> },
                { index: "D", children: <Cell title="David" /> },
                { index: "Z", children: <Cell title="Zoe" /> },
              ]}
            />
          </div>
        </MobileDocDemo>
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
