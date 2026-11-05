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

const importCode = `import { IndexBar } from "@dreamer/ui-view/mobile";\n\n<IndexBar items={[…]} />`;

export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level=1>IndexBar</Title>
        <Paragraph>右侧索引条 + 分组锚点列表。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level=2>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level=2>示例</Title>
        <MobileDocDemo>
          <div class="h-80"><IndexBar items={[{ index: "A", children: <Cell title="Alice" /> }, { index: "B", children: <Cell title="Bob" /> }]} /></div>
        </MobileDocDemo>
      </section>
      <section class="space-y-3">
        <Title level=2>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
