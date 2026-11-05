/**
 * NoticeBar 文档页。路由: /desktop/feedback/notice-bar
 */

import { createSignal } from "@dreamer/view";
import { Button, CodeBlock, NoticeBar, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";

const API: DocsApiTableRow[] = [
  { name: "content", type: "unknown", default: "-", description: "文案" },
  { name: "children", type: "unknown", default: "-", description: "子节点（优先于 content）" },
  { name: "tone", type: "info|success|warning|danger", default: "info", description: "色调" },
  { name: "icon", type: "unknown", default: "-", description: "左侧前缀" },
  { name: "closable", type: "boolean", default: "false", description: "可关闭" },
  { name: "onClose", type: "() => void", default: "-", description: "关闭回调" },
  { name: "visible", type: "boolean", default: "-", description: "受控可见；不传则点 × 内部隐藏" },
  { name: "scrollable", type: "boolean", default: "false", description: "长文横向滚动" },
  { name: "onClick", type: "() => void", default: "-", description: "整条点击" },
  { name: "class", type: "string", default: "-", description: "额外 class" },
];

const importCode = `import { NoticeBar } from "@dreamer/ui-view";

<NoticeBar tone="warning" closable content="系统将于今晚 23:00 维护，请提前保存" />`;

export default function Page() {
  const controlledVisible = createSignal(true);
  const tip = createSignal("");
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>NoticeBar</Title>
        <Paragraph>
          块级通知条：色调、可关闭、长文滚动、受控可见。未传 visible 时点 × 内部隐藏。
        </Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-6">
        <Title level={2}>示例</Title>

        <div class="space-y-2">
          <Title level={3}>色调 tone</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 space-y-2">
            <NoticeBar tone="info" content="信息：同步已完成" />
            <NoticeBar tone="success" content="成功：配置已保存" />
            <NoticeBar tone="warning" content="警告：磁盘空间不足" />
            <NoticeBar tone="danger" content="危险：认证即将过期" />
          </div>
        </div>

        <div class="space-y-2">
          <Title level={3}>可关闭 closable</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
            <NoticeBar tone="warning" closable content="系统将于今晚维护" />
          </div>
        </div>

        <div class="space-y-2">
          <Title level={3}>长文滚动 scrollable</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
            <NoticeBar
              tone="info"
              scrollable
              content="欢迎使用组件库 —— 本条为长文案横向滚动示意，请关注发布说明与变更日志。"
            />
          </div>
        </div>

        <div class="space-y-2">
          <Title level={3}>受控 visible</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 space-y-3">
            {() =>
              controlledVisible.value
                ? (
                  <NoticeBar
                    tone="success"
                    closable
                    visible={controlledVisible.value}
                    onClose={() => (controlledVisible.value = false)}
                    content="受控条：点 × 由外部 signal 隐藏"
                  />
                )
                : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => (controlledVisible.value = true)}
                  >
                    重新显示
                  </Button>
                )}
          </div>
        </div>

        <div class="space-y-2">
          <Title level={3}>图标 + 整条点击</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 space-y-2">
            <NoticeBar
              tone="info"
              icon={<span aria-hidden="true">📢</span>}
              content="点击本条查看详情"
              onClick={() => (tip.value = "已点击通知条")}
            />
            {() =>
              tip.value
                ? <p class="text-sm text-slate-500" role="status">{tip.value}</p>
                : null}
          </div>
        </div>
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
