/**
 * Tour 文档页。路由: /desktop/feedback/tour
 */

import { createSignal } from "@dreamer/view";
import { Button, CodeBlock, Paragraph, Title, Tour } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";

const API: DocsApiTableRow[] = [
  { name: "open", type: "ControlledOpenInput", default: "-", description: "是否打开" },
  { name: "steps", type: "TourStep[]", default: "-", description: "步骤（含 target）" },
  { name: "onClose", type: "() => void", default: "-", description: "关闭" },
];

const importCode = `import { createSignal } from "@dreamer/view";
import { Tour } from "@dreamer/ui-view";

const open = createSignal(false);

<Tour
  open={open}
  steps={[
    { title: "欢迎", description: "高亮左侧目标", target: "#tour-demo-a", placement: "bottom" },
    { title: "继续", description: "高亮右侧目标", target: "#tour-demo-b", placement: "bottom" },
  ]}
  onClose={() => (open.value = false)}
  onFinish={() => (open.value = false)}
/>`;

export default function Page() {
  const open = createSignal(false);
  const steps = [
    {
      title: "欢迎",
      description: "这是第一步：高亮左侧目标。",
      target: "#tour-demo-a",
      placement: "bottom" as const,
    },
    {
      title: "继续",
      description: "第二步：高亮右侧目标。",
      target: "#tour-demo-b",
      placement: "bottom" as const,
    },
  ];
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Tour</Title>
        <Paragraph>分步漫游引导；按 target 高亮页面元素。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 space-y-4">
          <div class="flex gap-4">
            <div id="tour-demo-a" class="rounded-lg border border-dashed px-4 py-6 text-sm">目标 A</div>
            <div id="tour-demo-b" class="rounded-lg border border-dashed px-4 py-6 text-sm">目标 B</div>
          </div>
          <Button type="button" onClick={() => (open.value = true)}>开始引导</Button>
          <Tour
            open={open}
            steps={steps}
            onClose={() => (open.value = false)}
            onFinish={() => (open.value = false)}
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
