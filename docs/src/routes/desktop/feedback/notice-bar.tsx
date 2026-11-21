/**
 * NoticeBar 文档页。路由: /desktop/feedback/notice-bar
 */

import { createSignal } from "@dreamer/view";
import { Button, Paragraph, Title } from "@dreamer/ui-view/basic";
import { CodeBlock } from "@dreamer/ui-view/data-display";
import {
  clearAlertCloseCookie,
  isAlertClosed,
  NoticeBar,
} from "@dreamer/ui-view/feedback";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MESSAGES_NOTICE_BAR } from "../../../data/component-messages-rows.ts";
import { DOCS_DEMO_CODE_MAX_HEIGHT } from "../../../components/DocsDemo.tsx";

const API: DocsApiTableRow[] = [
  {
    name: "content",
    type: "unknown | unknown[]",
    default: "-",
    description: "文案；数组时一次只显示一条，停留后再接下一条",
  },
  {
    name: "children",
    type: "unknown",
    default: "-",
    description: "子节点（优先于 content）",
  },
  {
    name: "tone",
    type: "info|success|warning|danger",
    default: "info",
    description: "色调",
  },
  {
    name: "icon",
    type: "boolean | unknown",
    default: "false",
    description:
      "默认不显示。写 icon 即用默认 info 图标，颜色随 tone；也可传入自定义节点",
  },
  {
    name: "closable",
    type: "boolean",
    default: "false",
    description: "可关闭。传入 closeConfirm 或 closeKey 时默认显示",
  },
  {
    name: "onClose",
    type: "() => void",
    default: "-",
    description:
      "关闭回调。点击后会自行隐藏并调用；若设置了 closeConfirm，需在确认后才会隐藏并调用",
  },
  {
    name: "closeConfirm",
    type: "string",
    default: "-",
    description:
      "关闭前确认文案。传入后点击关闭会先弹出气泡，取消则不关闭，确认后才隐藏并调用 onClose",
  },
  {
    name: "closeKey",
    type: "string",
    default: "-",
    description:
      "Cookie 名。关闭后写入该 cookie（一年），之后刷新或 SSR 都不再显示",
  },
  {
    name: "visible",
    type: "boolean | Signal<boolean> | () => boolean",
    default: "-",
    description: "受控可见；不传则点 × 内部隐藏",
  },
  {
    name: "scrollable",
    type: "boolean",
    default: "false",
    description: "开启滚动。水平从右向左循环；垂直从下往上；数组时一次一条",
  },
  {
    name: "speed",
    type: '"fast" | "medium" | "slow" | number',
    default: "medium",
    description:
      "滚动速度。三档或数字（像素/秒）：fast 120、medium 60、slow 30",
  },
  {
    name: "direction",
    type: '"horizontal" | "vertical"',
    default: "horizontal",
    description: "滚动方向。horizontal 从右向左，vertical 从下往上",
  },
  {
    name: "interval",
    type: "number",
    default: "3",
    description: "当前条展示秒数，到时再滚下一条。仅多条或垂直滚动时生效",
  },
  {
    name: "onClick",
    type: "() => void",
    default: "-",
    description: "整条点击",
  },
  {
    name: "rounded",
    type: 'boolean | "sm" | "md" | "lg" | "full"',
    default: "false",
    description:
      "圆角，默认 false 为直角。写 rounded 即为 rounded-lg；也可写 sm／md／lg／full",
  },
  { name: "class", type: "string", default: "-", description: "额外 class" },
  {
    name: "messages",
    type: "Partial<NoticeBarMessages>",
    default: "-",
    description: "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
  },
];

const importCode = `import {
  NoticeBar,
  clearAlertCloseCookie,
  isAlertClosed,
} from "@dreamer/ui-view/feedback";

<NoticeBar tone="warning" closable content="系统将于今晚 23:00 维护，请提前保存" />`;

const exampleTone = `<NoticeBar tone="info" content="信息：同步已完成" />
<NoticeBar tone="success" content="成功：配置已保存" />
<NoticeBar tone="warning" content="警告：磁盘空间不足" />
<NoticeBar tone="danger" content="危险：认证即将过期" />`;

const exampleClosable =
  `<NoticeBar tone="warning" closable content="系统将于今晚维护" />`;

const exampleScroll = `<NoticeBar
  tone="info"
  scrollable
  content="欢迎使用组件库 —— 本条为长文案横向滚动示意，请关注发布说明与变更日志。"
/>`;

