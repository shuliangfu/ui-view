/**
 * Cell / CellGroup 文档页。路由: /desktop/data-display/cell
 */

import { Cell, CellGroup } from "@dreamer/ui-view";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";

const API: DocsApiTableRow[] = [
  { name: "title", type: "unknown", default: "-", description: "主标题" },
  { name: "description", type: "unknown", default: "-", description: "描述" },
  { name: "arrow", type: "boolean", default: "false", description: "右箭头" },
  { name: "onClick", type: "() => void", default: "-", description: "点击" }
];

const importCode = `import { Cell, CellGroup } from "@dreamer/ui-view";\n\n<CellGroup><Cell title="账号" arrow /></CellGroup>`;

export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Cell / CellGroup</Title>
        <Paragraph>列表单元格与分组（移动风格，桌面亦可用）。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
          <CellGroup title="设置"><Cell title="账号" arrow extra="详情" /><Cell title="通知" description="推送开关" /></CellGroup>
        </div>
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
