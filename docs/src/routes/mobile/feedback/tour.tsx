/**
 * Tour 文档页。路由: /mobile/feedback/tour
 */

import { createSignal } from "@dreamer/view";
import { Tour } from "@dreamer/ui-view/mobile";
import { Button, CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  { name: "open", type: "ControlledOpenInput", default: "-", description: "是否打开" },
  { name: "steps", type: "TourStep[]", default: "-", description: "步骤" },
  { name: "current", type: "MaybeSignal<number>", default: "-", description: "受控步；不传则内部步进" },
  { name: "showSkip", type: "boolean", default: "true", description: "跳过" },
];

const importCode = `import { createSignal } from "@dreamer/view";
import { Tour } from "@dreamer/ui-view/mobile";

const open = createSignal(false);
<Tour open={open} steps={[...]} onClose={() => (open.value = false)} />`;

export default function Page() {
  const open = createSignal(false);
  const openCtrl = createSignal(false);
  const current = createSignal(0);
  const steps = [
    { title: "欢迎", description: "这是第一步：高亮左侧目标。", target: "#m-tour-a", placement: "bottom" as const },
    { title: "继续", description: "第二步：高亮右侧目标。", target: "#m-tour-b", placement: "bottom" as const },
  ];
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Tour</Title>
        <Paragraph>移动端漫游引导；非受控可点「下一步」；亦可受控 current。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-6">
        <Title level={2}>示例</Title>
        <div class="space-y-2">
          <Title level={3}>基础（非受控步进）</Title>
          <MobileDocDemo class="p-4 space-y-3">
            <div class="flex gap-3">
              <div id="m-tour-a" class="rounded-lg border border-dashed px-3 py-5 text-sm flex-1">目标 A</div>
              <div id="m-tour-b" class="rounded-lg border border-dashed px-3 py-5 text-sm flex-1">目标 B</div>
            </div>
            {() =>
              !open.value
                ? (
                  <div data-tour-trigger="start">
                    <Button type="button" onClick={() => (open.value = true)}>开始引导</Button>
                  </div>
                )
                : <div class="h-9" data-tour-trigger="placeholder" aria-hidden="true" />}
            <Tour
              open={open}
              steps={steps}
              onClose={() => (open.value = false)}
              onFinish={() => (open.value = false)}
            />
          </MobileDocDemo>
        </div>
        <div class="space-y-2">
          <Title level={3}>受控 current</Title>
          <MobileDocDemo class="p-4 space-y-2">
            <div id="m-tour-c" class="rounded-lg border border-dashed px-3 py-4 text-sm">受控目标</div>
            <Button type="button" size="sm" onClick={() => {
              current.value = 0;
              openCtrl.value = true;
            }}>
              打开受控
            </Button>
            <Tour
              open={openCtrl}
              current={current}
              onCurrentChange={(i) => (current.value = i)}
              steps={[
                { title: "一步", description: "受控", target: "#m-tour-c", placement: "bottom" },
              ]}
              onClose={() => (openCtrl.value = false)}
              onFinish={() => (openCtrl.value = false)}
            />
          </MobileDocDemo>
        </div>
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
