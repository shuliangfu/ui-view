/**
 * Tour 文档页。路由: /desktop/feedback/tour
 */

import { Tour, Button } from "@dreamer/ui-view";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";

const API: DocsApiTableRow[] = [
  { name: "open", type: "ControlledOpenInput", default: "-", description: "是否打开" },
  { name: "steps", type: "TourStep[]", default: "-", description: "步骤" },
  { name: "current", type: "MaybeSignal<number>", default: "0", description: "当前步" },
  { name: "onFinish", type: "() => void", default: "-", description: "完成" }
];

const importCode = `import { Tour } from "@dreamer/ui-view";\n\n<Tour open={open} steps={[…]} />`;

export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Tour</Title>
        <Paragraph>分步漫游引导，高亮目标并展示说明。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
          <Paragraph>在页面中放置 data-tour 目标后传入 steps 即可；此处仅 API 说明。</Paragraph>
        </div>
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
