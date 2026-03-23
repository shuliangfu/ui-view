/**
 * DateRangePicker（移动版）文档。路由: /mobile/form/date-range-picker
 */

import { DateRangePicker } from "@dreamer/ui-view/mobile";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";

export default function MobileDateRangePickerDoc() {
  return (
    <div class="w-full max-w-lg space-y-8">
      <Title level={1} class="text-2xl sm:text-3xl">
        DateRangePicker
      </Title>
      <Paragraph class="text-slate-600 dark:text-slate-400">
        起止日期双输入，移动布局下自动换行。
      </Paragraph>
      <DateRangePicker
        class="w-full"
        start="2026-01-01"
        end="2026-01-31"
        onChange={() => {}}
      />
      <CodeBlock
        language="tsx"
        copyable
        code={`import { DateRangePicker } from "@dreamer/ui-view/mobile";

<DateRangePicker start="..." end="..." onChange={...} />`}
      />
    </div>
  );
}
