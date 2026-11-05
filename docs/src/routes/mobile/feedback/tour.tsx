/**
 * Tour 文档页。路由: /mobile/feedback/tour
 */

import { createSignal } from "@dreamer/view";
import { Button, CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import { Tour } from "@dreamer/ui-view/mobile";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  { name: "open", type: "ControlledOpenInput", default: "-", description: "是否打开" },
  { name: "steps", type: "TourStep[]", default: "-", description: "步骤" },
];

const importCode = `import { createSignal } from "@dreamer/view";
import { Tour } from "@dreamer/ui-view/mobile";

const open = createSignal(false);

<Tour
  open={open}
  steps={[
    { title: "欢迎", description: "移动端漫游第一步", target: "#m-tour-a", placement: "bottom" },
    { title: "下一步", description: "第二步目标", target: "#m-tour-b", placement: "top" },
  ]}
  onClose={() => (open.value = false)}
  onFinish={() => (open.value = false)}
/>`;

export default function Page() {
  const open = createSignal(false);
  const steps = [
    {
      title: "欢迎",
      description: "移动端漫游第一步。",
      target: "#m-tour-a",
      placement: "bottom" as const,
    },
    {
      title: "下一步",
      description: "第二步目标。",
      target: "#m-tour-b",
      placement: "top" as const,
    },
  ];
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Tour</Title>
        <Paragraph>分步漫游引导（移动端同款）。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <MobileDocDemo>
          <div class="space-y-3 p-2">
            <div class="flex gap-3">
              <div
                id="m-tour-a"
                class="flex-1 rounded-lg border border-dashed px-3 py-4 text-xs"
              >
                目标 A
              </div>
              <div
                id="m-tour-b"
                class="flex-1 rounded-lg border border-dashed px-3 py-4 text-xs"
              >
                目标 B
              </div>
            </div>
            {() =>
              !open.value
                ? (
                  <div data-tour-trigger="start">
                    <Button
                      type="button"
                      onClick={() => (open.value = true)}
                    >
                      开始引导
                    </Button>
                  </div>
                )
                : (
                  <div
                    class="h-9"
                    aria-hidden="true"
                    data-tour-trigger="placeholder"
                  />
                )}
            <Tour
              open={open}
              steps={steps}
              onClose={() => (open.value = false)}
              onFinish={() => (open.value = false)}
            />
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
