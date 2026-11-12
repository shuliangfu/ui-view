/**
 * DataView 组件文档页（概述、引入、示例、API）
 * 路由: /desktop/data-display/data-view
 */

import { Paragraph, Title } from "@dreamer/ui-view/basic";
import { createSignal } from "@dreamer/view";
import { CodeBlock, DataView } from "@dreamer/ui-view/data-display";
import { DocsDemo } from "../../../components/DocsDemo.tsx";

interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

const DATA_VIEW_API: ApiRow[] = [
  {
    name: "title",
    type: "string",
    default: "-",
    description: "卡片标题；若未写 view.title 则同时作为标题栏文案",
  },
  {
    name: "view",
    type: "ViewConfig",
    default: "-",
    description:
      "明细配置。props 用 Descriptions 展示字段（写法同 DataPanel view）；render(ctx) 替换字段区。字段级 ViewItem.render 仅在无 view.render 且无 children 时生效。props 也可不写 prop，用 formatter／value 拼接字段，写法与 DataPanel 自定义列相同。",
  },
  {
    name: "children",
    type: "unknown",
    default: "-",
    description: "自定义内容区，替换 Descriptions 字段区，优先于 view.render",
  },
  {
    name: "tabs",
    type: "DataChromeTab[]",
    default: "-",
    description:
      "工具栏左侧的标签页（复用 layout Tabs）。未写 children 的标签展示默认明细；可给某个标签单独写 children",
  },
  {
    name: "activeTab",
    type: "string",
    default: "-",
    description: "受控的当前标签 key",
  },
  {
    name: "defaultActiveTab",
    type: "string",
    default: "第一项可用 key",
    description: "非受控时的初始标签 key",
  },
  {
    name: "onTabChange",
    type: "(key: string) => void",
    default: "-",
    description: "切换标签时回调",
  },
  {
    name: "tabType",
    type: "line | card",
    default: "line",
    description: "标签样式，与 Tabs 的 type 相同",
  },
  {
    name: "tabParam",
    type: "string | false",
    default: "tab",
    description:
      "地址栏查询参数名，用来记住并激活当前标签（如 ?tab=extra）。false 则不同步",
  },
  {
    name: "form",
    type: "FormConfig",
    default: "-",
    description: "工具栏「更新」打开的编辑 Modal，写法同 DataPanel form",
  },
  {
    name: "data",
    type: "Row",
    default: "-",
    description:
      "当前记录。传入则首屏直接渲染；优先序低于 dataSource，高于 baseRoute",
  },
  {
    name: "id",
    type: "string",
    default: "-",
    description: "记录主键；刷新／拉取单条时使用。缺省取 data[rowKey] 或当前行",
  },
  {
    name: "dataSource",
    type: "DataSource",
    default: "-",
    description:
      "自定义数据源（优先于 data／baseRoute）。刷新走源上的 view(id)／get(id)",
  },
  {
    name: "baseRoute",
    type: "string",
    default: "-",
    description: "未传 data 且未传 dataSource 时创建 API 数据源，同 DataPanel",
  },
  {
    name: "toolbar",
    type: "false | PanelToolbarConfig",
    default: "-",
    description:
      "false 隐藏整栏。默认键与顺序：update、refresh、print、import、export、fullscreen、copy。update 可用 edit 别名。省略键回落 caps；自定义键必须提供 action",
  },
  {
    name: "caps",
    type: "Partial<DataViewCaps>",
    default: "-",
    description: "能力开关；缺省按数据源方法推断（update／import 等）",
  },
  {
    name: "panelKey",
    type: "string",
    default: '"data-view"',
    description: "全屏偏好与 refreshDataPanel(key) 的标识；同页多实例须唯一",
  },
  {
    name: "rowKey",
    type: "string",
    default: '"id"',
    description: "主键字段",
  },
  {
    name: "locale",
    type: '"zh-CN" | "en-US"',
    default: '"zh-CN"',
    description: "界面语言",
  },
  {
    name: "messages",
    type: "Partial<Messages>",
    default: "-",
    description: "覆盖 DataPanel 文案（更新按钮默认「更新」／Update）",
  },
  {
    name: "onChanged",
    type: "() => void",
    default: "-",
    description: "写操作成功后回调",
  },
  {
    name: "onDataChange",
    type: "(row: Row | null) => void",
    default: "-",
    description: "data 模式下写操作后回调当前行",
  },
  {
    name: "class",
    type: "string",
    default: "-",
    description: "加在卡片上的额外 class",
  },
];

const importCode = `import { DataView } from "@dreamer/ui-view/data-display";

<DataView
  title="用户详情"
  data={user}
  view={{
    props: [
      { prop: "name", label: "姓名" },
      { prop: "email", label: "邮箱" },
      { prop: "status", label: "状态", type: "tag", options: STATUS },
    ],
  }}
  form={{ props: [{ prop: "name", label: "姓名" }] }}
/>`;

const basicCode = `<DataView
  panelKey="demo-data-view"
  title="用户详情"
  data={{
    id: "1",
    name: "Ada Lovelace",
    email: "ada@example.com",
    status: "active",
    createdAt: "2026-11-10 10:30:00",
  }}
  view={{
    props: [
      { prop: "name", label: "姓名" },
      { prop: "email", label: "邮箱" },
      {
        prop: "status",
        label: "状态",
        type: "tag",
        options: [
          { value: "active", label: "启用", tone: "success" },
          { value: "disabled", label: "停用" },
        ],
      },
      { prop: "createdAt", label: "创建时间", type: "datetime" },
    ],
  }}
  form={{
    title: (row) => \`编辑 · \${row.name ?? ""}\`,
    props: [
      { prop: "name", label: "姓名", required: true },
      { prop: "email", label: "邮箱" },
    ],
  }}
/>`;

