/**
 * ContextMenu 文档页。路由: /desktop/feedback/context-menu
 */

import { ContextMenu } from "@dreamer/ui-view";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";

const API: DocsApiTableRow[] = [
  { name: "items", type: "ContextMenuItem[]", default: "-", description: "菜单项" },
  { name: "children", type: "unknown", default: "-", description: "触发区" }
];

const importCode = `import { ContextMenu } from "@dreamer/ui-view";\n\n<ContextMenu items={[…]}>…</ContextMenu>`;

export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level=1>ContextMenu</Title>
        <Paragraph>右键菜单；在触发区打开 Portal 菜单。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level=2>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level=2>示例</Title>
        <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
          <ContextMenu items={[{ key: "c", label: "复制", onClick: () => {} }, { key: "d", label: "删除", danger: true }]}><div class="p-8 border border-dashed rounded-lg text-sm text-slate-500">在此区域右键</div></ContextMenu>
        </div>
      </section>
      <section class="space-y-3">
        <Title level=2>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
