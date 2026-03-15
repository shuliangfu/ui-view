/**
 * 表单 - 日期与时间（DatePicker、TimePicker、TimeRangePicker）
 * 路由: /form/datetime
 */

import {
  DatePicker,
  Form,
  FormItem,
  Paragraph,
  TimePicker,
  TimeRangePicker,
  Title,
} from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

export default function FormDatetime() {
  const [dateVal, setDateVal] = createSignal("");
  const [timeVal, setTimeVal] = createSignal("");
  const [timeRangeVal, setTimeRangeVal] = createSignal<[string, string]>([
    "",
    "",
  ]);

  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>日期与时间</Title>
        <Paragraph>
          DatePicker：value、min、max、size、disabled、onChange、class、name、id。TimePicker：value、size、disabled、onChange、class、name、id。TimeRangePicker：start、end、onChange、size、disabled、class、name、id。
        </Paragraph>
      </div>

      <Title level={2}>基础用法</Title>
      <Form layout="vertical" class="max-w-xl space-y-4">
        <FormItem label="DatePicker">
          <DatePicker
            value={dateVal()}
            onChange={(e) => setDateVal((e.target as HTMLInputElement).value)}
          />
        </FormItem>
        <FormItem label="TimePicker">
          <TimePicker
            value={timeVal()}
            onChange={(e) => setTimeVal((e.target as HTMLInputElement).value)}
          />
        </FormItem>
        <FormItem label="TimeRangePicker">
          {() => (
            <TimeRangePicker
              start={timeRangeVal()[0]}
              end={timeRangeVal()[1]}
              onChange={(v) => setTimeRangeVal(v)}
            />
          )}
        </FormItem>
      </Form>
    </div>
  );
}
