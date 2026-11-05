/**
 * Watermark 文档页。路由: /desktop/data-display/watermark
 */

import { Watermark } from "@dreamer/ui-view";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";

const API: DocsApiTableRow[] = [
  { name: "content", type: "string | string[]", default: "Watermark", description: "水印文字" },
  { name: "image", type: "string", default: "-", description: "水印图" },
  { name: "rotate", type: "number", default: "-22", description: "旋转角" },
  { name: "class", type: "string", default: "-", description: "外层 class" }
];

const importCode = `import { Watermark } from "@dreamer/ui-view";\n\n<Watermark content=\"内部资料">…</Watermark>`;

export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Watermark</Title>
        <Paragraph>容器水印：重复文字／图片，内容叠在上层。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
          <Watermark content="内部资料"><div class="h-40 p-4">业务内容区域</div></Watermark>
        </div>
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
