/**
 * MultiSelect（移动版）文档。路由: /mobile/form/multiselect
 */

import { MultiSelect } from "@dreamer/ui-view/mobile";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";

const OPTIONS = [
  { value: "x", label: "项 X" },
  { value: "y", label: "项 Y" },
];

export default function MobileMultiSelectDoc() {
  return (
    <div class="w-full max-w-lg space-y-8">
      <Title level={1} class="text-2xl sm:text-3xl">
        MultiSelect
      </Title>
      <Paragraph class="text-slate-600 dark:text-slate-400">
        多选 + 全选/清空，适配触控区域。
      </Paragraph>
      <MultiSelect
        class="w-full max-w-md"
        options={OPTIONS}
        value={["x"]}
        onChange={() => {}}
      />
      <CodeBlock
        language="tsx"
        copyable
        code={`import { MultiSelect } from "@dreamer/ui-view/mobile";

<MultiSelect options={[...]} value={keys} onChange={...} />`}
      />
    </div>
  );
}
