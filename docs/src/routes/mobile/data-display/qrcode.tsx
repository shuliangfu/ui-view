/**
 * QRCode 文档页。路由: /mobile/data-display/qrcode
 */
import { QRCode, CodeBlock } from "@dreamer/ui-view/mobile/data-display";
import { Paragraph, Title } from "@dreamer/ui-view/mobile/basic";
import { DocsApiTable, type DocsApiTableRow } from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  { name: "value / size / color / bgColor / includeMargin", type: "—", default: "-", description: "与桌面一致" },
];
const importCode = `import { QRCode } from "@dreamer/ui-view/mobile/data-display";
const value = globalThis.location?.href ?? "https://example.com";
<QRCode value={value} size={148} />`;

const exampleUrl = `const value = globalThis.location?.href ?? "https://example.com";

<QRCode value={value} size={148} />`;

const exampleStyle = `<QRCode value="m-96" size={96} />
<QRCode value="m-brand" size={96} color="#1d4ed8" bgColor="#eff6ff" />`;

export default function Page() {
  const value = globalThis.location?.href ?? "https://ui-view.dreamer.local/mobile/data-display/qrcode";
  return (
    <div class="space-y-8">
      <div><Title level={1}>QRCode</Title><Paragraph>value 取当前页 URL；可调尺寸与颜色。</Paragraph></div>
      <section class="space-y-3"><Title level={2}>引入</Title><CodeBlock code={importCode} language="tsx" /></section>
      <section class="space-y-6">
        <Title level={2}>示例</Title>
        <div class="space-y-2">
          <Title level={3}>当前页 URL</Title>
          <MobileDocDemo class="p-4 flex flex-col items-center gap-2">
            <QRCode value={value} size={148} />
            <p class="text-[10px] text-slate-500 break-all">{value}</p>
          </MobileDocDemo>
          <CodeBlock
            title="代码示例"
            code={exampleUrl}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>
        <div class="space-y-2">
          <Title level={3}>尺寸与颜色</Title>
          <MobileDocDemo class="p-4 flex gap-4 items-end justify-center">
            <QRCode value="m-96" size={96} />
            <QRCode value="m-brand" size={96} color="#1d4ed8" bgColor="#eff6ff" />
          </MobileDocDemo>
          <CodeBlock
            title="代码示例"
            code={exampleStyle}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>
      </section>
      <section class="space-y-3"><Title level={2}>API</Title><DocsApiTable rows={API} /></section>
    </div>
  );
}
