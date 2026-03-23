/**
 * DatePicker（移动版）文档。路由: /mobile/form/date-picker
 */

import { DatePicker } from "@dreamer/ui-view/mobile";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";

export default function MobileDatePickerDoc() {
  return (
    <div class="w-full max-w-lg space-y-8">
      <Title level={1} class="text-2xl sm:text-3xl">
        DatePicker
      </Title>
      <Paragraph class="text-slate-600 dark:text-slate-400">
        原生 <code class="text-sm">input[type=date]</code>，加大触控区域。
      </Paragraph>
      <DatePicker class="w-full max-w-xs" onChange={() => {}} />
      <CodeBlock
        language="tsx"
        copyable
        code={`import { DatePicker } from "@dreamer/ui-view/mobile";

<DatePicker value="2026-01-01" onChange={...} />`}
      />
    </div>
  );
}
