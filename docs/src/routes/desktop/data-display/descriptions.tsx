/**
 * Descriptions 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/data-display/descriptions
 */

import { CodeBlock, Descriptions, Paragraph, Title } from "@dreamer/ui-view";

/** API 属性行类型 */
interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

const DESCRIPTIONS_API: ApiRow[] = [
  {
    name: "items",
    type: "DescriptionsItem[]",
    default: "-",
    description: "描述项（label、children、span）",
  },
  {
    name: "title",
    type: "string | unknown",
    default: "-",
    description: "标题",
  },
  { name: "column", type: "number", default: "3", description: "列数" },
  {
    name: "bordered",
    type: "boolean",
    default: "false",
    description: "是否带边框",
  },
  { name: "size", type: "SizeVariant", default: "-", description: "尺寸" },
  {
    name: "layout",
    type: "horizontal | vertical",
    default: "-",
    description: "布局",
  },
  {
    name: "colon",
    type: "boolean",
    default: "true",
    description: "标签后是否显示冒号",
  },
  {
    name: "labelClass",
    type: "string",
    default: "-",
    description: "标签列 class",
  },
  {
    name: "contentClass",
    type: "string",
    default: "-",
    description: "内容列 class",
  },
  { name: "class", type: "string", default: "-", description: "容器 class" },
];

const importCode = `import { Descriptions } from "@dreamer/ui-view";

const items = [{ label: "姓名", children: "张三" }, { label: "年龄", children: "28" }, ...];
<Descriptions
  title="用户信息"
  items={items}
  column={3}
  bordered
/>`;

const exampleBordered = `<Descriptions
  title="用户信息"
  items={items}
  column={3}
  bordered
/>`;

const exampleLayout = `<Descriptions
  items={items.slice(0, 3)}
  layout="vertical"
/>`;

const exampleSizeColon = `<Descriptions
  items={items}
  size="sm"
  title="小尺寸"
/>
<Descriptions
  items={items}
  colon={false}
  title="无冒号"
/>`;

export default function DataDisplayDescriptions() {
  const items = [
    { label: "姓名", children: "张三" },
    { label: "年龄", children: "28" },
    { label: "城市", children: "北京" },
    { label: "备注", children: "描述列表键值对展示", span: 2 },
  ];

  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>Descriptions 描述列表</Title>
        <Paragraph class="mt-2">
          描述列表：items、title、column、bordered、size、layout、colon、labelClass、contentClass。
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

      <section class="space-y-8">
        <Title level={2}>示例</Title>

        <div class="space-y-4">
          <Title level={3}>标题 + 列数 + 边框</Title>
          <Descriptions title="用户信息" items={items} column={3} bordered />
          <CodeBlock
            title="代码示例"
            code={exampleBordered}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>layout=vertical</Title>
          <Descriptions items={items.slice(0, 3)} layout="vertical" />
          <CodeBlock
            title="代码示例"
            code={exampleLayout}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>size=sm / colon=false</Title>
          <Descriptions items={items.slice(0, 3)} size="sm" title="小尺寸" />
          <Descriptions
            items={items.slice(0, 2)}
            colon={false}
            title="无冒号"
          />
          <CodeBlock
            title="代码示例"
            code={exampleSizeColon}
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
          DescriptionsItem：label、children、span。Descriptions 属性如下。
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
              {DESCRIPTIONS_API.map((row) => (
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
