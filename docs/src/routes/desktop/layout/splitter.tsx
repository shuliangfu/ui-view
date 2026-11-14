/**
 * Splitter 文档页。路由: /desktop/layout/splitter
 */

import { Splitter } from "@dreamer/ui-view/layout";
import { Paragraph, Title } from "@dreamer/ui-view/basic";
import { CodeBlock } from "@dreamer/ui-view/data-display";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { DOCS_DEMO_CODE_MAX_HEIGHT } from "../../../components/DocsDemo.tsx";


const API: DocsApiTableRow[] = [
  {
    name: "orientation",
    type: "horizontal|vertical",
    default: "horizontal",
    description: "方向",
  },
  {
    name: "sizes",
    type: "MaybeSignal<number[]>",
    default: "均分",
    description: "百分比",
  },
  { name: "minSize", type: "number", default: "10", description: "最小百分比" },
];

const importCode = `import { Splitter } from "@dreamer/ui-view/layout";

<Splitter>
  <div class="p-3">左侧面板</div>
  <div class="p-3">右侧面板</div>
</Splitter>`;

const exampleDemo = `<Splitter>
  <div class="p-3 bg-slate-50">左</div>
  <div class="p-3">右</div>
</Splitter>`;

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
export const metadata = {
  title: "Splitter · ui-view",
};

export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Splitter</Title>
        <Paragraph>可拖拽左右／上下分割面板。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT} />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
          <div class="h-48 border rounded-lg overflow-hidden">
            <Splitter>
              <div class="p-3 bg-slate-50 dark:bg-slate-800">左</div>
              <div class="p-3">右</div>
            </Splitter>
          </div>
        </div>
        <CodeBlock
          title="代码示例"
          code={exampleDemo}
          language="tsx"
          showLineNumbers
          copyable
          wrapLongLines
          maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
        />
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
