/**
 * Overlay 文档页。路由: /mobile/feedback/overlay
 */

import { Overlay } from "@dreamer/ui-view/mobile";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  { name: "open", type: "ControlledOpenInput", default: "-", description: "是否显示" },
  { name: "onClick", type: "() => void", default: "-", description: "点击遮罩" },
  { name: "portal", type: "boolean", default: "true", description: "是否挂 body；嵌套浮层内传 false" },
  { name: "lockScroll", type: "boolean", default: "随 portal", description: "锁 body 滚动" },
  { name: "as", type: "'div' | 'button'", default: "div", description: "根节点标签" }
];

const importCode = `import { Overlay } from "@dreamer/ui-view/mobile";\nimport { createSignal } from "@dreamer/view";\n\nconst open = createSignal(false);\n<Overlay open={open} onClick={() => (open.value = false)} />`;

export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Overlay</Title>
        <Paragraph>全屏遮罩（浮层抽离）；可独立使用或被 BottomSheet／ActionSheet 内联消费。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <MobileDocDemo>
          <Paragraph class="p-3 text-sm text-slate-500">传 open=&#123;signal&#125; 控制显示；常与自定义面板组合。独立使用时默认 Portal 到 body。</Paragraph>
        </MobileDocDemo>
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
