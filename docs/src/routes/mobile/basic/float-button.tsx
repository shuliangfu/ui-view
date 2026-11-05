/**
 * FloatButton 文档页。路由: /mobile/basic/float-button
 */

import { FloatButton } from "@dreamer/ui-view/mobile";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  { name: "icon", type: "unknown", default: "+", description: "主按钮内容" },
  { name: "items", type: "FloatButtonItem[]", default: "-", description: "展开子项" },
  { name: "placement", type: "bottom-right | …", default: "bottom-right", description: "角落位置" },
  { name: "position", type: '"fixed" | "absolute"', default: "fixed", description: "fixed=视口；absolute=相对最近定位祖先（文档示例用）" },
];

const importCode = `import { FloatButton } from "@dreamer/ui-view/mobile";

<FloatButton
  aria-label="新建"
  badge={3}
  position="absolute"
  items={[
    { key: "file", icon: "📄", "aria-label": "文件", onClick: () => {} },
    { key: "img", icon: "🖼️", "aria-label": "图片", onClick: () => {} },
  ]}
/>`;

export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>FloatButton</Title>
        <Paragraph>视口角悬浮按钮，可展开子操作（移动端同款）。文档示例用 position=&quot;absolute&quot;。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <MobileDocDemo>
          <div class="relative h-56 overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-dashed border-slate-300 dark:border-slate-600">
            <p class="absolute left-3 top-3 text-xs text-slate-500">示意容器</p>
            <FloatButton
              position="absolute"
              aria-label="新建"
              badge={3}
              items={[
                { key: "file", icon: "📄", "aria-label": "文件" },
                { key: "img", icon: "🖼️", "aria-label": "图片" },
              ]}
            />
          </div>
        </MobileDocDemo>
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
