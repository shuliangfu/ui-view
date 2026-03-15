/** 路由: /data-display/calendar */
import { createSignal } from "@dreamer/view";
import { Calendar, Paragraph, Title } from "@dreamer/ui-view";

export default function DataDisplayCalendar() {
  const [value, setValue] = createSignal(new Date());

  return (
    <div class="space-y-6">
      <Title level={1}>Calendar</Title>
      <Paragraph>
        日历：月视图、选日、dateCellRender、monthCellRender。
      </Paragraph>
      <div class="max-w-md">
        <Calendar value={value()} onChange={setValue} />
      </div>
    </div>
  );
}
