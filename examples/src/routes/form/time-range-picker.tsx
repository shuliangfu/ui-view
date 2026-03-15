/**
 * 表单 - TimeRangePicker（展示全部用法）
 * 路由: /form/time-range-picker
 */

import {
  Form,
  FormItem,
  Paragraph,
  TimeRangePicker,
  Title,
} from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

export default function FormTimeRangePicker() {
  const [range, setRange] = createSignal<[string, string]>(["", ""]);
  const [range2, setRange2] = createSignal<[string, string]>([
    "09:00",
    "18:00",
  ]);

  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>TimeRangePicker</Title>
        <Paragraph>
          时间范围：start/end、onChange([start, end])、size、disabled
          等全部用法。
        </Paragraph>
      </div>

      <Form layout="vertical" class="max-w-md space-y-6">
        <section class="space-y-4">
          <Title level={2}>基础</Title>
          <FormItem label="时间范围">
            <TimeRangePicker
              start={() => range()[0]}
              end={() => range()[1]}
              onChange={(v) => setRange(v)}
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>有默认值 / size / disabled</Title>
          <FormItem label="默认 09:00–18:00">
            <TimeRangePicker
              start={() => range2()[0]}
              end={() => range2()[1]}
              onChange={(v) => setRange2(v)}
            />
          </FormItem>
          <FormItem label="sm">
            <TimeRangePicker start="" end="" size="sm" onChange={() => {}} />
          </FormItem>
          <FormItem label="禁用">
            <TimeRangePicker
              start="08:00"
              end="17:00"
              disabled
              onChange={() => {}}
            />
          </FormItem>
        </section>
      </Form>
    </div>
  );
}
