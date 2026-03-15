/** 路由: /feedback/popover */
import { Paragraph, Popover, Title } from "@dreamer/ui-view";

export default function FeedbackPopover() {
  return (
    <div class="space-y-6">
      <Title level={1}>Popover</Title>
      <Paragraph>
        弹出面板：悬停触发，带标题与内容；支持 placement、箭头。
      </Paragraph>

      <div class="flex flex-wrap gap-6 pt-4">
        <Popover
          title="标题"
          content="这里是面板内容，可放置简短说明或操作链接。"
          placement="top"
        >
          <span class="px-3 py-1.5 rounded bg-slate-200 dark:bg-slate-600 cursor-default">
            带标题 Top
          </span>
        </Popover>
        <Popover
          content="无标题的纯内容面板"
          placement="bottom"
        >
          <span class="px-3 py-1.5 rounded bg-slate-200 dark:bg-slate-600 cursor-default">
            无标题 Bottom
          </span>
        </Popover>
      </div>
    </div>
  );
}
