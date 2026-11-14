/**
 * FloatButton 文档页。路由: /mobile/basic/float-button
 */
import { createSignal } from "@dreamer/view";
import { FloatButton, Paragraph, Title } from "@dreamer/ui-view/mobile/basic";
import { CodeBlock } from "@dreamer/ui-view/mobile/data-display";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";
import { DOCS_DEMO_CODE_MAX_HEIGHT } from "../../../components/DocsDemo.tsx";


const API: DocsApiTableRow[] = [
  {
    name: "shape / badge / items / placement / position / open",
    type: "—",
    default: "-",
    description: "与桌面一致；文档用 absolute",
  },
];
const importCode =
  `import { FloatButton } from "@dreamer/ui-view/mobile/basic";`;

const exampleCircle = `<FloatButton
  position="absolute"
  aria-label="新建"
  badge={3}
  items={[
    { key: "a", icon: "📄", "aria-label": "文件" },
    { key: "b", icon: "🖼️", "aria-label": "图片" },
  ]}
/>`;

const exampleSquare = `<FloatButton
  position="absolute"
  shape="square"
  aria-label="方"
  icon="＋"
/>`;

const exampleOpen = `const open = createSignal(false);

<FloatButton
  position="absolute"
  aria-label="受控"
  open={open.value}
  onOpenChange={(v) => (open.value = v)}
  items={[{ key: "x", icon: "X", "aria-label": "X" }]}
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
        <Paragraph>圆形／方形、徽标、子项、受控展开。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT} />
      </section>
      <section class="space-y-6">
        <Title level={2}>示例</Title>
        <div class="space-y-2">
          <Title level={3}>圆形 + 徽标 + 子项</Title>
          <MobileDocDemo class="p-0">
            <div class="relative h-40">
              <FloatButton
                position="absolute"
                aria-label="新建"
                badge={3}
                items={[{ key: "a", icon: "📄", "aria-label": "文件" }, {
                  key: "b",
                  icon: "🖼️",
                  "aria-label": "图片",
                }]}
              />
            </div>
          </MobileDocDemo>
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
          <Title level={3}>方形</Title>
          <MobileDocDemo class="p-0">
            <div class="relative h-32">
              <FloatButton
                position="absolute"
                shape="square"
                aria-label="方"
                icon="＋"
              />
            </div>
          </MobileDocDemo>
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
          <Title level={3}>受控 open</Title>
          <MobileDocDemo class="p-0">
            <div class="relative h-32">
              {() => (
                <FloatButton
                  position="absolute"
                  aria-label="受控"
                  open={open.value}
                  onOpenChange={(v) => (open.value = v)}
                  items={[{ key: "x", icon: "X", "aria-label": "X" }]}
                />
              )}
            </div>
          </MobileDocDemo>
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
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
