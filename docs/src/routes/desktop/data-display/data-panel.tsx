/**
 * DataPanel 数据面板文档页（概述、引入、示例、messages、API）
 * 路由: /desktop/data-display/data-panel
 */

import { CodeBlock, DataPanel, Paragraph, Title } from "@dreamer/ui-view";
import type { DataPanelDataSource } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import {
  CELL_COLUMNS,
  cellDemoState,
  createCellDemoSource,
  createRemoteDemoSource,
  DEMO_COLUMNS,
  DEMO_FORM,
  DEMO_SEARCH,
  DEMO_STATUS_VALUES,
  makeDemoRows,
} from "../../../data/data-panel-demo.ts";

const DATA_PANEL_API: DocsApiTableRow[] = [
  {
    name: "title",
    type: "string",
    default: "-",
    description: "卡片标题（必填）",
  },
  {
    name: "columns",
    type: "DataPanelColumn[]",
    default: "-",
    description:
      "列定义：prop / label / type(text|number|money|datetime|tag|bool|image|link) / sortable / width / options / inline(switch|text|number|textarea|date|datetime|select|multiselect) / total / hidden / noExport（必填）",
  },
  {
    name: "data",
    type: "DataPanelRow[]",
    default: "-",
    description:
      "本地数据：内置本地数据源，过滤 / 排序 / 分页 / 合计 / 增删改全在内存完成，首帧同步渲染（SSR 友好）",
  },
  {
    name: "dataSource",
    type: "DataPanelDataSource",
    default: "-",
    description:
      "自定义数据源（优先于 data）：list(query) 必需；create / update / remove / setField / importRows 按需提供，缺省的能力会自动隐藏对应按钮",
  },
  {
    name: "onDataChange",
    type: "(rows) => void",
    default: "-",
    description: "data 模式下数据变化回调",
  },
  {
    name: "search",
    type: "DataPanelSearchField[]",
    default: "[]",
    description: "搜索项（text / select / date）；为空则不显示搜索按钮",
  },
  {
    name: "form",
    type: "DataPanelFormField[]",
    default: "[]",
    description:
      "新增 / 编辑 Modal 表单项：text / textarea / number / select / multiselect / switch / password / date / datetime，支持 required / min / max / pattern / createOnly / editOnly",
  },
  {
    name: "panelKey",
    type: "string",
    default: '"data-panel"',
    description:
      "面板标识：列偏好 localStorage 键、refreshDataPanel(key)；同页多个面板需唯一",
  },
  { name: "rowKey", type: "string", default: '"id"', description: "主键字段" },
  {
    name: "pageSize / pageSizes",
    type: "number / number[]",
    default: "10 / [10,20,50,100]",
    description: "默认每页条数与可选项",
  },
  {
    name: "defaultSort",
    type: "{ prop; order: 'asc'|'desc' }",
    default: "-",
    description: "默认排序；表头第三次点击回到它",
  },
  {
    name: "fixed",
    type: "Record<string,string>",
    default: "-",
    description: "固定过滤，并入每次查询",
  },
  {
    name: "initial / initialQuery",
    type: "DataPanelListResult / Partial<DataPanelQuery>",
    default: "-",
    description: "服务端预取首屏 / 初始查询（有 initial 时挂载后不再请求）",
  },
  {
    name: "statusField / statusValues",
    type: "string / {value,label}[]",
    default: "-",
    description: "批量「设为…」按钮（需 dataSource.setField）",
  },
  {
    name: "caps",
    type: "Partial<DataPanelCaps>",
    default: "按数据源推断",
    description:
      "能力开关：create / update / view / remove / batchStatus / import / export / print / columns",
  },
  {
    name: "locale",
    type: '"zh-CN" | "en-US"',
    default: '"zh-CN"',
    description: "界面语言",
  },
  {
    name: "messages",
    type: "Partial<DataPanelMessages>",
    default: "-",
    description: "覆盖文案",
  },
  {
    name: "exportName",
    type: "string",
    default: "title",
    description: "导出文件名（不含扩展名，自动追加日期）",
  },
  {
    name: "onExport",
    type: "(format, ctx) => void",
    default: "-",
    description:
      "接管导出（如调用服务端接口）；缺省时面板分页拉取全部行并在浏览器生成文件",
  },
  {
    name: "onImportRows",
    type: "(rows) => void",
    default: "-",
    description: "接管导入；缺省走 dataSource.importRows",
  },
  {
    name: "onCreate / onEdit / onView",
    type: "function",
    default: "-",
    description: "替换内置 Modal 表单 / 详情",
  },
  {
    name: "renderCell",
    type: "Record<string, (row) => unknown>",
    default: "-",
    description: "按列自定义单元格",
  },
  {
    name: "rowExtra / toolbarExtra",
    type: "function / unknown",
    default: "-",
    description: "操作列额外按钮 / 工具栏左侧额外内容",
  },
  {
    name: "selectable",
    type: "boolean",
    default: "true",
    description: "是否显示选择列与批量条（有删除或批量状态能力时）",
  },
  {
    name: "syncUrl",
    type: "boolean",
    default: "false",
    description: "把查询写入地址栏（history.replaceState）",
  },
  {
    name: "onChanged",
    type: "() => void",
    default: "-",
    description: "任一写操作成功后回调",
  },
  {
    name: "class",
    type: "string",
    default: "-",
    description: "额外 class（加在卡片上）",
  },
  {
    name: "children",
    type: "unknown",
    default: "-",
    description: "面板根节点内的额外内容",
  },
];

