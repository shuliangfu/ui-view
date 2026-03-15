/**
 * 表单 - TimePicker（展示全部用法）
 * 路由: /form/time-picker
 */

import { Form, FormItem, Paragraph, TimePicker, Title } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

export default function FormTimePicker() {
  const [val, setVal] = createSignal("");
  const [val2, setVal2] = createSignal("14:30");

  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>TimePicker</Title>
        <Paragraph>
          时间选择：value、size、disabled 等全部用法。
        </Paragraph>
      </div>

      <Form layout="vertical" class="max-w-md space-y-6">
        <section class="space-y-4">
          <Title level={2}>基础</Title>
          <FormItem label="时间">
            <TimePicker
              value={val}
              onChange={(e) => setVal((e.target as HTMLInputElement).value)}
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>有默认值 / size / disabled</Title>
          <FormItem label="默认 14:30">
            <TimePicker
              value={val2}
              onChange={(e) => setVal2((e.target as HTMLInputElement).value)}
            />
          </FormItem>
          <FormItem label="sm">
            <TimePicker value="" size="sm" onChange={() => {}} />
          </FormItem>
          <FormItem label="lg">
            <TimePicker value="" size="lg" onChange={() => {}} />
          </FormItem>
          <FormItem label="禁用">
            <TimePicker value="09:00" disabled onChange={() => {}} />
          </FormItem>
        </section>
      </Form>
    </div>
  );
}
