/**
 * FloatButton 文档页。路由: /desktop/basic/float-button
 */

import { createSignal } from "@dreamer/view";
import { FloatButton, Paragraph, Title } from "@dreamer/ui-view/basic";
import { CodeBlock } from "@dreamer/ui-view/data-display";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MESSAGES_FLOAT_BUTTON } from "../../../data/component-messages-rows.ts";
import { DOCS_DEMO_CODE_MAX_HEIGHT } from "../../../components/DocsDemo.tsx";

const API: DocsApiTableRow[] = [
  { name: "icon", type: "unknown", default: "+", description: "主按钮内容" },
  {
    name: "items",
    type: "FloatButtonItem[]",
    default: "-",
    description: "展开子项",
  },
  {
    name: "shape",
    type: "circle | square",
    default: "circle",
    description: "形状（正圆／正方）",
  },
  {
    name: "placement",
    type: "bottom-right | …",
    default: "bottom-right",
    description: "角落",
  },
  {
    name: "position",
    type: '"fixed" | "absolute"',
    default: "fixed",
    description: "fixed=视口；文档示例用 absolute",
  },
  {
    name: "badge",
    type: "number | boolean",
    default: "-",
    description: "徽标",
  },
  { name: "open", type: "boolean", default: "-", description: "受控展开" },
  {
    name: "onOpenChange",
    type: "(open)=>void",
    default: "-",
    description: "展开变化",
  },
  { name: "offset", type: "number", default: "24", description: "距边 px" },
  {
    name: "messages",
    type: "Partial<FloatButtonMessages>",
    default: "-",
    description: "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
  },
];

const importCode = `import { FloatButton } from "@dreamer/ui-view/basic";

<FloatButton
  aria-label="新建"
  badge={3}
  position="absolute"
  items={[
    { key: "file", icon: "📄", "aria-label": "文件" },
    { key: "img", icon: "🖼️", "aria-label": "图片" },
  ]}
/>`;

function DemoBox(props: { label: string; children?: unknown }) {
  return (
    <div class="relative h-44 overflow-visible rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-dashed border-slate-300 dark:border-slate-600">
      <p class="absolute left-3 top-3 text-xs text-slate-500">{props.label}</p>
      {props.children}
    </div>
  );
}

const exampleCircle = `<FloatButton
  position="absolute"
  shape="circle"
  aria-label="新建"
  badge={3}
  items={[
    { key: "file", icon: "📄", "aria-label": "文件" },
    { key: "img", icon: "🖼️", "aria-label": "图片" },
  ]}
/>`;

const exampleSquare = `<FloatButton
  position="absolute"
  shape="square"
  aria-label="操作"
  icon="＋"
/>`;

const examplePlacement = `<FloatButton
  position="absolute"
  placement="bottom-right"
  offset={12}
  aria-label="bottom-right"
  icon="·"
/>
{/* 同理 placement: bottom-left | top-right | top-left */}`;

const exampleOpen = `const open = createSignal(false);

<FloatButton
  position="absolute"
  aria-label="受控"
  open={open.value}
  onOpenChange={(v) => (open.value = v)}
  items={[
    { key: "a", icon: "A", "aria-label": "A" },
    { key: "b", icon: "B", "aria-label": "B" },
  ]}
/>`;

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
export const metadata = {
  title: "FloatButton · ui-view",
};

export default function Page() {
  const open = createSignal(false);
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>FloatButton</Title>
        <Paragraph>
          角悬浮按钮，可展开子操作。文档示例 position=&quot;absolute&quot;
          落在示意框内；产品默认 fixed 视口。
        </Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock
          code={importCode}
          language="tsx"
          maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
        />
      </section>
      <section class="space-y-6">
        <Title level={2}>示例</Title>

        <div class="space-y-2">
          <Title level={3}>圆形 + 徽标 + 子项</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
            <DemoBox label="circle · badge · items">
              <FloatButton
                position="absolute"
                shape="circle"
                aria-label="新建"
                badge={3}
                items={[
                  { key: "file", icon: "📄", "aria-label": "文件" },
                  { key: "img", icon: "🖼️", "aria-label": "图片" },
                ]}
              />
            </DemoBox>
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleCircle}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>

        <div class="space-y-2">
          <Title level={3}>方形 shape=square</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
            <DemoBox label="square">
              <FloatButton
                position="absolute"
                shape="square"
                aria-label="操作"
                icon="＋"
              />
            </DemoBox>
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleSquare}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>

        <div class="space-y-2">
          <Title level={3}>placement 四角</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 grid sm:grid-cols-2 gap-3">
            {(["bottom-right", "bottom-left", "top-right", "top-left"] as const)
              .map((p) => (
                <DemoBox label={p}>
                  <FloatButton
                    position="absolute"
                    placement={p}
                    offset={12}
                    aria-label={p}
                    icon="·"
                  />
                </DemoBox>
              ))}
          </div>
          <CodeBlock
            title="代码示例"
            code={examplePlacement}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>

        <div class="space-y-2">
          <Title level={3}>受控 open</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 space-y-2">
            {() => (
              <p class="text-xs text-slate-500">展开：{String(open.value)}</p>
            )}
            <DemoBox label="controlled open">
              <FloatButton
                position="absolute"
                aria-label="受控"
                open={open.value}
                onOpenChange={(v) => (open.value = v)}
                items={[
                  { key: "a", icon: "A", "aria-label": "A" },
                  { key: "b", icon: "B", "aria-label": "B" },
                ]}
              />
            </DemoBox>
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleOpen}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>
      </section>
      <DocsMessagesSection
        interfaceName="FloatButtonMessages"
        defaultExportName="defaultFloatButtonMessages"
        rows={MESSAGES_FLOAT_BUTTON}
      />

      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