const SOURCE_API: DocsApiTableRow[] = [
  {
    name: "list(query)",
    type: "DataPanelListResult | Promise<…>",
    default: "-",
    description:
      "返回当前页 { rows, total, totals? }；query = { page, pageSize, sort, order(1|-1), filters }",
  },
  {
    name: "sync",
    type: "boolean",
    default: "false",
    description: "list 同步返回时置 true：首帧（含 SSR）直接渲染",
  },
  {
    name: "create(values)",
    type: "DataPanelWriteResult",
    default: "-",
    description:
      "返回 void / { ok:true } 表示成功；{ ok:false, message?, fields?, messages? } 把错误回填到表单；抛错也会提示",
  },
  {
    name: "update(id, values)",
    type: "DataPanelWriteResult",
    default: "-",
    description: "编辑保存；行内编辑在没有 setField 时也走它",
  },
  {
    name: "remove(ids)",
    type: "{ removed, failed[] }",
    default: "-",
    description:
      "删除；面板保证只在用户确认后才会调用（行内删除为按钮上方的小气泡「确定删除xxx？」，批量删除为确认对话框）",
  },
  {
    name: "setField(ids, field, value)",
    type: "{ removed, failed[] }",
    default: "-",
    description: "批量状态 / 行内编辑",
  },
  {
    name: "importRows(rows)",
    type: "{ created, failed }",
    default: "-",
    description: "导入 CSV / JSON 解析后的行",
  },
];

const importCode = `import { DataPanel } from "@dreamer/ui-view";
// 或 import { DataPanel } from "@dreamer/ui-view/data-display";

<DataPanel
  title="用户管理"
  panelKey="users"
  data={rows}
  columns={columns}
  search={search}
  form={form}
/>`;

const columnsCode = `const columns: DataPanelColumn[] = [
  { prop: "name", label: "姓名", sortable: true, inline: "text" },
  { prop: "role", label: "角色", type: "tag", options: [
    { value: "admin", label: "管理员", tone: "danger" },
    { value: "viewer", label: "访客" },
  ] },
  { prop: "status", label: "状态", type: "tag", inline: "switch", options: [
    { value: "active", label: "启用", tone: "success" },
    { value: "disabled", label: "停用", tone: "warning" },
  ] },
  { prop: "balance", label: "余额", type: "money", sortable: true, total: true },
  { prop: "createdAt", label: "创建时间", type: "datetime", hidden: true },
];`;

const basicCode = `<DataPanel
  panelKey="demo-basic"
  title="用户管理"
  data={rows}
  columns={columns}
  search={search}
  form={form}
  statusField="status"
  statusValues={[{ value: "active", label: "启用" }, { value: "disabled", label: "停用" }]}
/>`;

const searchCode = `const search: DataPanelSearchField[] = [
  { name: "name", label: "姓名" },                       // 文本：包含匹配
  { name: "role", label: "角色", type: "select", options: [...] },
];
<DataPanel title="用户" data={rows} columns={columns} search={search}
  initialQuery={{ filters: { role: "admin" } }} />  // 有初始筛选时，打开搜索 Modal 会带出这些值；提交即搜索，重置即清空`;

