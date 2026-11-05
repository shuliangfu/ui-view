/**
 * QRCode 文档页。路由: /mobile/data-display/qrcode
 */

import { QRCode } from "@dreamer/ui-view/mobile";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  { name: "value", type: "string", default: "-", description: "二维码内容（示例用当前页 URL）" },
  { name: "size", type: "number", default: "128", description: "边长 px" },
];

const importCode = `import { QRCode } from "@dreamer/ui-view/mobile";

const value =
  globalThis.location?.href ?? "https://ui-view.dreamer.local/mobile/data-display/qrcode";

<QRCode value={value} size={160} />`;

export default function Page() {
  const value =
    globalThis.location?.href ??
    "https://ui-view.dreamer.local/mobile/data-display/qrcode";
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
        <MobileDocDemo>
          <div class="p-4 flex flex-col items-center gap-2">
            <QRCode value={value} size={160} />
            <p class="text-xs text-slate-500 break-all max-w-full px-2">{value}</p>
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
