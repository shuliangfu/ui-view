/**
 * SignaturePad 文档页。路由: /mobile/form/signature-pad
 */

import { SignaturePad } from "@dreamer/ui-view/mobile";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  { name: "height", type: "number", default: "180", description: "高度" },
  { name: "penColor", type: "string", default: "#0f172a", description: "笔色" },
  { name: "onChange", type: "(dataUrl|null)=>void", default: "-", description: "变更" }
];

const importCode = `import { SignaturePad } from "@dreamer/ui-view/mobile";\n\n<SignaturePad onChange={…} />`;

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
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