const tableCode = `// 排序：sortable 列表头点击 升序 → 降序 → 默认排序
// 合计行：total: true；隐藏列：hidden: true（列设置里可打开，偏好保存在 localStorage）
// 行内编辑：inline: "switch" 直接切换；inline: "text" | "number" 双击编辑，Enter/失焦保存，Esc 取消
// 行 locked: true：不可选择、不可删除、不可行内编辑
// 行内编辑需要可写：提供 form（或 onDataChange / dataSource.update）
<DataPanel title="表格" data={rows} columns={columns} form={form}
  defaultSort={{ prop: "balance", order: "desc" }} />`;

const crudCode =
  `// 新增 / 编辑 / 查看都用 Modal；删除一律先确认（行内：图标上方的小气泡 Popconfirm；批量：确认对话框），确认后才调用 dataSource.remove
<DataPanel title="CRUD" data={rows} columns={columns} form={form}
  onDataChange={(next) => console.log(next)} />

const form: DataPanelFormField[] = [
  { name: "name", label: "姓名", required: true },
  { name: "email", label: "邮箱", required: true, pattern: "^[^@\\\\s]+@[^@\\\\s]+$" },
  { name: "balance", label: "余额", type: "number", min: 0 },
  { name: "status", label: "启用", type: "switch", onOff: ["active", "disabled"] },
];`;

const batchCode =
  `// 勾选多行 → 批量条出现：批量设为 / 批量删除（都需确认）/ 取消选择
<DataPanel title="批量" data={rows} columns={columns}
  statusField="status" statusValues={[{ value: "active", label: "启用" }, { value: "disabled", label: "停用" }]} />`;

const pageCode =
  `// 每页条数下拉、上一页 / 下一页、页码（带省略号）、跳页输入框，范围文案「第 a-b 条，共 n 条」
<DataPanel title="分页" data={rows} columns={columns} pageSize={5} pageSizes={[5, 10, 20]} />`;

const exportCode =
  `// 工具栏「导出」：xlsx（原生 OOXML）/ csv / json / xml / html，只导出当前可见列，导出全部匹配行
// 工具栏「导入」：选择 .csv / .json，表头可为列文案或字段名
<DataPanel title="导出导入" data={rows} columns={columns} exportName="users" />

// 也可只用导出函数
import { buildExportFile } from "@dreamer/ui-view";
const file = buildExportFile({ format: "xlsx", title: "用户", basename: "users", columns, rows, messages });
// file = { filename, mime, data: Uint8Array | string }`;

const cellCode = `// 单元格编辑：column.inline 指定编辑器类型，双击进入编辑
//   text / number / textarea / date / datetime / select（单选，需 options）/ multiselect（多选，需 options）
//   switch：点击即切换；失焦或 Enter 保存并回到展示态；Esc 取消并恢复原值
//   保存失败（dataSource.setField / update 返回失败）：弹出错误提示并保持原值
const columns: DataPanelColumn[] = [
  { prop: "name", label: "姓名", inline: "text" },
  { prop: "score", label: "积分", type: "number", inline: "number" },
  { prop: "role", label: "角色", type: "tag", inline: "select", options: roleOptions },
  { prop: "tags", label: "标签", type: "tag", inline: "multiselect", options: tagOptions },
  { prop: "status", label: "状态", type: "tag", inline: "switch", options: [on, off] },
  { prop: "birthday", label: "生日", type: "date", inline: "date" },
  { prop: "loginAt", label: "最近登录", type: "datetime", inline: "datetime" },
  { prop: "remark", label: "备注", inline: "textarea" },
];
<DataPanel title="单元格编辑" dataSource={source} columns={columns} />`;

const remoteCode = `const source: DataPanelDataSource = {
  async list(q) {
    const r = await fetch("/api/users?" + new URLSearchParams({ page: String(q.page), pageSize: String(q.pageSize), sort: q.sort, order: q.order === 1 ? "asc" : "desc", ...q.filters }));
    return await r.json(); // { rows, total, totals? }
  },
  async create(values) { await fetch("/api/users", { method: "POST", body: JSON.stringify(values) }); },
  async update(id, values) { /* ... */ },
  async remove(ids) { return await (await fetch("/api/users/remove", { method: "POST", body: JSON.stringify({ ids }) })).json(); },
};
<DataPanel title="远程数据" dataSource={source} columns={columns} search={search} form={form} />`;

