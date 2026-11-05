/**
 * QRCode 文档页。路由: /desktop/data-display/qrcode
 */

import { QRCode, CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";

const API: DocsApiTableRow[] = [
  { name: "value", type: "string", default: "-", description: "二维码内容（示例用当前页 URL）" },
  { name: "size", type: "number", default: "128", description: "边长 px" },
];

const importCode = `import { QRCode } from "@dreamer/ui-view";

const value =
  globalThis.location?.href ?? "https://ui-view.dreamer.local/desktop/data-display/qrcode";

<QRCode value={value} size={148} />`;

export default function Page() {
  const value =
    globalThis.location?.href ??
    "https://ui-view.dreamer.local/desktop/data-display/qrcode";
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>QRCode</Title>
        <Paragraph>二维码；示例 value 取当前页 URL（运行时 location.href）。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-6 bg-white dark:bg-slate-900 inline-flex flex-col items-center gap-2">
          <QRCode value={value} size={148} />
          <p class="text-xs text-slate-500 break-all max-w-sm">{value}</p>
        </div>
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
