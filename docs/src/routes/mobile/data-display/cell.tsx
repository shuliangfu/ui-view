/**
 * Cell / CellGroup 文档页。路由: /mobile/data-display/cell
 */

import { Cell, CellGroup } from "@dreamer/ui-view/mobile";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  { name: "title", type: "unknown", default: "-", description: "标题" },
  { name: "arrow", type: "boolean", default: "false", description: "箭头" },
  { name: "extra", type: "unknown", default: "-", description: "右侧额外" }
];

const importCode = `import { Cell, CellGroup } from "@dreamer/ui-view/mobile";\n\n<CellGroup><Cell title=\"资料" arrow /></CellGroup>`;

export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Cell / CellGroup</Title>
        <Paragraph>移动列表单元格。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <MobileDocDemo>
          <CellGroup title="账户"><Cell title="资料" arrow /><Cell title="安全" description="密码与设备" arrow /></CellGroup>
        </MobileDocDemo>
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
