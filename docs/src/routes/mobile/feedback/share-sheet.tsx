/**
 * ShareSheet 文档页。路由: /mobile/feedback/share-sheet
 */

import { ShareSheet } from "@dreamer/ui-view/mobile";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  { name: "open", type: "ControlledOpenInput", default: "-", description: "是否打开" },
  { name: "options", type: "ShareSheetOption[]", default: "-", description: "选项" },
  { name: "title", type: "string|null", default: "-", description: "标题" }
];

const importCode = `import { ShareSheet } from "@dreamer/ui-view/mobile";\n\n<ShareSheet open={open} options={[…]} onClose={…} />`;

export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>ShareSheet</Title>
        <Paragraph>底部分享宫格。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <MobileDocDemo>
          <Paragraph class="p-3 text-sm text-slate-500">使用 open=&#123;signal&#125; 打开分享面板。</Paragraph>
        </MobileDocDemo>
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
