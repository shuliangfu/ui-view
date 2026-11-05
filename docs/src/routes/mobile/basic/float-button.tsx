/**
 * FloatButton 文档页。路由: /mobile/basic/float-button
 */

import { FloatButton } from "@dreamer/ui-view/mobile";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  { name: "icon", type: "unknown", default: "+", description: "主按钮内容" },
  { name: "items", type: "FloatButtonItem[]", default: "-", description: "展开子项" },
  { name: "placement", type: "bottom-right | …", default: "bottom-right", description: "角落位置" }
];

const importCode = `import { FloatButton } from "@dreamer/ui-view/mobile";\n\n<FloatButton aria-label=\"新建" />`;

export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>FloatButton</Title>
        <Paragraph>视口角悬浮按钮，可展开子操作（移动端同款）。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <MobileDocDemo>
          <div class="relative h-48"><FloatButton aria-label="新建" /></div>
        </MobileDocDemo>
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
