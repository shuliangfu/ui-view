/**
 * NoticeBar 文档页。路由: /mobile/feedback/notice-bar
 */

import { createSignal } from "@dreamer/view";
import { NoticeBar } from "@dreamer/ui-view/mobile/feedback";
import { Button, Paragraph, Title } from "@dreamer/ui-view/mobile/basic";
import { CodeBlock } from "@dreamer/ui-view/mobile/data-display";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MESSAGES_NOTICE_BAR } from "../../../data/component-messages-rows.ts";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  {
    name: "tone",
    type: "info|success|warning|danger",
    default: "info",
    description: "色调",
  },
  {
    name: "closable",
    type: "boolean",
    default: "false",
    description: "可关闭",
  },
  {
    name: "scrollable",
    type: "boolean",
    default: "false",
    description: "长文滚动",
  },
  { name: "visible", type: "boolean", default: "-", description: "受控可见" },
  {
    name: "messages",
    type: "Partial<NoticeBarMessages>",
    default: "-",
    description: "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
  },
];

const importCode =
  `import { NoticeBar } from "@dreamer/ui-view/mobile/feedback";

<NoticeBar tone="warning" closable content="系统将于今晚维护" />`;

const exampleClosable =
  `<NoticeBar tone="warning" closable content="系统将于今晚维护" />`;

const exampleTone = `<NoticeBar tone="info" content="信息" />
<NoticeBar tone="success" content="成功" />
<NoticeBar tone="danger" content="危险" />`;

const exampleScroll = `const visible = createSignal(true);

<NoticeBar
  tone="info"
  scrollable
  content="欢迎使用移动组件库 —— 长文案可横向滚动展示"
/>
{visible.value ? (
  <NoticeBar
    tone="success"
    closable
    visible={visible.value}
    onClose={() => (visible.value = false)}
    content="受控可见条"
  />
) : (
  <Button type="button" size="sm" onClick={() => (visible.value = true)}>
    重新显示
  </Button>
)}`;

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
export const metadata = {
  title: "NoticeBar · ui-view",
};

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
          <CodeBlock
            title="代码示例"
            code={exampleClosable}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>
        <div class="space-y-2">
          <Title level={3}>色调</Title>
          <MobileDocDemo class="space-y-2 p-4">
            <NoticeBar tone="info" content="信息" />
            <NoticeBar tone="success" content="成功" />
            <NoticeBar tone="danger" content="危险" />
          </MobileDocDemo>
          <CodeBlock
            title="代码示例"
            code={exampleTone}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
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
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => (visible.value = true)}
                  >
                    重新显示
                  </Button>
                )}
          </MobileDocDemo>
          <CodeBlock
            title="代码示例"
            code={exampleScroll}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>
      </section>
      <DocsMessagesSection
        interfaceName="NoticeBarMessages"
        defaultExportName="defaultNoticeBarMessages"
        rows={MESSAGES_NOTICE_BAR}
      />

      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
