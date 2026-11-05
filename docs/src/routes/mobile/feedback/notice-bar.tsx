/**
 * NoticeBar 文档页。路由: /mobile/feedback/notice-bar
 */

import { createSignal } from "@dreamer/view";
import { NoticeBar } from "@dreamer/ui-view/mobile";
import { Button, CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  { name: "tone", type: "info|success|warning|danger", default: "info", description: "色调" },
  { name: "closable", type: "boolean", default: "false", description: "可关闭" },
  { name: "scrollable", type: "boolean", default: "false", description: "长文滚动" },
  { name: "visible", type: "boolean", default: "-", description: "受控可见" },
];

const importCode = `import { NoticeBar } from "@dreamer/ui-view/mobile";

<NoticeBar tone="warning" closable content="系统将于今晚维护" />`;

export default function Page() {
  const visible = createSignal(true);
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>NoticeBar</Title>
        <Paragraph>通知栏：色调、可关闭、滚动、受控可见。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-6">
        <Title level={2}>示例</Title>
        <div class="space-y-2">
          <Title level={3}>可关闭</Title>
          <MobileDocDemo class="space-y-3 p-4">
            <NoticeBar tone="warning" closable content="系统将于今晚维护" />
          </MobileDocDemo>
        </div>
        <div class="space-y-2">
          <Title level={3}>色调</Title>
          <MobileDocDemo class="space-y-2 p-4">
            <NoticeBar tone="info" content="信息" />
            <NoticeBar tone="success" content="成功" />
            <NoticeBar tone="danger" content="危险" />
          </MobileDocDemo>
        </div>
        <div class="space-y-2">
          <Title level={3}>滚动 + 受控</Title>
          <MobileDocDemo class="space-y-3 p-4">
            <NoticeBar
              tone="info"
              scrollable
              content="欢迎使用移动组件库 —— 长文案可横向滚动展示"
            />
            {() =>
              visible.value
                ? (
                  <NoticeBar
                    tone="success"
                    closable
                    visible={visible.value}
                    onClose={() => (visible.value = false)}
                    content="受控可见条"
                  />
                )
                : (
                  <Button type="button" size="sm" onClick={() => (visible.value = true)}>
                    重新显示
                  </Button>
                )}
          </MobileDocDemo>
        </div>
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
