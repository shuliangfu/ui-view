/**
 * Overlay 文档页。路由: /mobile/feedback/overlay
 */

import { createSignal } from "@dreamer/view";
import { Button, CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import { Overlay } from "@dreamer/ui-view/mobile";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  { name: "open", type: "ControlledOpenInput", default: "-", description: "是否显示" },
  { name: "onClick", type: "() => void", default: "-", description: "点击遮罩" },
  { name: "as", type: "'div' | 'button'", default: "div", description: "根节点标签" },
];

const importCode = `import { createSignal } from "@dreamer/view";
import { Overlay } from "@dreamer/ui-view/mobile";

const open = createSignal(false);

<button type="button" onClick={() => (open.value = true)}>打开遮罩</button>
<Overlay open={open} onClick={() => (open.value = false)} zIndex={400} />`;

export default function Page() {
  const open = createSignal(false);
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Overlay</Title>
        <Paragraph>全屏半透明遮罩（移动端同款）。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <MobileDocDemo>
          <div class="space-y-3 p-2">
            <Button type="button" onClick={() => (open.value = true)}>打开遮罩</Button>
            <Overlay open={open} onClick={() => (open.value = false)} zIndex={400} />
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
