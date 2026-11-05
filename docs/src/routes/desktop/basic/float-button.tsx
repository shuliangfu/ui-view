/**
 * FloatButton 文档页。路由: /desktop/basic/float-button
 */

import { FloatButton } from "@dreamer/ui-view";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";

const API: DocsApiTableRow[] = [
  { name: "icon", type: "unknown", default: "+", description: "主按钮内容" },
  { name: "items", type: "FloatButtonItem[]", default: "-", description: "展开子项" },
  { name: "placement", type: "bottom-right | …", default: "bottom-right", description: "角落位置" }
];

const importCode = `import { FloatButton } from "@dreamer/ui-view";\n\n<FloatButton aria-label=\"新建\" />`;

export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level=1>FloatButton</Title>
        <Paragraph>视口角悬浮按钮，可展开子操作。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level=2>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level=2>示例</Title>
        <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
          <div class="relative h-48"><FloatButton aria-label="新建" /></div>
        </div>
      </section>
      <section class="space-y-3">
        <Title level=2>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
