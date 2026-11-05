/**
 * ContextMenu 文档页。路由: /desktop/feedback/context-menu
 */

import { createSignal } from "@dreamer/view";
import { ContextMenu } from "@dreamer/ui-view";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";

const API: DocsApiTableRow[] = [
  { name: "items", type: "ContextMenuItem[]", default: "-", description: "菜单项（label／onClick／danger／divider／disabled）" },
  { name: "children", type: "unknown", default: "-", description: "触发区（右键）" },
];

const importCode = `import { ContextMenu } from "@dreamer/ui-view";

<ContextMenu
  items={[
    { key: "copy", label: "复制", onClick: () => {} },
    { key: "div1", label: "", divider: true },
    { key: "del", label: "删除", danger: true, onClick: () => {} },
  ]}
>
  <div class="p-8 border border-dashed rounded-lg">在此区域右键</div>
</ContextMenu>`;

export default function Page() {
  const tip = createSignal("");
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>ContextMenu</Title>
        <Paragraph>右键菜单：分割线、危险项、禁用项；Portal 浮层。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-6">
        <Title level={2}>示例</Title>

        <div class="space-y-2">
          <Title level={3}>基础</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 space-y-2">
            <ContextMenu
              items={[
                { key: "copy", label: "复制", onClick: () => (tip.value = "复制") },
                { key: "div1", label: "", divider: true },
                { key: "del", label: "删除", danger: true, onClick: () => (tip.value = "删除") },
              ]}
            >
              <div class="p-8 border border-dashed rounded-lg text-sm text-slate-500">
                在此区域右键
              </div>
            </ContextMenu>
            {() =>
              tip.value
                ? <p class="text-sm text-slate-500" role="status">操作：{tip.value}</p>
                : null}
          </div>
        </div>

        <div class="space-y-2">
          <Title level={3}>禁用项 disabled</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
            <ContextMenu
              items={[
                { key: "edit", label: "编辑", onClick: () => (tip.value = "编辑") },
                { key: "share", label: "分享（禁用）", disabled: true },
                { key: "d", label: "", divider: true },
                { key: "del", label: "删除", danger: true, onClick: () => (tip.value = "删除") },
              ]}
            >
              <div class="p-8 border border-dashed rounded-lg text-sm text-slate-500">
                右键：含禁用「分享」
              </div>
            </ContextMenu>
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
