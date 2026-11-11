/**
 * Watermark 文档页。路由: /desktop/data-display/watermark
 */

import { CodeBlock, Watermark } from "@dreamer/ui-view/data-display";
import { Paragraph, Title } from "@dreamer/ui-view/basic";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";

const API: DocsApiTableRow[] = [
  {
    name: "content",
    type: "string | string[]",
    default: "-",
    description: "水印文字（与 image 二选一）",
  },
  { name: "image", type: "string", default: "-", description: "水印图 URL" },
  { name: "fontSize", type: "number", default: "14", description: "字号" },
  { name: "color", type: "string", default: "半透明灰", description: "文字色" },
  { name: "rotate", type: "number", default: "-22", description: "旋转角" },
  { name: "gapX", type: "number", default: "180", description: "水平间距" },
  { name: "gapY", type: "number", default: "140", description: "垂直间距" },
  {
    name: "children",
    type: "unknown",
    default: "-",
    description: "被覆盖内容",
  },
];

const importCode = `import { Watermark } from "@dreamer/ui-view/data-display";

<Watermark content="内部资料">
  <div class="h-40 p-4">业务内容区域</div>
</Watermark>`;

const exampleBasic = `<Watermark content="内部资料">
  <div class="h-40 p-4 bg-white dark:bg-slate-900">业务内容区域</div>
</Watermark>`;

const exampleMulti = `<Watermark content={["Dreamer", "仅供预览"]}>
  <div class="h-40 p-4 bg-white dark:bg-slate-900">多行水印</div>
</Watermark>`;

const exampleStyle = `<Watermark
  content="CONFIDENTIAL"
  fontSize={12}
  color="rgba(37,99,235,0.25)"
  rotate={-30}
  gapX={120}
  gapY={100}
>
  <div class="h-44 p-4 bg-white dark:bg-slate-900">自定义样式</div>
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
        <Paragraph>
          容器水印：重复文字／多行／调间距与旋转；内容叠在上层可点。
        </Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-6">
        <Title level={2}>示例</Title>

        <div class="space-y-2">
          <Title level={3}>基础文字</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <Watermark content="内部资料">
              <div class="h-40 p-4 bg-white dark:bg-slate-900">
                业务内容区域
              </div>
            </Watermark>
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleBasic}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-2">
          <Title level={3}>多行 content[]</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <Watermark content={["Dreamer", "仅供预览"]}>
              <div class="h-40 p-4 bg-white dark:bg-slate-900">多行水印</div>
            </Watermark>
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleMulti}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-2">
          <Title level={3}>间距／旋转／字号色</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <Watermark
              content="CONFIDENTIAL"
              fontSize={12}
              color="rgba(37,99,235,0.25)"
              rotate={-30}
              gapX={120}
              gapY={100}
            >
              <div class="h-44 p-4 bg-white dark:bg-slate-900">自定义样式</div>
            </Watermark>
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleStyle}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
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
