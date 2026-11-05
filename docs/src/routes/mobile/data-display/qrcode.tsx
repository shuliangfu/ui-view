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
  { name: "value", type: "MaybeSignal<string>", default: "-", description: "内容" },
  { name: "size", type: "number", default: "128", description: "边长" }
];

const importCode = `import { QRCode } from "@dreamer/ui-view/mobile";

<QRCode value="https://dreamer.example" size={148} />`;

export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>QRCode</Title>
        <Paragraph>移动端二维码展示。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <MobileDocDemo>
          <div class="p-4 flex justify-center"><QRCode value="https://dreamer.example/m" size={160} /></div>
        </MobileDocDemo>
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
