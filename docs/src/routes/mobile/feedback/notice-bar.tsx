/**
 * NoticeBar 文档页。路由: /mobile/feedback/notice-bar
 */

import { NoticeBar } from "@dreamer/ui-view/mobile";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  { name: "tone", type: "NoticeBarTone", default: "info", description: "色调" },
  { name: "closable", type: "boolean", default: "false", description: "可关闭" },
  { name: "visible", type: "boolean", default: "-", description: "受控可见；不传则点 × 内部隐藏" },
];

const importCode = `import { NoticeBar } from "@dreamer/ui-view/mobile";

<NoticeBar tone="warning" closable content="系统将于今晚 23:00 维护，请提前保存" />`;

export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>NoticeBar</Title>
        <Paragraph>通知栏；可关闭、可滚动。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <MobileDocDemo class="space-y-3 p-4">
          <NoticeBar
            tone="warning"
            closable
            content="系统将于今晚维护"
          />
          <NoticeBar
            tone="info"
            scrollable
            content="欢迎使用移动组件库 —— 长文案可横向滚动展示"
          />
        </MobileDocDemo>
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
