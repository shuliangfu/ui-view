/**
 * QRCode 文档页。路由: /desktop/data-display/qrcode
 */

import { Paragraph, Title } from "@dreamer/ui-view/basic";

import { QRCode, CodeBlock } from "@dreamer/ui-view/data-display";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MESSAGES_QR_CODE } from "../../../data/component-messages-rows.ts";

const API: DocsApiTableRow[] = [
  { name: "value", type: "MaybeSignal<string>", default: "-", description: "编码内容（示例用当前页 URL）" },
  { name: "size", type: "number", default: "128", description: "边长 px" },
  { name: "color", type: "string", default: "#0f172a", description: "前景色" },
  { name: "bgColor", type: "string", default: "#ffffff", description: "背景色" },
  { name: "includeMargin", type: "boolean", default: "true", description: "静默区白边" },
  { name: "aria-label", type: "string", default: "二维码", description: "无障碍" },  {
    name: "messages",
    type: "Partial<QRCodeMessages>",
    default: "-",
    description: "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
  },

];

const importCode = `import { QRCode } from "@dreamer/ui-view/data-display";

const value = globalThis.location?.href ?? "https://example.com";
<QRCode value={value} size={148} />`;

const exampleUrl = `const value = globalThis.location?.href ?? "https://example.com";

<QRCode value={value} size={148} />`;

const exampleSize = `<QRCode value="size-96" size={96} aria-label="96px" />
<QRCode value="size-128" size={128} aria-label="128px" />
<QRCode value="size-160" size={160} aria-label="160px" />`;

const exampleColor = `<QRCode value="brand" size={120} color="#1d4ed8" bgColor="#eff6ff" />
<QRCode value="tight" size={120} includeMargin={false} />`;

export default function Page() {
  const value =
    globalThis.location?.href ??
    "https://ui-view.dreamer.local/desktop/data-display/qrcode";
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>QRCode</Title>
        <Paragraph>二维码；示例 value 取运行时 location.href。可改尺寸／色／白边。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-6">
        <Title level={2}>示例</Title>

        <div class="space-y-2">
          <Title level={3}>当前页 URL</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-6 bg-white dark:bg-slate-900 inline-flex flex-col items-center gap-2">
            <QRCode value={value} size={148} />
            <p class="text-xs text-slate-500 break-all max-w-sm">{value}</p>
          </div>
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
          <Title level={3}>尺寸 size</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 flex flex-wrap gap-6 items-end">
            <QRCode value="size-96" size={96} aria-label="96px" />
            <QRCode value="size-128" size={128} aria-label="128px" />
            <QRCode value="size-160" size={160} aria-label="160px" />
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleSize}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-2">
          <Title level={3}>颜色 / 无白边</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 flex flex-wrap gap-6">
            <QRCode value="brand" size={120} color="#1d4ed8" bgColor="#eff6ff" />
            <QRCode value="tight" size={120} includeMargin={false} />
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleColor}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>
      </section>
      <DocsMessagesSection
        interfaceName="QRCodeMessages"
        defaultExportName="defaultQRCodeMessages"
        rows={MESSAGES_QR_CODE}
      />

      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
