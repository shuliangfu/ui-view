/**
 * Overlay 文档页。路由: /desktop/feedback/overlay
 */

import { createSignal } from "@dreamer/view";
import { Button, CodeBlock, Overlay, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";

const API: DocsApiTableRow[] = [
  { name: "open", type: "ControlledOpenInput", default: "-", description: "是否显示" },
  { name: "onClick", type: "() => void", default: "-", description: "点击遮罩" },
  { name: "portal", type: "boolean", default: "true", description: "是否挂 body" },
  { name: "zIndex", type: "number", default: "-", description: "层级" },
];

const importCode = `import { createSignal } from "@dreamer/view";
import { Overlay } from "@dreamer/ui-view";

const open = createSignal(false);

<button type="button" onClick={() => (open.value = true)}>打开遮罩</button>
<Overlay open={open} onClick={() => (open.value = false)} zIndex={400} />`;

export default function Page() {
  const open = createSignal(false);
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Overlay</Title>
        <Paragraph>全屏半透明遮罩；默认可 Portal 到 body。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 space-y-3">
          <Button type="button" onClick={() => (open.value = true)}>打开遮罩</Button>
          <Overlay open={open} onClick={() => (open.value = false)} zIndex={400} />
        </div>
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
