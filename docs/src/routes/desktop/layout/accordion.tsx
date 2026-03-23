/**
 * Accordion 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/layout/accordion
 */

import { createSignal } from "@dreamer/view";
import { Accordion, CodeBlock, Paragraph, Title } from "@dreamer/ui-view";

/** API 属性行类型 */
interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

const ACCORDION_API: ApiRow[] = [
  {
    name: "items",
    type: "AccordionItem[]",
    default: "-",
    description: "手风琴项（key、header、disabled、children）",
  },
  {
    name: "expandedKeys",
    type: "string[]",
    default: "-",
    description: "当前展开 key 列表（受控）",
  },
  {
    name: "defaultExpandedKeys",
    type: "string[]",
    default: "[]",
    description: "默认展开 key（非受控）",
  },
  {
    name: "onChange",
    type: "(expandedKeys: string[]) => void",
    default: "-",
    description: "展开/收起变化回调",
  },
  {
    name: "allowMultiple",
    type: "boolean",
    default: "true",
    description: "是否允许多项同时展开",
  },
  { name: "class", type: "string", default: "-", description: "外层 class" },
  {
    name: "itemClass",
    type: "string",
    default: "-",
    description: "单项容器 class",
  },
  {
    name: "headerClass",
    type: "string",
    default: "-",
    description: "标题区 class",
  },
  {
    name: "contentClass",
    type: "string",
    default: "-",
    description: "内容区 class",
  },
];

const importCode = `import { createSignal } from "@dreamer/view";
import { Accordion } from "@dreamer/ui-view";

const expandedKeys = createSignal<string[]>(["1"]);
const items = [
  { key: "1", header: "第一项", children: <p>内容</p> },
  { key: "2", header: "第二项", children: <p>内容</p> },
];
{() => (
  <Accordion
    items={items}
    expandedKeys={expandedKeys.value}
    onChange={(keys) => expandedKeys.value = keys}
    allowMultiple
  />
)}`;

const exampleMultiple = `{() => (
  <Accordion
    items={items}
    expandedKeys={expandedKeys.value}
    onChange={(keys) => expandedKeys.value = keys}
    allowMultiple
  />
)}`;

const exampleSingle = `{() => (
  <Accordion
    items={items}
    expandedKeys={expandedKeys.value}
    onChange={(keys) => expandedKeys.value = keys}
    allowMultiple={false}
  />
)}`;

const exampleDisabled = `{() => (
  <Accordion
    items={[
      { key: "1", header: "可展开", children: <p>内容</p> },
      { key: "2", header: "禁用项", disabled: true, children: <p>不可点击</p> },
    ]}
    expandedKeys={["1"]}
    onChange={() => {}}
  />
)}`;

export default function LayoutAccordion() {
  const expandedKeys = createSignal<string[]>(["1"]);

  const items = [
    {
      key: "1",
      header: "第一项",
      children: <p class="text-sm">第一项展开内容。</p>,
    },
    {
      key: "2",
      header: "第二项",
      children: <p class="text-sm">第二项展开内容。</p>,
    },
    {
      key: "3",
      header: "第三项",
      children: <p class="text-sm">第三项展开内容。</p>,
    },
  ];

  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>Accordion 手风琴折叠</Title>
        <Paragraph class="mt-2">
          手风琴：items（key、header、disabled、children）、expandedKeys、defaultExpandedKeys、onChange、allowMultiple、class、itemClass、headerClass、contentClass。
          使用 Tailwind v4，支持 light/dark 主题。
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

      {/* 必须包成 getter：否则 expandedKeys 变化会触发整树渲染，协调时易用旧 props/整块替换，导致点击无反应；仅示例区依赖 getter 后只更新本块，点击才正常 */}
      <section class="space-y-8">
        <Title level={2}>示例</Title>

        <div class="space-y-4">
          <Title level={3}>allowMultiple=true</Title>
          {() => (
            <Accordion
              items={items}
              expandedKeys={expandedKeys.value}
              onChange={(keys) => expandedKeys.value = keys}
              allowMultiple
            />
          )}
          <CodeBlock
            title="代码示例"
            code={exampleMultiple}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>allowMultiple=false（单选）</Title>
          {() => (
            <Accordion
              items={items}
              expandedKeys={expandedKeys.value}
              onChange={(keys) => expandedKeys.value = keys}
              allowMultiple={false}
            />
          )}
          <CodeBlock
            title="代码示例"
            code={exampleSingle}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>items 含 disabled</Title>
          {() => (
            <Accordion
              items={[
                {
                  key: "1",
                  header: "可展开",
                  children: <p class="text-sm">内容</p>,
                },
                {
                  key: "2",
                  header: "禁用项",
                  disabled: true,
                  children: <p class="text-sm">不可点击</p>,
                },
              ]}
              expandedKeys={["1"]}
              onChange={() => {}}
            />
          )}
          <CodeBlock
            title="代码示例"
            code={exampleDisabled}
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
          AccordionItem：key、header、disabled、children。Accordion 属性如下。
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
              {ACCORDION_API.map((row) => (
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
