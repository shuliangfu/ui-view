/**
 * FloatingPanel 文档页。路由: /mobile/feedback/floating-panel
 */

import { FloatingPanel } from "@dreamer/ui-view/mobile";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  { name: "open", type: "ControlledOpenInput", default: "-", description: "是否打开" },
  { name: "anchors", type: "number[]", default: "[120,320,560]", description: "锚点高度" },
  { name: "anchorIndex", type: "number", default: "-", description: "当前锚点" }
];

const importCode = `import { createSignal } from "@dreamer/view";
import { FloatingPanel } from "@dreamer/ui-view/mobile";

const open = createSignal(true);

<FloatingPanel
  open={open}
  anchors={[120, 360]}
  onClose={() => (open.value = false)}
>
  <div class="p-4">面板内容</div>
</FloatingPanel>`;

export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>FloatingPanel</Title>
        <Paragraph>底部多锚点可拖拽浮动面板。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <MobileDocDemo>
          <Paragraph class="p-3 text-sm text-slate-500">传 anchors 与 open 控制高度档位。</Paragraph>
        </MobileDocDemo>
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
