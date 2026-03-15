/** 路由: /feedback/tooltip */
import { Paragraph, Title, Tooltip } from "@dreamer/ui-view";

export default function FeedbackTooltip() {
  return (
    <div class="space-y-6">
      <Title level={1}>Tooltip</Title>
      <Paragraph>
        悬停提示：触发器悬停时显示气泡；支持 placement、箭头。
      </Paragraph>

      <div class="flex flex-wrap gap-6 pt-4">
        <Tooltip content="上方提示" placement="top">
          <span class="px-3 py-1.5 rounded bg-slate-200 dark:bg-slate-600 cursor-default">
            Top
          </span>
        </Tooltip>
        <Tooltip content="右侧提示" placement="right">
          <span class="px-3 py-1.5 rounded bg-slate-200 dark:bg-slate-600 cursor-default">
            Right
          </span>
        </Tooltip>
        <Tooltip content="下方提示" placement="bottom">
          <span class="px-3 py-1.5 rounded bg-slate-200 dark:bg-slate-600 cursor-default">
            Bottom
          </span>
        </Tooltip>
        <Tooltip content="左侧提示" placement="left">
          <span class="px-3 py-1.5 rounded bg-slate-200 dark:bg-slate-600 cursor-default">
            Left
          </span>
        </Tooltip>
      </div>

      <div class="pt-4">
        <Tooltip content="这是一段较长的提示文案，用于说明当前操作的注意事项。">
          <span class="px-3 py-1.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 cursor-default">
            长文案
          </span>
        </Tooltip>
      </div>

      <div class="pt-4">
        <Title level={2}>arrow=false 无箭头</Title>
        <Tooltip content="不显示箭头的气泡" arrow={false}>
          <span class="px-3 py-1.5 rounded bg-slate-200 dark:bg-slate-600 cursor-default">
            无箭头
          </span>
        </Tooltip>
      </div>
    </div>
  );
}