const exampleItems = `<NoticeBar
  tone="info"
  scrollable
  speed="medium"
  interval={3}
  content={[
    "系统将于今晚 23:00 维护，请提前保存数据。",
    "v2.1 已发布，可在设置中查看更新说明。",
    "请及时完成实名认证，以免影响部分功能。",
  ]}
/>`;

const exampleSpeed =
  `<NoticeBar tone="info" scrollable speed="fast" content="快速 120 像素/秒 —— 长文案从右侧进入向左循环。" />
<NoticeBar tone="info" scrollable speed="medium" content="中速 60 像素/秒 —— 长文案从右侧进入向左循环。" />
<NoticeBar tone="info" scrollable speed="slow" content="慢速 30 像素/秒 —— 长文案从右侧进入向左循环。" />
<NoticeBar tone="info" scrollable speed={90} content="自定义 90 像素/秒 —— 也可直接写数字。" />`;

const exampleVertical = `<NoticeBar
  tone="warning"
  scrollable
  direction="vertical"
  speed="medium"
  interval={4}
  content={[
    "系统将于今晚 23:00 维护，请提前保存数据。",
    "v2.1 已发布，可在设置中查看更新说明。",
    "请及时完成实名认证，以免影响部分功能。",
  ]}
/>`;

const exampleClosePrompt = `const visible = createSignal(true);

{() => visible.value && (
  <NoticeBar
    tone="warning"
    closeConfirm="你确认要关闭吗？"
    onClose={() => { visible.value = false; }}
    content="这条关闭前会先确认"
  />
)}`;

const exampleCloseKey = `<NoticeBar
  tone="info"
  closeConfirm="关闭后将不再提示"
  closeKey="notice-maintenance-hint"
  content="系统维护通知：关闭后刷新也不再显示"
/>`;

const exampleVisible = `const controlledVisible = createSignal(true);

{controlledVisible.value ? (
  <NoticeBar
    tone="success"
    closable
    visible={controlledVisible}
    onClose={() => (controlledVisible.value = false)}
    content="受控条：点 × 由外部 signal 隐藏"
  />
) : (
  <Button type="button" size="sm" onClick={() => (controlledVisible.value = true)}>
    重新显示
  </Button>
)}`;

const exampleDefaultIcon =
  `<NoticeBar icon tone="info" content="信息：同步已完成" />
<NoticeBar icon tone="success" content="成功：配置已保存" />
<NoticeBar icon tone="warning" content="警告：磁盘空间不足" />
<NoticeBar icon tone="danger" content="危险：认证即将过期" />`;

const exampleIconClick = `<NoticeBar
  tone="info"
  icon={<span aria-hidden="true">📢</span>}
  content="点击本条查看详情"
  onClick={() => {}}
/>`;

const closePromptDemoVisible = createSignal(true);
const closeKeyDemoTick = createSignal(0);
const CLOSE_KEY_DEMO = "docs-notice-bar-close-key";

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
export const metadata = {
  title: "NoticeBar · ui-view",
};

