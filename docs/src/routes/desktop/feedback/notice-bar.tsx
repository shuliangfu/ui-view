/**
 * NoticeBar 文档页。路由: /desktop/feedback/notice-bar
 */

import { NoticeBar } from "@dreamer/ui-view";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";

const API: DocsApiTableRow[] = [
  { name: "content", type: "unknown", default: "-", description: "文案" },
  { name: "tone", type: "info|success|warning|danger", default: "info", description: "色调" },
  { name: "closable", type: "boolean", default: "false", description: "可关闭" },
  { name: "scrollable", type: "boolean", default: "false", description: "横向滚动" },
  { name: "visible", type: "boolean", default: "-", description: "受控可见；不传则点 × 内部隐藏" }
];

const importCode = `import { NoticeBar } from "@dreamer/ui-view";

<NoticeBar tone="warning" closable content="系统将于今晚 23:00 维护，请提前保存" />`;

export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>NoticeBar</Title>
        <Paragraph>块级通知条：色调、可关闭、长文滚动。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
          <NoticeBar tone="warning" closable content="系统将于今晚维护" />
        </div>
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
