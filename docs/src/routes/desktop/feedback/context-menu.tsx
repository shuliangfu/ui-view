/**
 * ContextMenu 文档页。路由: /desktop/feedback/context-menu
 */

import { createSignal } from "@dreamer/view";
import { ContextMenu } from "@dreamer/ui-view/feedback";
import { IconTrash, Paragraph, Title } from "@dreamer/ui-view/basic";
import { CodeBlock } from "@dreamer/ui-view/data-display";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MESSAGES_CONTEXT_MENU } from "../../../data/component-messages-rows.ts";
import { DOCS_DEMO_CODE_MAX_HEIGHT } from "../../../components/DocsDemo.tsx";

const API: DocsApiTableRow[] = [
  {
    name: "items",
    type: "ContextMenuItem[]",
    default: "-",
    description: "菜单项（label／icon／onClick／danger／divider／disabled）",
  },
  {
    name: "children",
    type: "unknown",
    default: "-",
    description: "触发区（右键）",
  },
  {
    name: "定位",
    type: "（内置 auto）",
    default: "auto",
    description:
      "无 placement 属性。菜单按点击坐标向右下展开；右边挡住则向左，下边挡住则向上，避免贴边被裁。",
  },
  {
    name: "messages",
    type: "Partial<ContextMenuMessages>",
    default: "-",
    description: "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
  },
];

const importCode = `import { ContextMenu } from "@dreamer/ui-view/feedback";
import { IconTrash } from "@dreamer/ui-view/basic";

<ContextMenu
  items={[
    { key: "copy", label: "复制", onClick: () => {} },
    { key: "div1", label: "", divider: true },
    {
      key: "del",
      label: "删除",
      danger: true,
      icon: <IconTrash size="sm" />,
      onClick: () => {},
    },
  ]}
>
  <div class="p-8 border border-dashed rounded-lg">在此区域右键</div>
</ContextMenu>`;

const exampleBasic = `<ContextMenu
  items={[
    { key: "copy", label: "复制", onClick: () => {} },
    { key: "div1", label: "", divider: true },
    {
      key: "del",
      label: "删除",
      danger: true,
      icon: <IconTrash size="sm" />,
      onClick: () => {},
    },
  ]}
>
  <div class="p-8 border border-dashed rounded-lg">在此区域右键</div>
</ContextMenu>`;

const exampleDisabled = `<ContextMenu
  items={[
    { key: "edit", label: "编辑", onClick: () => {} },
    { key: "share", label: "分享（禁用）", disabled: true },
    { key: "d", label: "", divider: true },
    { key: "del", label: "删除", danger: true, onClick: () => {} },
  ]}
>
  <div class="p-8 border border-dashed rounded-lg">右键：含禁用「分享」</div>
</ContextMenu>`;

const exampleAuto = `<div class="flex justify-end">
  <ContextMenu
    items={[
      { key: "copy", label: "复制", onClick: () => {} },
      { key: "edit", label: "编辑", onClick: () => {} },
      { key: "div1", label: "", divider: true },
      { key: "del", label: "删除", danger: true, onClick: () => {} },
    ]}
  >
    <div class="w-40 p-8 border border-dashed rounded-lg">靠右右键</div>
  </ContextMenu>
</div>`;

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
export const metadata = {
  title: "ContextMenu · ui-view",
};

export default function Page() {
  const tip = createSignal("");
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>ContextMenu</Title>
        <Paragraph>
          右键菜单：图标、分割线、危险项、禁用项；Portal
          浮层。菜单默认向点击处右下展开，右边挡住则向左、下边挡住则向上。
        </Paragraph>
        <Paragraph class="mt-2 text-sm text-slate-600 dark:text-slate-400">
          菜单项文案走{" "}
          <code>items[].label</code>（可 VNode）；<code>messages.menu</code>
          {" "}
          仅覆盖面板 aria-label。
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
          <Title level={3}>基础</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 space-y-2">
            <ContextMenu
              items={[
                {
                  key: "copy",
                  label: "复制",
                  onClick: () => (tip.value = "复制"),
                },
                { key: "div1", label: "", divider: true },
                {
                  key: "del",
                  label: "删除",
                  danger: true,
                  icon: <IconTrash size="sm" />,
                  onClick: () => (tip.value = "删除"),
                },
              ]}
            >
              <div class="p-8 border border-dashed rounded-lg text-sm text-slate-500">
                在此区域右键
              </div>
            </ContextMenu>
            {() =>
              tip.value
                ? (
                  <p class="text-sm text-slate-500" role="status">
                    操作：{tip.value}
                  </p>
                )
                : null}
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleBasic}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>

        <div class="space-y-2">
          <Title level={3}>禁用项 disabled</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
            <ContextMenu
              items={[
                {
                  key: "edit",
                  label: "编辑",
                  onClick: () => (tip.value = "编辑"),
                },
                { key: "share", label: "分享（禁用）", disabled: true },
                { key: "d", label: "", divider: true },
                {
                  key: "del",
                  label: "删除",
                  danger: true,
                  onClick: () => (tip.value = "删除"),
                },
              ]}
            >
              <div class="p-8 border border-dashed rounded-lg text-sm text-slate-500">
                右键：含禁用「分享」
              </div>
            </ContextMenu>
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleDisabled}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>
        <div class="space-y-2" data-demo="auto-flip-right">
          <Title level={3}>贴边自动翻转</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            在视口最右侧的区域内右键：菜单右边被挡时改向左展开，避免超出窗口被裁切。
          </Paragraph>
          <div class="-mr-3 sm:-mr-6 lg:-mr-10 pr-2">
            <div class="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/40 px-3 py-3">
              <div class="flex justify-end">
                <ContextMenu
                  items={[
                    {
                      key: "copy",
                      label: "复制",
                      onClick: () => (tip.value = "复制"),
                    },
                    {
                      key: "edit",
                      label: "编辑",
                      onClick: () => (tip.value = "编辑"),
                    },
                    { key: "div1", label: "", divider: true },
                    {
                      key: "del",
                      label: "删除",
                      danger: true,
                      icon: <IconTrash size="sm" />,
                      onClick: () => (tip.value = "删除"),
                    },
                  ]}
                >
                  <div
                    data-demo-trigger="contextmenu-auto-right"
                    class="w-40 p-8 border border-dashed rounded-lg text-sm text-slate-500 bg-white dark:bg-slate-900"
                  >
                    靠右右键
                  </div>
                </ContextMenu>
              </div>
            </div>
          </div>
          <CodeBlock
            title="代码示例（贴右边右键，自动向左展开）"
            code={exampleAuto}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>
      </section>
      <DocsMessagesSection
        interfaceName="ContextMenuMessages"
        defaultExportName="defaultContextMenuMessages"
        rows={MESSAGES_CONTEXT_MENU}
      />

      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
