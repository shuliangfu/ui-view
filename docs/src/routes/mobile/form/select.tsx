/**
 * Select（移动版）文档。路由: /mobile/form/select
 */

import { Select } from "@dreamer/ui-view/mobile";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";

const OPTIONS = [
  { value: "a", label: "选项 A" },
  { value: "b", label: "选项 B" },
  { value: "c", label: "选项 C", disabled: true },
];

export default function MobileSelectDoc() {
  return (
    <div class="w-full max-w-lg space-y-8">
      <Title level={1} class="text-2xl sm:text-3xl">
        Select
      </Title>
      <Paragraph class="text-slate-600 dark:text-slate-400">
        移动触控友好的原生 <code class="text-sm">select</code>{" "}
        样式（加大最小高度）。
      </Paragraph>
      <Select
        class="w-full max-w-xs"
        options={OPTIONS}
        placeholder="请选择"
        onChange={() => {}}
      />
      <CodeBlock
        language="tsx"
        copyable
        code={`import { Select } from "@dreamer/ui-view/mobile";

<Select options={[...]} placeholder="请选择" onChange={...} />`}
      />
    </div>
  );
}
