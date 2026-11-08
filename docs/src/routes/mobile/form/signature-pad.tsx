/**
 * SignaturePad 文档页。路由: /mobile/form/signature-pad
 */

import { SignaturePad } from "@dreamer/ui-view/mobile/form/signature-pad";
import { Paragraph, Title } from "@dreamer/ui-view/mobile/basic";
import { CodeBlock } from "@dreamer/ui-view/mobile/data-display";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MESSAGES_SIGNATURE_PAD } from "../../../data/component-messages-rows.ts";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  { name: "height", type: "number", default: "180", description: "高度" },
  { name: "penColor", type: "string", default: "#0f172a", description: "笔色" },
  { name: "onChange", type: "(dataUrl|null)=>void", default: "-", description: "变更" },
  {
    name: "messages",
    type: "Partial<SignaturePadMessages>",
    default: "-",
    description: "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
  },

];

const importCode = `import { SignaturePad } from "@dreamer/ui-view/mobile/form/signature-pad";

<SignaturePad
  onChange={(dataUrl) => console.log("stroke", dataUrl?.slice(0, 32))}
/>`;


const exampleDemo = `<SignaturePad height={160} />`;


export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>SignaturePad</Title>
        <Paragraph>Canvas 手写签名，可清空并导出。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <MobileDocDemo>
          <div class="p-3"><SignaturePad height={160} /></div>
        </MobileDocDemo>
        <CodeBlock title="代码示例" code={exampleDemo} language="tsx" showLineNumbers copyable wrapLongLines />
      </section>
      <DocsMessagesSection
        interfaceName="SignaturePadMessages"
        defaultExportName="defaultSignaturePadMessages"
        rows={MESSAGES_SIGNATURE_PAD}
      />

      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
