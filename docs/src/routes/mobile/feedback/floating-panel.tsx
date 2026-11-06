/**
 * FloatingPanel 文档页。路由: /mobile/feedback/floating-panel
 */

import { createSignal } from "@dreamer/view";
import { MobilePortalHostScope } from "@dreamer/ui-view/mobile";
import { FloatingPanel } from "@dreamer/ui-view/mobile/feedback";
import { Button, Paragraph, Title } from "@dreamer/ui-view/mobile/basic";
import { CodeBlock } from "@dreamer/ui-view/mobile/data-display";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  { name: "open", type: "ControlledOpenInput", default: "-", description: "是否打开" },
  { name: "anchors", type: "number[]", default: "[120,320,560]", description: "锚点高度（px，升序）" },
  { name: "anchorIndex", type: "number", default: "-", description: "当前锚点下标" },
  { name: "onClose", type: "() => void", default: "-", description: "遮罩关闭" },
  { name: "onAnchorChange", type: "(index) => void", default: "-", description: "锚点变化" },
];

const importCode = `import { createSignal } from "@dreamer/view";

const open = createSignal(false);

<FloatingPanel
  open={open}
  anchors={[120, 280, 420]}
  onClose={() => (open.value = false)}
>
  <div class="p-4">面板内容</div>
</FloatingPanel>`;


const exampleDemo = `const open = createSignal(false);
<Button onClick={() => (open.value = true)}>打开</Button>
<FloatingPanel open={open} onClose={() => (open.value = false)}>
  面板内容
</FloatingPanel>`;


export default function Page() {
  const open = createSignal(false);
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>FloatingPanel</Title>
        <Paragraph>
          底部多锚点可拖拽浮动面板。文档示例包在 MobilePortalHostScope 内，遮罩限制在示意框。
        </Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <MobileDocDemo class="flex min-h-[320px] flex-col p-4">
          <MobilePortalHostScope class="flex min-h-0 flex-1 flex-col">
            <Button type="button" onClick={() => (open.value = true)}>
              打开浮动面板
            </Button>
            <FloatingPanel
              open={open}
              anchors={[120, 220, 300]}
              onClose={() => (open.value = false)}
            >
              <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
                拖拽顶栏切换高度锚点；点遮罩关闭。
              </Paragraph>
            </FloatingPanel>
          </MobilePortalHostScope>
        </MobileDocDemo>
        <CodeBlock title="代码示例" code={exampleDemo} language="tsx" showLineNumbers copyable wrapLongLines />
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
