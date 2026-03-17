/**
 * Dialog 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/feedback/dialog
 */

import { createSignal } from "@dreamer/view";
import { Button, CodeBlock, Dialog, Paragraph, Title } from "@dreamer/ui-view";

/** API 属性行类型 */
interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

const DIALOG_API: ApiRow[] = [
  {
    name: "open",
    type: "boolean",
    default: "-",
    description: "是否打开（受控）",
  },
  {
    name: "onClose",
    type: "() => void",
    default: "-",
    description: "关闭回调",
  },
  { name: "title", type: "string | null", default: "-", description: "标题" },
  {
    name: "content",
    type: "string | unknown",
    default: "-",
    description: "正文（与 children 二选一）",
  },
  {
    name: "children",
    type: "unknown",
    default: "-",
    description: "弹层内容（与 content 二选一）",
  },
  {
    name: "footer",
    type: "unknown",
    default: "-",
    description: "自定义底部；传 null 不显示",
  },
  {
    name: "confirmText",
    type: "string",
    default: "确定",
    description: "确定按钮文案",
  },
  {
    name: "cancelText",
    type: "string | null",
    default: "取消",
    description: "取消按钮文案；null 不显示",
  },
  {
    name: "onConfirm",
    type: "() => void | Promise<void>",
    default: "-",
    description: "确定回调",
  },
  {
    name: "onCancel",
    type: "() => void",
    default: "onClose",
    description: "取消回调",
  },
  {
    name: "danger",
    type: "boolean",
    default: "false",
    description: "危险操作（确定按钮 danger 样式）",
  },
  {
    name: "confirmLoading",
    type: "boolean",
    default: "false",
    description: "确定按钮 loading 态",
  },
  {
    name: "showFooter",
    type: "boolean",
    default: "true",
    description: "是否显示底部",
  },
];

const importCode = `import { createSignal } from "@dreamer/view";
import { Button, Dialog } from "@dreamer/ui-view";

const [open, setOpen] = createSignal(false);

<Button variant="primary" onClick={() => setOpen(true)}>打开</Button>
<Dialog
  open={open()}
  onClose={() => setOpen(false)}
  title="确认操作"
  content="确定要执行该操作吗？"
  confirmText="确定"
  cancelText="取消"
  onConfirm={() => setOpen(false)}
  onCancel={() => setOpen(false)}
/>`;

const exampleBasic = `<Dialog
  open={open()}
  onClose={() => setOpen(false)}
  title="确认操作"
  content="确定要执行该操作吗？"
  confirmText="确定"
  cancelText="取消"
  onConfirm={() => setOpen(false)}
  onCancel={() => setOpen(false)}
/>`;

const exampleDanger = `<Dialog
  open={openDanger()}
  onClose={() => setOpenDanger(false)}
  title="删除确认"
  content="删除后无法恢复，确定要删除吗？"
  confirmText="删除"
  cancelText="取消"
  danger
  onConfirm={() => setOpenDanger(false)}
  onCancel={() => setOpenDanger(false)}
/>`;

const exampleLoading = `<Dialog
  open={openLoading()}
  onClose={() => setOpenLoading(false)}
  title="提交中"
  content="确定后将显示 loading 状态，常用于异步提交。"
  confirmText="确定"
  cancelText="取消"
  confirmLoading
  onConfirm={() => setOpenLoading(false)}
  onCancel={() => setOpenLoading(false)}
/>`;

export default function FeedbackDialog() {
  const [open, setOpen] = createSignal(false);
  const [openDanger, setOpenDanger] = createSignal(false);
  const [openLoading, setOpenLoading] = createSignal(false);

  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>Dialog 确认对话框</Title>
        <Paragraph class="mt-2">
          确认/取消对话框，基于
          Modal：标题、正文、确定/取消按钮；支持危险操作样式、确定按钮
          loading、自定义 footer。使用 Tailwind v4，支持 light/dark 主题。
        </Paragraph>
      </section>

      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock
          title="代码示例"
          code={importCode}
          language="tsx"
          showLineNumbers
          wrapLongLines
        />
      </section>

      <section class="space-y-8">
        <Title level={2}>示例</Title>

        <div class="space-y-4">
          <Title level={3}>基础用法</Title>
          <div class="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="primary"
              onClick={() => setOpen(true)}
            >
              打开 Dialog
            </Button>
          </div>
          <Dialog
            open={open()}
            onClose={() => setOpen(false)}
            title="确认操作"
            content="确定要执行该操作吗？"
            confirmText="确定"
            cancelText="取消"
            onConfirm={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
          <CodeBlock
            title="代码示例"
            code={exampleBasic}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>危险操作（danger）</Title>
          <div class="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="danger"
              onClick={() => setOpenDanger(true)}
            >
              危险操作
            </Button>
          </div>
          <Dialog
            open={openDanger()}
            onClose={() => setOpenDanger(false)}
            title="删除确认"
            content="删除后无法恢复，确定要删除吗？"
            confirmText="删除"
            cancelText="取消"
            danger
            onConfirm={() => setOpenDanger(false)}
            onCancel={() => setOpenDanger(false)}
          />
          <CodeBlock
            title="代码示例"
            code={exampleDanger}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>确定 Loading（confirmLoading）</Title>
          <div class="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpenLoading(true)}
            >
              确定 Loading
            </Button>
          </div>
          <Dialog
            open={openLoading()}
            onClose={() => setOpenLoading(false)}
            title="提交中"
            content="确定后将显示 loading 状态，常用于异步提交。"
            confirmText="确定"
            cancelText="取消"
            confirmLoading
            onConfirm={() => setOpenLoading(false)}
            onCancel={() => setOpenLoading(false)}
          />
          <CodeBlock
            title="代码示例"
            code={exampleLoading}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>
      </section>

      <section class="space-y-3">
        <Title level={2}>API</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          Dialog 继承 Modal 大部分属性（如
          closable、maskClosable、width、centered、destroyOnClose、keyboard
          等），下表仅列 Dialog 特有或常用属性。
        </Paragraph>
        <div class="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-600">
          <table class="w-full min-w-lg text-sm">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/80">
                <th class="px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">
                  属性
                </th>
                <th class="px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">
                  类型
                </th>
                <th class="px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">
                  默认值
                </th>
                <th class="px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">
                  说明
                </th>
              </tr>
            </thead>
            <tbody>
              {DIALOG_API.map((row) => (
                <tr
                  key={row.name}
                  class="border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                >
                  <td class="px-4 py-2.5 font-mono text-slate-700 dark:text-slate-300">
                    {row.name}
                  </td>
                  <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                    {row.type}
                  </td>
                  <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                    {row.default}
                  </td>
                  <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                    {row.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
