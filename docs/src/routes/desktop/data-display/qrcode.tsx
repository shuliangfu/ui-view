/**
 * QRCode 文档页。路由: /desktop/data-display/qrcode
 */

import { QRCode } from "@dreamer/ui-view";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";

const API: DocsApiTableRow[] = [
  { name: "value", type: "MaybeSignal<string>", default: "-", description: "编码内容" },
  { name: "size", type: "number", default: "128", description: "边长" },
  { name: "color", type: "string", default: "#0f172a", description: "前景" },
  { name: "bgColor", type: "string", default: "#fff", description: "背景" }
];

const importCode = `import { QRCode } from "@dreamer/ui-view";\n\n<QRCode value=\"https://example.com" />`;

export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>QRCode</Title>
        <Paragraph>文本编码为 SVG 二维码（无第三方依赖）。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
          <QRCode value="https://dreamer.example" size={148} />
        </div>
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