const themeCode =
  `// 浅色 / 深色：跟随根节点 .dark；深色面板主体用 CSS 变量 --dp-panel-body-bg（默认 #18212f）
// 工具栏按钮组：浅色灰白、深色 slate，相邻按钮只有一条淡分割线
<div class="dark"> <DataPanel ... /> </div>`;

const localeCode =
  `<DataPanel locale="en-US" title="Users" data={rows} columns={columns} search={search} form={form} />
// 覆盖部分文案
<DataPanel messages={{ create: "新建", deleteTitle: "删除确认" }} ... />`;

const customCode = `<DataPanel title="自定义" data={rows} columns={columns}
  renderCell={{ name: (row) => <b>{String(row.name)}</b> }}
  rowExtra={(row) => <button type="button">详情 {String(row.id)}</button>}
  toolbarExtra={<span>自定义工具栏内容</span>} />`;

/** 单个示例块 */
function Demo(props: { title: string; code: string; children?: unknown }) {
  return (
    <div class="space-y-4">
      <Title level={3}>{props.title}</Title>
      {props.children}
      <CodeBlock
        title="代码示例"
        code={props.code}
        language="tsx"
        showLineNumbers
        copyable
        wrapLongLines
      />
    </div>
  );
}

export default function DataDisplayDataPanel() {
  const remote: DataPanelDataSource = createRemoteDemoSource(300);
  const cellSource: DataPanelDataSource = createCellDemoSource();
  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>DataPanel 数据面板</Title>
        <Paragraph class="mt-2">
          一块完整的列表管理面板：工具栏按钮组（添加 / 搜索 / 刷新 / 打印 / 导入
          / 导出 / 列设置， 相邻按钮之间只有一条淡分割线）、搜索
          Modal（工具栏按钮打开）、表格下方的批量操作条、表格（排序、多选、行内编辑、合计、操作列）、
          分页，以及用 Modal 的新增 / 编辑 / 查看。<strong>
            任何删除都必须先确认：行内删除弹出小气泡「确定删除xxx？」（红色「删除」+「取消」，点外部也会关闭），批量删除使用确认对话框
          </strong>。 支持原生 xlsx 导出（零依赖），支持浅色 / 深色主题与 zh-CN
          / en-US。数据通过 <code>data</code> 或 <code>dataSource</code>{" "}
          注入，与后端无关。
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
        <CodeBlock
          title="列定义"
          code={columnsCode}
          language="tsx"
          showLineNumbers
          wrapLongLines
        />
      </section>

      <section class="space-y-8">
        <Title level={2}>示例</Title>

        <Demo title="基础用法（全部功能）" code={basicCode}>
          <DataPanel
            panelKey="demo-basic"
            title="用户管理"
            data={makeDemoRows(25)}
            columns={DEMO_COLUMNS}
            search={DEMO_SEARCH}
            form={DEMO_FORM}
            statusField="status"
            statusValues={DEMO_STATUS_VALUES}
            exportName="users"
          />
        </Demo>

        <Demo title="搜索表单（Modal）" code={searchCode}>
          <DataPanel
            panelKey="demo-search"
            title="搜索表单"
            data={makeDemoRows(25)}
            columns={DEMO_COLUMNS}
            search={DEMO_SEARCH}
            initialQuery={{ filters: { role: "admin" } }}
            caps={{ create: false }}
          />
        </Demo>

        <Demo title="表格：排序 / 合计 / 行内编辑 / 隐藏列" code={tableCode}>
          <DataPanel
            panelKey="demo-table"
            title="表格功能"
            data={makeDemoRows(12)}
            columns={DEMO_COLUMNS}
            defaultSort={{ prop: "balance", order: "desc" }}
            form={DEMO_FORM}
            statusField="status"
            caps={{ create: false, remove: false }}
          />
        </Demo>

        <Demo title="单元格编辑" code={cellCode}>
          <label class="mb-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              data-testid="cell-demo-fail"
              onChange={(e: Event) => {
                cellDemoState.fail =
                  (e.target as unknown as { checked: boolean }).checked;
              }}
            />
            模拟保存失败（勾选后再编辑：提示错误并保持原值）
          </label>
          <DataPanel
            panelKey="demo-cell"
            title="单元格编辑"
            dataSource={cellSource}
            columns={CELL_COLUMNS}
            caps={{
              create: false,
              remove: false,
              import: false,
              export: false,
              print: false,
              columns: false,
            }}
          />
        </Demo>

        <Demo title="新增 / 编辑 Modal 与删除确认" code={crudCode}>
          <DataPanel
            panelKey="demo-crud"
            title="CRUD"
            data={makeDemoRows(8)}
            columns={DEMO_COLUMNS}
            form={DEMO_FORM}
          />
        </Demo>

        <Demo title="批量操作" code={batchCode}>
          <DataPanel
            panelKey="demo-batch"
            title="批量操作"
            data={makeDemoRows(10)}
            columns={DEMO_COLUMNS}
            form={DEMO_FORM}
            statusField="status"
            statusValues={DEMO_STATUS_VALUES}
          />
        </Demo>

        <Demo title="分页" code={pageCode}>
          <DataPanel
            panelKey="demo-page"
            title="分页"
            data={makeDemoRows(40)}
            columns={DEMO_COLUMNS}
            pageSize={5}
            pageSizes={[5, 10, 20]}
            caps={{ create: false }}
          />
        </Demo>

        <Demo
          title="导出 xlsx / csv / json / xml / html 与导入"
          code={exportCode}
        >
          <DataPanel
            panelKey="demo-export"
            title="导出导入"
            data={makeDemoRows(15)}
            columns={DEMO_COLUMNS}
            form={DEMO_FORM}
            exportName="users"
          />
        </Demo>

        <Demo title="远程数据源（异步）" code={remoteCode}>
          <DataPanel
            panelKey="demo-remote"
            title="远程数据"
            dataSource={remote}
            columns={DEMO_COLUMNS}
            search={DEMO_SEARCH}
            form={DEMO_FORM}
            statusField="status"
            statusValues={DEMO_STATUS_VALUES}
          />
        </Demo>

        <Demo title="深色主题" code={themeCode}>
          <div class="dark rounded-lg bg-slate-900 p-3">
            <DataPanel
              panelKey="demo-dark"
              title="深色面板"
              data={makeDemoRows(6)}
              columns={DEMO_COLUMNS}
              search={DEMO_SEARCH}
              form={DEMO_FORM}
            />
          </div>
        </Demo>

        <Demo title="多语言与文案覆盖" code={localeCode}>
          <DataPanel
            panelKey="demo-locale"
            locale="en-US"
            title="Users"
            data={makeDemoRows(6).map((r) => ({ ...r }))}
            columns={DEMO_COLUMNS.map((c) => ({
              ...c,
              label: ({
                name: "Name",
                email: "Email",
                role: "Role",
                status: "Status",
                balance: "Balance",
                score: "Score",
                createdAt: "Created",
              } as Record<string, string>)[c.prop] ?? c.label,
            }))}
            search={[{ name: "name", label: "Name" }]}
            form={DEMO_FORM.map((f) => ({ ...f }))}
            messages={{ create: "New" }}
          />
        </Demo>

        <Demo title="自定义单元格 / 操作列 / 工具栏" code={customCode}>
          <DataPanel
            panelKey="demo-custom"
            title="自定义"
            data={makeDemoRows(5)}
            columns={DEMO_COLUMNS}
            caps={{ create: false }}
            renderCell={{
              name: (row) => (
                <b data-testid="demo-custom-name">{String(row.name)}</b>
              ),
            }}
            rowExtra={(row) => (
              <span
                class="mr-1 text-xs text-slate-500"
                data-testid="demo-custom-extra"
              >
                #{String(row.id)}
              </span>
            )}
            toolbarExtra={
              <span class="mr-auto text-sm text-slate-500">
                自定义工具栏内容
              </span>
            }
          />
        </Demo>
      </section>

      <section class="space-y-3">
        <Title level={2}>API</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          DataPanel 属性。
        </Paragraph>
        <DocsApiTable rows={DATA_PANEL_API} />
      </section>

      <section class="space-y-3">
        <Title level={2}>数据源（DataPanelDataSource）</Title>
        <DocsApiTable rows={SOURCE_API} nameColumnHeader="方法" />
      </section>
    </div>
  );
}
