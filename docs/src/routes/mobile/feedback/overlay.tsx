/**
 * Overlay 文档页。路由: /mobile/feedback/overlay
 */

import { createSignal } from "@dreamer/view";
import { Button, Paragraph, Title } from "@dreamer/ui-view/mobile/basic";
import { CodeBlock } from "@dreamer/ui-view/mobile/data-display";
import { Overlay } from "@dreamer/ui-view/mobile/feedback";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MESSAGES_OVERLAY } from "../../../data/component-messages-rows.ts";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";
import { DOCS_DEMO_CODE_MAX_HEIGHT } from "../../../components/DocsDemo.tsx";


const API: DocsApiTableRow[] = [
  {
    name: "open",
    type: "ControlledOpenInput",
    default: "-",
    description: "是否显示",
  },
  {
    name: "onClick",
    type: "() => void",
    default: "-",
    description: "点击遮罩",
  },
  {
    name: "clickable",
    type: "boolean",
    default: "true",
    description: "点击是否触发 onClick",
  },
  {
    name: "portal",
    type: "boolean",
    default: "true",
    description: "挂 body；框内示例用 false",
  },
  { name: "zIndex", type: "number", default: "-", description: "层级" },
  {
    name: "messages",
    type: "Partial<OverlayMessages>",
    default: "-",
    description: "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
  },
];

const importCode = `import { createSignal } from "@dreamer/view";

const open = createSignal(false);
<Overlay open={open} onClick={() => (open.value = false)} zIndex={400} />`;

const examplePortal = `const open = createSignal(false);

<Button type="button" onClick={() => (open.value = true)}>打开遮罩</Button>
<Overlay open={open} onClick={() => (open.value = false)} zIndex={400} />`;

const exampleLocal = `const openLocal = createSignal(false);

<Button type="button" size="sm" onClick={() => (openLocal.value = true)}>框内遮罩</Button>
<div class="relative h-32 rounded-lg border border-dashed overflow-hidden">
  <Overlay
    open={openLocal}
    portal={false}
    position="absolute"
    zIndex={10}
    class="bg-slate-900/40"
    onClick={() => (openLocal.value = false)}
  />
</div>`;

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
export const metadata = {
  title: "Overlay · ui-view",
};

export default function Page() {
  const open = createSignal(false);
  const openLocal = createSignal(false);
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Overlay</Title>
        <Paragraph>
          半透明遮罩；默认可 Portal；示意框内用 portal=false。
        </Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT} />
      </section>
      <section class="space-y-6">
        <Title level={2}>示例</Title>
        <div class="space-y-2">
          <Title level={3}>默认 Portal</Title>
          <MobileDocDemo>
            <div class="space-y-3 p-2">
              <Button type="button" onClick={() => (open.value = true)}>
                打开遮罩
              </Button>
              <Overlay
                open={open}
                onClick={() => (open.value = false)}
                zIndex={400}
              />
            </div>
          </MobileDocDemo>
          <CodeBlock
            title="代码示例"
            code={examplePortal}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>
        <div class="space-y-2">
          <Title level={3}>局部 portal=false</Title>
          <MobileDocDemo class="p-3 space-y-2">
            <Button
              type="button"
              size="sm"
              onClick={() => (openLocal.value = true)}
            >
              框内遮罩
            </Button>
            <div class="relative h-32 rounded-lg border border-dashed overflow-hidden">
              <p class="p-2 text-xs text-slate-500">容器</p>
              <Overlay
                open={openLocal}
                portal={false}
                position="absolute"
                zIndex={10}
                class="bg-slate-900/40"
                onClick={() => (openLocal.value = false)}
              />
            </div>
          </MobileDocDemo>
          <CodeBlock
            title="代码示例"
            code={exampleLocal}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>
      </section>
      <DocsMessagesSection
        interfaceName="OverlayMessages"
        defaultExportName="defaultOverlayMessages"
        rows={MESSAGES_OVERLAY}
      />

      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
