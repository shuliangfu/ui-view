/**
 * DataView 组件文档页（概述、引入、示例、API）
 * 路由: /desktop/data-display/data-view
 */

import { Paragraph, Title } from "@dreamer/ui-view/basic";
import {
  CodeBlock,
  createLocalDataSource,
  DataView,
} from "@dreamer/ui-view/data-display";
import { toast } from "@dreamer/ui-view/feedback";
import { IconUser } from "@dreamer/ui-view/icons/User.tsx";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { DocsTypeApiSections } from "../../../components/DocsTypeApiSections.tsx";
import { MESSAGES_DATA_PANEL } from "../../../data/component-messages-rows.ts";
import { DATA_VIEW_TYPE_IDS } from "../../../data/data-display-api-types.ts";
import {
  DOCS_DEMO_CODE_MAX_HEIGHT,
  DocsDemo,
} from "../../../components/DocsDemo.tsx";

const DATA_VIEW_API: DocsApiTableRow[] = [
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
      "明细配置，写法同 DataPanel view。DataView 的 view 是页面本身而不是弹层，width／fullscreenable／autoFullscreen／mobileAutoFullscreen 只在 DataPanel 详情弹层上生效。Descriptions 的参数（除 items、title）可直接写在 view 上，例如 column（本插槽缺省 1）、size（缺省 sm）、bordered（缺省 true）、layout、colon、labelAlign、labelColPercent、labelMinWidth。title 仍是标题。有 render 或 children 时这些参数不生效。props 用 Descriptions 展示字段；render(ctx) 替换字段区。字段级 ViewItem.render 仅在无 view.render 且无 children 时生效。props 也可不写 prop，用 formatter／value 拼接字段。ViewItem.labelAlign 控制该行标签对齐（vertical：top／center／bottom，horizontal：left／center／right），透传 Descriptions。",
  },
  {
    name: "children",
    type: "unknown",
    default: "-",
    description:
      "替换明细正文（Descriptions 字段区），优先于 view.render。与 DataPanel 的 children（根上额外 Modal，不替换表格）不同；扩展明细主体请优先用 view.render",
  },
  {
    name: "tabs",
    type: "DataChromeTab[]",
    default: "-",
    description:
      "工具栏左侧的标签页（复用 layout Tabs）。未写 children 的标签展示默认明细。配置了 tabs 后，当前标签 key 会作为查询参数带到所有 API 请求（详情／刷新／导入／更新等）；没有 tabs 时不带该参数。切换标签会重新拉取记录，已请求过的相同标签+id 走内存缓存；工具栏刷新只作废当前标签的缓存",
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
    type: '"line" | "card"',
    default: '"line"',
    description: "标签样式，与 Tabs 的 type 相同",
  },
  {
    name: "tabParam",
    type: "string | false",
    default: "tab",
    description:
      "查询参数名，用于地址栏同步，并带到 API 请求里（默认 tab，如 ?tab=extra）。false 则不同步地址栏，也不在请求里带该参数",
  },
  {
    name: "form",
    type: "FormConfig",
    default: "-",
    description:
      "工具栏「更新」打开的编辑 Modal，写法同 DataPanel form（含 width、fullscreenable 全屏按钮、autoFullscreen 所有端打开即全屏、mobileAutoFullscreen 仅移动端打开即全屏，以及 form.actions 官方底栏、字段 show／disabled／options 函数）",
  },
  {
    name: "data",
    type: "Row",
    default: "-",
    description:
      "当前记录。传入则首屏先渲染，随后若有 view(id)／get(id) 仍会再请求并更新；优先序低于 dataSource，高于 baseRoute",
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
      "自定义数据源（优先于 data／baseRoute）。首次进入与刷新都走源上的 view(id)／get(id)，失败或返回空则回落 data",
  },
  {
    name: "baseRoute",
    type: "string",
    default: "-",
    description: "未传 data 且未传 dataSource 时创建 API 数据源，同 DataPanel",
  },
  {
    name: "resource",
    type: "string",
    default: "-",
    description: "仅当 baseRoute 只有 1 段时生效，同 DataPanel",
  },
  {
    name: "apiMode",
    type: '"action" | "restful"',
    default: '"action"',
    description: "自动建源时的接口风格，同 DataPanel",
  },
  {
    name: "apiHeaders",
    type: "HeadersInit | () => HeadersInit | Promise<HeadersInit>",
    default: "-",
    description:
      "传给 createApiDataSource 的请求头（固定或函数），仅自动建源时生效",
  },
  {
    name: "apiCredentials",
    type: "RequestCredentials",
    default: "-",
    description: "传给 fetch 的 credentials，仅自动建源时生效",
  },
  {
    name: "alert",
    type:
      "string | DataAlertConfig | false | null | (() => string | DataAlertConfig | false | null | undefined)",
    default: "-",
    description:
      '页面提示条，位于工具栏（含工具栏左侧标签）下方、详情正文上方。字符串简写为 info 提示（如 alert="请先完成实名认证"）。对象为完整 DataAlertConfig：透传 Alert 的 type／message／description／showIcon／closable／onClose／banner／action／class／children／messages，另加 show／key。false／null／省略／show: false 不显示；函数在渲染时求值。本插槽 closable、banner 默认 true。点击关闭会隐藏提示并调用 onClose；更换文案或先置空再传入会重新显示。详见下方 DataAlertConfig 表。',
  },
  {
    name: "toolbar",
    type: "false | ViewToolbarConfig (Record)",
    default: "-",
    description:
      "false 隐藏整栏。默认键与顺序：update、remove、refresh、print、import、export、fullscreen、copy。update 可用 edit 别名。省略键回落 caps；自定义键必须提供 action。show／disable／action 接收 { record }（零参函数仍可用）",
  },
  {
    name: "caps",
    type: "Partial<DataViewCaps>",
    default: "-",
    description:
      "能力开关；缺省按数据源方法推断。remove 默认＝存在 dataSource.remove（确认后删除当前记录）。update／import 等同样按源推断",
  },
  {
    name: "panelKey",
    type: "string",
    default: '"data-view"',
    description:
      "全屏偏好、refreshDataPanel(key)，以及 getDataView／getDataViewRecord／openDataViewForm 的标识；同页多实例须唯一",
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
    name: "exportName",
    type: "string",
    default: "title",
    description: "导出文件名（不含扩展名），默认取 title",
  },
  {
    name: "onImportRows",
    type: "(rows) => void",
    default: "-",
    description: "接管导入；缺省走 dataSource.importRows",
  },
  {
    name: "onExport",
    type: '(format: "xlsx" | "csv" | "json" | "xml" | "html", ctx) => void',
    default: "-",
    description: "接管导出；缺省时导出当前记录",
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

/** 按 panelKey 注册的命令式句柄（与 refreshDataPanel 同一套键） */
const VIEW_HANDLE_API: DocsApiTableRow[] = [
  {
    name: "refreshDataPanel(key)",
    type: "() => Promise<void>",
    default: "-",
    description:
      "重新拉取已挂载的详情（或同 key 的数据面板）；无句柄时回落旧 refreshers",
  },
  {
    name: "getDataView(key)",
    type: "DataViewHandle | undefined",
    default: "-",
    description: "句柄：reload／getRecord／openForm(row?)",
  },
  {
    name: "getDataViewRecord(key)",
    type: "Row | null | undefined",
    default: "-",
    description: "当前详情记录；未挂载时为 undefined",
  },
  {
    name: "openDataViewForm(key, row?)",
    type: "(key: string, row?: Row) => void",
    default: "-",
    description: "打开编辑表单；无 row 则用当前记录",
  },
];

const importCode = `import { DataView } from "@dreamer/ui-view/data-display";

const user = {
  id: "1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  status: "active",
  createdAt: "2026-11-10 10:30:00",
};

<DataView
  panelKey="demo-data-view"
  title="用户详情"
  data={user}
  view={{
    labelColPercent: 28,
    labelMinWidth: "7rem",
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
/>
`;

const basicCode = `import { DataView } from "@dreamer/ui-view/data-display";

const user = {
  id: "1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  status: "active",
  createdAt: "2026-11-10 10:30:00",
};

<DataView
  panelKey="demo-data-view"
  title="用户详情"
  data={user}
  view={{
    labelColPercent: 28,
    labelMinWidth: "7rem",
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
/>
`;

const alertCode = `import { DataView } from "@dreamer/ui-view/data-display";
import { toast } from "@dreamer/ui-view/feedback";

const user = {
  id: "1",
  name: "张三",
  email: "zhangsan@example.com",
};

<DataView
  panelKey="demo-data-view-alert"
  title="用户详情"
  data={user}
  view={{
    props: [
      { prop: "name", label: "姓名" },
      { prop: "email", label: "邮箱" },
    ],
  }}
  alert={{
    type: "warning",
    message: "请先完成实名认证",
    description: "未认证账号部分功能暂不可用。",
    onClose: () => toast.info("已关闭提示"),
  }}
  toolbar={{
    update: false,
    remove: false,
    print: false,
    import: false,
    export: false,
    fullscreen: false,
    copy: false,
  }}
/>
`;

const JOIN_VIEW_CODE =
  `const user = { id: "1", lastName: "张", firstName: "三" };

<DataView
  panelKey="demo-data-view-join-name"
  title="用户详情"
  data={user}
  toolbar={false}
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
/>
`;

const DEMO_USER = {
  id: "1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  status: "active",
  createdAt: "2026-11-10 10:30:00",
};

const removeDemoSource = createLocalDataSource({
  rows: [{ ...DEMO_USER }],
  columns: [
    { prop: "name", label: "姓名" },
    { prop: "email", label: "邮箱" },
    { prop: "status", label: "状态" },
    { prop: "createdAt", label: "创建时间", type: "datetime" },
  ],
  writable: true,
});

const removeDemoCode =
  `import { createLocalDataSource, DataView } from "@dreamer/ui-view/data-display";
import { toast } from "@dreamer/ui-view/feedback";
import { IconUser } from "@dreamer/ui-view/icons/User.tsx";

const user = {
  id: "1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  status: "active",
  createdAt: "2026-11-10 10:30:00",
};

const source = createLocalDataSource({
  rows: [{ ...user }],
  columns: [
    { prop: "name", label: "姓名" },
    { prop: "email", label: "邮箱" },
    { prop: "status", label: "状态" },
    { prop: "createdAt", label: "创建时间", type: "datetime" },
  ],
  writable: true,
});

<DataView
  panelKey="demo-data-view-remove"
  title="用户详情"
  id="1"
  data={user}
  dataSource={source}
  view={{
    labelColPercent: 28,
    labelMinWidth: "7rem",
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
  toolbar={{
    sayName: {
      icon: <IconUser />,
      title: "读当前记录",
      label: "读当前记录",
      action: ({ record }) => {
        toast.info(record?.name ? \`当前：\${record.name}\` : "暂无记录");
      },
    },
    update: true,
    remove: true,
    refresh: true,
    print: false,
    import: false,
    export: false,
    fullscreen: false,
    copy: false,
  }}
/>
`;

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
          换成自定义组件（<code>children</code> 优先于{" "}
          <code>view.render</code>；这与 DataPanel 的 <code>children</code>
          （根上额外内容，不替换表格）不同）。
          没有分页、搜索、新建、列设置和行高。可用 <code>alert</code>{" "}
          在工具栏下方、详情正文上方放一条页面提示（支持关闭与
          onClose）。工具栏默认保留：更新、删除、刷新、打印、导入、导出、全屏、复制（有
          {" "}
          <code>dataSource.remove</code> 时显示删除，可用{" "}
          <code>caps.remove:false</code> 关掉）。 传入 <code>tabs</code>{" "}
          可在工具栏下切换明细分区（复用 layout Tabs）；有标签时 API
          请求会带上当前 tab 参数。
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
          maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
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
              labelColPercent: 28,
              labelMinWidth: "7rem",
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

        <DocsDemo title="页面提示条" code={alertCode}>
          <Paragraph class="mb-3 text-sm text-slate-600 dark:text-slate-400">
            提示条在工具栏下方、详情正文上方。对象配置可写 Alert
            的全部参数；默认可关闭，点关闭会隐藏并触发 <code>onClose</code>。
          </Paragraph>
          <DataView
            panelKey="demo-data-view-alert"
            title="用户详情"
            data={{
              id: "1",
              name: "张三",
              email: "zhangsan@example.com",
            }}
            view={{
              props: [
                { prop: "name", label: "姓名" },
                { prop: "email", label: "邮箱" },
              ],
            }}
            alert={{
              type: "warning",
              message: "请先完成实名认证",
              description: "未认证账号部分功能暂不可用。",
              onClose: () => toast.info("已关闭提示"),
            }}
            toolbar={{
              update: false,
              remove: false,
              print: false,
              import: false,
              export: false,
              fullscreen: false,
              copy: false,
            }}
          />
        </DocsDemo>

        <DocsDemo title="拼接字段" code={JOIN_VIEW_CODE}>
          <DataView
            panelKey="demo-data-view-join-name"
            title="用户详情"
            data={{ id: "1", lastName: "张", firstName: "三" }}
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

        <DocsDemo title="删除与工具栏上下文" code={removeDemoCode}>
          <Paragraph class="mb-3 text-sm text-slate-600 dark:text-slate-400">
            数据源提供 <code class="text-xs">remove</code>{" "}
            时，工具栏默认出现删除（确认后删当前记录）。自定义按钮的{" "}
            <code class="text-xs">show</code>／
            <code class="text-xs">disable</code>／
            <code class="text-xs">action</code> 会收到{" "}
            <code class="text-xs">&#123; record &#125;</code>。
          </Paragraph>
          <DataView
            panelKey="demo-data-view-remove"
            title="用户详情"
            id="1"
            data={DEMO_USER}
            dataSource={removeDemoSource}
            view={{
              labelColPercent: 28,
              labelMinWidth: "7rem",
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
              title: (row) => `编辑 · ${row.name ?? ""}`,
              props: [
                { prop: "name", label: "姓名", required: true },
                { prop: "email", label: "邮箱" },
              ],
            }}
            toolbar={{
              sayName: {
                icon: <IconUser />,
                title: "读当前记录",
                label: "读当前记录",
                action: ({ record }) => {
                  toast.info(
                    record?.name ? `当前：${String(record.name)}` : "暂无记录",
                  );
                },
              },
              update: true,
              remove: true,
              refresh: true,
              print: false,
              import: false,
              export: false,
              fullscreen: false,
              copy: false,
            }}
          />
        </DocsDemo>

        <div id="tab">
          <DocsDemo
            title="Tab"
            code={`import { DataView } from "@dreamer/ui-view/data-display";

const user = {
  id: "1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  status: "active",
  createdAt: "2026-11-10 10:30:00",
};

<DataView
  panelKey="demo-data-view-tabs"
  title="用户详情"
  data={user}
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
/>`}
          >
            <Paragraph class="mb-3 text-sm text-slate-600 dark:text-slate-400">
              标签放在工具栏左边的空位，和右侧按钮同一行。未写{" "}
              <code>children</code>{" "}
              的「基本信息」仍显示原来的字段明细；「其他」是自定义内容。点击会写入
              {" "}
              <code>?tab=</code>，用这个地址打开会激活对应标签。走 API
              时，详情／刷新／导入／更新等请求都会带上当前{" "}
              <code>tab</code>；没有 tabs
              时不带这个参数。切换标签会重新拉数，已请求过的相同标签+id
              走缓存；刷新只作废当前标签的缓存。
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
          组件接收以下属性。下面把用到的具名类型（如{" "}
          <code>ViewConfig</code>／<code>FormConfig</code>／
          <code>ViewToolbarConfig</code>／<code>ActionCtrl</code>
          ）的字段也全部写出。
        </Paragraph>
        <DocsApiTable rows={DATA_VIEW_API} />
        <Title level={3}>命令式 API（panelKey）</Title>
        <DocsApiTable rows={VIEW_HANDLE_API} nameColumnHeader="方法" />
        <DocsTypeApiSections ids={DATA_VIEW_TYPE_IDS} />
      </section>

      <DocsMessagesSection
        interfaceName="Messages"
        defaultExportName="defaultDataPanelMessages"
        rows={MESSAGES_DATA_PANEL}
      />
    </div>
  );
}