export default function Page() {
  const controlledVisible = createSignal(true);
  const tip = createSignal("");
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>NoticeBar</Title>
        <Paragraph>
          块级通知条：色调、可关闭、长文或多条从右向左循环滚动、关闭前确认、关闭后不再显示、受控可见。未传
          visible 时点 × 内部隐藏。
        </Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock
          code={importCode}
          language="tsx"
          maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
        />
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
          <CodeBlock
            title="代码示例"
            code={exampleTone}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>

        <div class="space-y-2">
          <Title level={3}>可关闭 closable</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
            <NoticeBar tone="warning" closable content="系统将于今晚维护" />
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleClosable}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
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
          <CodeBlock
            title="代码示例"
            code={exampleScroll}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>

        <div class="space-y-2">
          <Title level={3}>多条滚动</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            <code>content</code>{" "}
            传入数组后，一次只显示一条：从右侧进入、向左滚出，停留{" "}
            <code>interval</code> 秒后再接下一条。
          </Paragraph>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
            <NoticeBar
              tone="info"
              scrollable
              speed="medium"
              interval={3}
              content={[
                "系统将于今晚 23:00 维护，请提前保存数据。",
                "v2.1 已发布，可在设置中查看更新说明。",
                "请及时完成实名认证，以免影响部分功能。",
              ]}
            />
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleItems}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>

        <div class="space-y-2">
          <Title level={3}>滚动速度</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            <code>speed</code> 可写 <code>fast</code>、<code>medium</code>、
            <code>slow</code>，或直接写数字（像素/秒）。
          </Paragraph>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 space-y-3">
            <NoticeBar
              tone="info"
              scrollable
              speed="fast"
              content="快速 120 像素/秒 —— 长文案从右侧进入向左循环。"
            />
            <NoticeBar
              tone="info"
              scrollable
              speed="medium"
              content="中速 60 像素/秒 —— 长文案从右侧进入向左循环。"
            />
            <NoticeBar
              tone="info"
              scrollable
              speed="slow"
              content="慢速 30 像素/秒 —— 长文案从右侧进入向左循环。"
            />
            <NoticeBar
              tone="info"
              scrollable
              speed={90}
              content="自定义 90 像素/秒 —— 也可直接写数字。"
            />
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleSpeed}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>

        <div class="space-y-2">
          <Title level={3}>纵向滚动</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            <code>direction="vertical"</code> 时从下往上切换；用{" "}
            <code>interval</code> 控制每条停留秒数。
          </Paragraph>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
            <NoticeBar
              tone="warning"
              scrollable
              direction="vertical"
              speed="medium"
              interval={4}
              content={[
                "系统将于今晚 23:00 维护，请提前保存数据。",
                "v2.1 已发布，可在设置中查看更新说明。",
                "请及时完成实名认证，以免影响部分功能。",
              ]}
            />
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleVertical}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>

        <div class="space-y-2">
          <Title level={3}>关闭提示</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            传入{" "}
            <code class="rounded bg-slate-200/80 px-1 font-mono text-xs dark:bg-slate-600/80">
              closeConfirm
            </code>{" "}
            后，点击关闭会先弹出气泡；取消则不关闭，确认后才隐藏。刷新后会再次显示。
          </Paragraph>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 space-y-3">
            {() =>
              closePromptDemoVisible.value
                ? (
                  <NoticeBar
                    tone="warning"
                    closeConfirm="你确认要关闭吗？"
                    onClose={() => {
                      closePromptDemoVisible.value = false;
                    }}
                    content="这条关闭前会先确认"
                  />
                )
                : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => (closePromptDemoVisible.value = true)}
                  >
                    重新显示
                  </Button>
                )}
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleClosePrompt}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>

        <div class="space-y-2">
          <Title level={3}>关闭确认</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            再传入{" "}
            <code class="rounded bg-slate-200/80 px-1 font-mono text-xs dark:bg-slate-600/80">
              closeKey
            </code>
            ，关闭状态会写入 cookie，刷新或 SSR 都不再显示。
          </Paragraph>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 space-y-3">
            {() => {
              closeKeyDemoTick.value;
              return !isAlertClosed(CLOSE_KEY_DEMO)
                ? (
                  <NoticeBar
                    tone="info"
                    closeConfirm="关闭后将不再提示"
                    closeKey={CLOSE_KEY_DEMO}
                    onClose={() => {
                      closeKeyDemoTick.value++;
                    }}
                    content="系统维护通知：关闭后刷新也不再显示"
                  />
                )
                : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      clearAlertCloseCookie(CLOSE_KEY_DEMO);
                      closeKeyDemoTick.value++;
                    }}
                  >
                    重新显示
                  </Button>
                );
            }}
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleCloseKey}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
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
                    visible={controlledVisible}
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
          <CodeBlock
            title="代码示例"
            code={exampleVisible}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>

        <div class="space-y-2">
          <Title level={3}>默认图标 icon</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            默认不显示图标。传入{" "}
            <code class="rounded bg-slate-200/80 px-1 font-mono text-xs dark:bg-slate-600/80">
              icon
            </code>{" "}
            即使用默认 info 图标，颜色跟随 tone。
          </Paragraph>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 space-y-2">
            <NoticeBar icon tone="info" content="信息：同步已完成" />
            <NoticeBar icon tone="success" content="成功：配置已保存" />
            <NoticeBar icon tone="warning" content="警告：磁盘空间不足" />
            <NoticeBar icon tone="danger" content="危险：认证即将过期" />
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleDefaultIcon}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
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
                ? (
                  <p class="text-sm text-slate-500" role="status">
                    {tip.value}
                  </p>
                )
                : null}
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleIconClick}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>
      </section>
      <DocsMessagesSection
        interfaceName="NoticeBarMessages"
        defaultExportName="defaultNoticeBarMessages"
        rows={MESSAGES_NOTICE_BAR}
      />

      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
