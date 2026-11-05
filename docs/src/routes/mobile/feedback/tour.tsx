/**
 * Tour 文档页。路由: /mobile/feedback/tour
 */

import { Tour } from "@dreamer/ui-view/mobile";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  { name: "open", type: "ControlledOpenInput", default: "-", description: "是否打开" },
  { name: "steps", type: "TourStep[]", default: "-", description: "步骤" },
  { name: "current", type: "MaybeSignal<number>", default: "0", description: "当前步" },
  { name: "onFinish", type: "() => void", default: "-", description: "完成" }
];

const importCode = `import { Tour } from "@dreamer/ui-view/mobile";\nimport { createSignal } from "@dreamer/view";\n\nconst open = createSignal(false);\n<Tour open={open} steps={[…]} onClose={() => (open.value = false)} />`;

export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Tour</Title>
        <Paragraph>分步漫游引导：高亮目标、四向气泡、Esc／键盘。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <MobileDocDemo>
          <Paragraph class="p-3 text-sm text-slate-500">在页面放置目标节点后传入 steps；详见引入代码。移动端与桌面 API 一致。</Paragraph>
        </MobileDocDemo>
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