const JOIN_VIEW_CODE =
  `const user = { id: "1", lastName: "舒", firstName: "良府" };
<DataView
  title="用户详情"
  data={user}
  view={{
    props: [
      { prop: "lastName", label: "姓" },
      { prop: "firstName", label: "名" },
      {
        label: "姓名",
        formatter: (row) =>
          \`\${row.lastName ?? ""}\${row.firstName ?? ""}\` || "—",
      },
    ],
  }}
/>`;

const DEMO_USER = {
  id: "1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  status: "active",
  createdAt: "2026-11-10 10:30:00",
};

export const metadata = {
  title: "DataView 数据明细 · ui-view",
};

export default function DataDisplayDataView() {
  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>DataView 数据明细</Title>
        <Paragraph class="mt-2">
          用于展示<b>单条记录</b>的明细面板：外壳与 DataPanel
          同一套卡片、标题栏和工具栏主题， 内容区默认是 DataPanel{" "}
          <code>view</code> 的 <code>Descriptions</code> 字段展示。也可以用{" "}
          <code>view.render(ctx)</code> 或 <code>children</code>{" "}
          换成自定义组件（<code>children</code>{" "}
          优先）。
          没有分页、搜索、新建、列设置和行高。工具栏默认保留：更新、刷新、打印、导入、导出、全屏、复制。
          传入 <code>tabs</code> 可在工具栏下切换明细分区（复用 layout Tabs）。
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

      <section class="flex flex-col gap-10">
        <Title level={2}>示例</Title>

        <DocsDemo title="基础用法（view.props）" code={basicCode}>
          <DataView
            panelKey="demo-data-view"
            title="用户详情"
            data={DEMO_USER}
            view={{
              props: [
                { prop: "name", label: "姓名" },
                { prop: "email", label: "邮箱" },
                {
                  prop: "status",
                  label: "状态",
                  type: "tag",
                  options: [
                    { value: "active", label: "启用", tone: "success" },
                    { value: "disabled", label: "停用" },
                  ],
                },
                {
                  prop: "createdAt",
                  label: "创建时间",
                  type: "datetime",
                },
              ],
            }}
            form={{
              title: (row) => `编辑 · ${row.name ?? ""}`,
              props: [
                { prop: "name", label: "姓名", required: true },
                { prop: "email", label: "邮箱" },
              ],
            }}
          />
        </DocsDemo>

        <DocsDemo title="拼接字段" code={JOIN_VIEW_CODE}>
          <DataView
            panelKey="demo-data-view-join-name"
            title="用户详情"
            data={{ id: "1", lastName: "舒", firstName: "良府" }}
            toolbar={false}
            view={{
              props: [
                { prop: "lastName", label: "姓" },
                { prop: "firstName", label: "名" },
                {
                  label: "姓名",
                  formatter: (row) =>
                    `${row.lastName ?? ""}${row.firstName ?? ""}` || "—",
                },
              ],
            }}
          />
        </DocsDemo>

        <div id="tab">
          <DocsDemo
            title="Tab"
            code={`import { DataView } from "@dreamer/ui-view/data-display";

<DataView
  panelKey="demo-data-view-tabs"
  title="用户详情"
  data={user}
  view={{ props }}
  tabs={[
    { key: "basic", label: "基本信息" },
    {
      key: "extra",
      label: "其他",
      children: <p>注册来源：后台录入</p>,
    },
  ]}
/>`}
          >
            <Paragraph class="mb-3 text-sm text-slate-600 dark:text-slate-400">
              标签放在工具栏左边的空位，和右侧按钮同一行。未写{" "}
              <code>children</code>{" "}
              的「基本信息」仍显示原来的字段明细；「其他」是自定义内容。点击会写入
              {" "}
              <code>?tab=</code>，用这个地址打开会激活对应标签。
            </Paragraph>
            <DataView
              panelKey="demo-data-view-tabs"
              title="用户详情"
              data={DEMO_USER}
              view={{
                props: [
                  { prop: "name", label: "姓名" },
                  { prop: "email", label: "邮箱" },
                  {
                    prop: "status",
                    label: "状态",
                    type: "tag",
                    options: [
                      { value: "active", label: "启用", tone: "success" },
                      { value: "disabled", label: "停用" },
                    ],
                  },
                  {
                    prop: "createdAt",
                    label: "创建时间",
                    type: "datetime",
                  },
                ],
              }}
              tabs={[
                { key: "basic", label: "基本信息" },
                {
                  key: "extra",
                  label: "其他",
                  children: (
                    <div class="px-3 py-4 text-sm text-slate-600 dark:text-slate-400">
                      注册来源：后台录入。可在这里放操作记录、附件或其他自定义内容。
                    </div>
                  ),
                },
              ]}
            />
          </DocsDemo>
        </div>
      </section>

      <section class="space-y-3">
        <Title level={2}>API</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          组件接收以下属性。类型 <code>ViewConfig</code>／
          <code>FormConfig</code>／<code>PanelToolbarConfig</code>{" "}
          与 DataPanel 共用。
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
              {DATA_VIEW_API.map((row) => (
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
