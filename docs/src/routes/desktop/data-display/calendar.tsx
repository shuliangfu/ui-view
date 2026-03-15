/** 路由: /data-display/calendar */
import { createSignal } from "@dreamer/view";
import { Calendar, Paragraph, Title } from "@dreamer/ui-view";

export default function DataDisplayCalendar() {
  const [value, setValue] = createSignal(new Date());

  return (
    <div class="space-y-6">
      <Title level={1}>Calendar</Title>
      <Paragraph>
        日历：value、onChange、mode、dateCellRender、monthCellRender、fullscreen、disabledDate、class。
      </Paragraph>
      <Title level={2}>基础选日</Title>
      <div class="max-w-md">
        <Calendar value={value()} onChange={setValue} />
      </div>
      <Title level={2}>mode=year 年视图</Title>
      <div class="max-w-md">
        <Calendar value={value()} onChange={setValue} mode="year" />
      </div>
      <Title level={2}>fullscreen 占满容器</Title>
      <div class="max-w-md min-h-[280px]">
        <Calendar value={value()} onChange={setValue} fullscreen />
      </div>
    </div>
  );
}
