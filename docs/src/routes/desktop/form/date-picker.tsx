/**
 * 表单 - DatePicker（展示全部用法）
 * 路由: /form/date-picker
 */

import { DatePicker, Form, FormItem, Paragraph, Title } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

export default function FormDatePicker() {
  const [val, setVal] = createSignal("");
  const [val2, setVal2] = createSignal("2025-01-15");

  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>DatePicker</Title>
        <Paragraph>
          日期选择：value、min、max、size、disabled 等全部用法。
        </Paragraph>
      </div>

      <Form layout="vertical" class="max-w-md space-y-6">
        <section class="space-y-4">
          <Title level={2}>基础</Title>
          <FormItem label="日期">
            <DatePicker
              value={val}
              onChange={(e) => setVal((e.target as HTMLInputElement).value)}
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>有默认值 / min / max</Title>
          <FormItem label="限制范围">
            <DatePicker
              value={val2}
              onChange={(e) => setVal2((e.target as HTMLInputElement).value)}
              min="2025-01-01"
              max="2025-12-31"
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>size / disabled</Title>
          <FormItem label="sm">
            <DatePicker value="" size="sm" onChange={() => {}} />
          </FormItem>
          <FormItem label="lg">
            <DatePicker value="" size="lg" onChange={() => {}} />
          </FormItem>
          <FormItem label="禁用">
            <DatePicker value="2025-06-01" disabled onChange={() => {}} />
          </FormItem>
        </section>
      </Form>
    </div>
  );
}
