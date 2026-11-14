/**
 * Watermark 文档页。路由: /mobile/data-display/watermark
 */
import { CodeBlock, Watermark } from "@dreamer/ui-view/mobile/data-display";
import { Paragraph, Title } from "@dreamer/ui-view/mobile/basic";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";
import { DOCS_DEMO_CODE_MAX_HEIGHT } from "../../../components/DocsDemo.tsx";


const API: DocsApiTableRow[] = [
  {
    name: "content / rotate / gapX / gapY / fontSize / color",
    type: "—",
    default: "-",
    description: "与桌面一致",
  },
];
const importCode =
  `import { Watermark } from "@dreamer/ui-view/mobile/data-display";`;

const exampleBasic = `<Watermark content="内部资料">
  <div class="h-36 p-3 text-sm">业务内容</div>
</Watermark>`;

const exampleMulti = `<Watermark
  content={["Dreamer", "预览"]}
  fontSize={11}
  rotate={-28}
  gapX={100}
  gapY={80}
>
  <div class="h-36 p-3 text-sm">自定义</div>
</Watermark>`;

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
export const metadata = {
  title: "Watermark · ui-view",
};

export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Watermark</Title>
        <Paragraph>文字／多行／自定义间距旋转。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT} />
      </section>
      <section class="space-y-6">
        <Title level={2}>示例</Title>
        <div class="space-y-2">
          <Title level={3}>基础</Title>
          <MobileDocDemo class="p-0 overflow-hidden">
            <Watermark content="内部资料">
              <div class="h-36 p-3 text-sm">业务内容</div>
            </Watermark>
          </MobileDocDemo>
          <CodeBlock
            title="代码示例"
            code={exampleBasic}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>
        <div class="space-y-2">
          <Title level={3}>多行 + 样式</Title>
          <MobileDocDemo class="p-0 overflow-hidden">
            <Watermark
              content={["Dreamer", "预览"]}
              fontSize={11}
              rotate={-28}
              gapX={100}
              gapY={80}
            >
              <div class="h-36 p-3 text-sm">自定义</div>
            </Watermark>
          </MobileDocDemo>
          <CodeBlock
            title="代码示例"
            code={exampleMulti}
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
