/**
 * Overlay 文档页。路由: /desktop/feedback/overlay
 */

import { createSignal } from "@dreamer/view";
import { Button, Paragraph, Title } from "@dreamer/ui-view/basic";
import { CodeBlock } from "@dreamer/ui-view/data-display";
import { Overlay } from "@dreamer/ui-view/feedback";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MESSAGES_OVERLAY } from "../../../data/component-messages-rows.ts";

const API: DocsApiTableRow[] = [
  {
    name: "open",
    type: "ControlledOpenInput",
    default: "-",
    description: "是否显示（传 Signal）",
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
    description: "是否挂 body；嵌套浮层内须 false",
  },
  {
    name: "destroyOnClose",
    type: "boolean",
    default: "false",
    description: "关闭后销毁节点",
  },
  {
    name: "lockScroll",
    type: "boolean",
    default: "视 portal",
    description: "锁定 body 滚动",
  },
  { name: "zIndex", type: "number", default: "-", description: "层级" },
  {
    name: "position",
    type: "fixed | absolute",
    default: "fixed",
    description: "定位",
  },
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

<Button type="button" size="sm" onClick={() => (openLocal.value = true)}>
  框内遮罩
</Button>
<div class="relative h-40 rounded-lg border border-dashed overflow-hidden">
  <p class="p-3 text-sm text-slate-500">相对定位容器</p>
  <Overlay
    open={openLocal}
    portal={false}
    position="absolute"
    zIndex={10}
    onClick={() => (openLocal.value = false)}
    class="bg-slate-900/40"
  />
</div>`;

const exampleNoClick = `const openNoClick = createSignal(false);

<Button type="button" size="sm" onClick={() => (openNoClick.value = true)}>
  打开（点遮罩不关）
</Button>
<Button type="button" size="sm" variant="ghost" onClick={() => (openNoClick.value = false)}>
  强制关闭
</Button>
<Overlay open={openNoClick} clickable={false} zIndex={400} aria-label="不可点遮罩" />`;

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
export const metadata = {
  title: "Overlay · ui-view",
};

export default function Page() {
  const open = createSignal(false);
  const openLocal = createSignal(false);
  const openNoClick = createSignal(false);
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Overlay</Title>
        <Paragraph>
          半透明遮罩。默认 Portal 到 body；嵌在 Drawer／Modal 内须
          portal=false。
        </Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-6">
        <Title level={2}>示例</Title>

        <div class="space-y-2">
          <Title level={3}>默认 Portal</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 space-y-3">
            <Button type="button" onClick={() => (open.value = true)}>
              打开遮罩
            </Button>
            <Overlay
              open={open}
              onClick={() => (open.value = false)}
              zIndex={400}
            />
          </div>
          <CodeBlock
            title="代码示例"
            code={examplePortal}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-2">
          <Title level={3}>局部 portal=false</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 space-y-3">
            <Button
              type="button"
              size="sm"
              onClick={() => (openLocal.value = true)}
            >
              框内遮罩
            </Button>
            <div class="relative h-40 rounded-lg border border-dashed overflow-hidden">
              <p class="p-3 text-sm text-slate-500">相对定位容器</p>
              <Overlay
                open={openLocal}
                portal={false}
                position="absolute"
                zIndex={10}
                onClick={() => (openLocal.value = false)}
                class="bg-slate-900/40"
              />
            </div>
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleLocal}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-2">
          <Title level={3}>clickable=false</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 space-y-3">
            <div class="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => (openNoClick.value = true)}
              >
                打开（点遮罩不关）
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => (openNoClick.value = false)}
              >
                强制关闭
              </Button>
            </div>
            <Overlay
              open={openNoClick}
              clickable={false}
              zIndex={400}
              aria-label="不可点遮罩"
            />
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleNoClick}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
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
