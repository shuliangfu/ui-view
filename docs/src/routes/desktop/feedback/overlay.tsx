/**
 * Overlay 文档页。路由: /desktop/feedback/overlay
 */

import { Overlay, Button } from "@dreamer/ui-view";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";

const API: DocsApiTableRow[] = [
  { name: "open", type: "ControlledOpenInput", default: "-", description: "是否显示" },
  { name: "onClick", type: "() => void", default: "-", description: "点击遮罩" },
  { name: "lockScroll", type: "boolean", default: "true", description: "锁滚动" },
  { name: "zIndex", type: "number", default: "300", description: "层级" }
];

const importCode = `import { Overlay } from "@dreamer/ui-view";\n\n<Overlay open={open} onClick={() => (open.value = false)} />`;

export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level=1>Overlay</Title>
        <Paragraph>全屏遮罩（自浮层抽离），支持 Portal 与滚动锁定。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level=2>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level=2>示例</Title>
        <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
          <Paragraph>传 open=&#123;signal&#125; 控制显示；常与自定义面板组合。</Paragraph>
        </div>
      </section>
      <section class="space-y-3">
        <Title level=2>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
