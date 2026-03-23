/**
 * Table 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/data-display/table
 */

import {
  Button,
  ButtonGroup,
  CodeBlock,
  Paragraph,
  Table,
  Title,
} from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

type Row = { key: string; name: string; age: number; address: string };

/** API 属性行类型（extends Record 以满足 Table 泛型约束） */
interface ApiRow extends Record<string, unknown> {
  name: string;
  type: string;
  default: string;
  description: string;
}

const TABLE_API: ApiRow[] = [
  {
    name: "columns",
    type: "TableColumn<T>[]",
    default: "-",
    description: "列定义",
  },
  { name: "dataSource", type: "T[]", default: "-", description: "数据源" },
  {
    name: "rowKey",
    type: "keyof T | string | ((record, index) => string)",
    default: "-",
    description: "行 key 字段或函数",
  },
  {
    name: "bordered",
    type: "boolean",
    default: "false",
    description: "是否显示边框",
  },
  { name: "size", type: "SizeVariant", default: "-", description: "尺寸" },
  {
    name: "striped",
    type: "boolean",
    default: "false",
    description: "是否条纹行",
  },
  { name: "loading", type: "boolean", default: "false", description: "加载态" },
  {
    name: "onRow",
    type: "(record, index) => { onClick? }",
    default: "-",
    description: "行点击",
  },
  {
    name: "expandable",
    type: "object",
    default: "-",
    description: "可展开行配置",
  },
  {
    name: "summary",
    type: "(data) => unknown",
    default: "-",
    description: "表尾合计行",
  },
  {
    name: "locale",
    type: "{ emptyText?: string }",
    default: "-",
    description: "文案配置，如空状态文案 emptyText",
  },
  {
    name: "renderEmpty",
    type: "() => unknown",
    default: "-",
    description:
      "自定义空状态渲染（无数据时）；不传则用 locale.emptyText 或「暂无数据」",
  },
  {
    name: "title",
    type: "unknown",
    default: "-",
    description: "表格上方标题",
  },
  {
    name: "extra",
    type: "unknown",
    default: "-",
    description: "表格上方右侧区域（筛选、导出等）",
  },
  {
    name: "pagination",
    type: "false | { current?, pageSize?, total?, onChange? }",
    default: "-",
    description:
      "分页配置；false 不显示；对象时显示分页条并支持 current/pageSize/total/onChange",
  },
  {
    name: "onSelectChange",
    type: "(selectedRows: T[]) => void",
    default: "-",
    description: "选中变化时回调选中的整行数据；传了则显示选择列",
  },
  {
    name: "selectedRowKeys",
    type: "string[]",
    default: "-",
    description: "受控时的选中行 key 列表",
  },
  {
    name: "selectionType",
    type: '"checkbox" | "radio"',
    default: "checkbox",
    description: "选择列类型",
  },
  {
    name: "getCheckboxProps",
    type: "(record: T) => { disabled?: boolean }",
    default: "-",
    description: "某行是否禁用勾选",
  },
  {
    name: "rowClassName",
    type: "(record, index) => string",
    default: "-",
    description: "行 class",
  },
  {
    name: "hoverable",
    type: "boolean",
    default: "false",
    description: "是否开启行悬停高亮",
  },
  {
    name: "headerClass",
    type: "string",
    default: "-",
    description: "表头 class",
  },
  { name: "class", type: "string", default: "-", description: "表格 class" },
];

/** API 表格列定义（属性、类型、默认值、说明） */
const apiColumns = [
  {
    key: "name",
    title: "属性",
    dataIndex: "name" as const,
    render: (_: unknown, r: ApiRow) => (
      <span class="font-mono text-slate-700 dark:text-slate-300">{r.name}</span>
    ),
  },
  {
    key: "type",
    title: "类型",
    dataIndex: "type" as const,
    render: (_: unknown, r: ApiRow) => (
      <span class="text-slate-600 dark:text-slate-400">{r.type}</span>
    ),
  },
  {
    key: "default",
    title: "默认值",
    dataIndex: "default" as const,
    render: (_: unknown, r: ApiRow) => (
      <span class="text-slate-600 dark:text-slate-400">{r.default}</span>
    ),
  },
  {
    key: "description",
    title: "说明",
    dataIndex: "description" as const,
    render: (_: unknown, r: ApiRow) => (
      <span class="text-slate-600 dark:text-slate-400">{r.description}</span>
    ),
  },
];

const importCode = `import { Table } from "@dreamer/ui-view";

const columns = [{ key: "name", title: "姓名", dataIndex: "name" }, ...];
const dataSource = [{ key: "1", name: "张三", age: 28 }, ...];
<Table
  columns={columns}
  dataSource={dataSource}
  bordered
/>`;

const exampleBasic = `<Table<Row>
  columns={columns}
  dataSource={dataSource}
  bordered
  expandable={{
    expandedRowKeys,
    onExpand,
    expandedRowRender: (record) => <p>详情：{record.address}</p>,
  }}
/>`;

const exampleSizeStripedLoading = `<Table
  columns={columns}
  dataSource={dataSource}
  size="sm"
  striped
/>
<Table columns={columns} dataSource={[]} loading />`;

const exampleRowSelection = `<Table
  columns={columns}
  dataSource={dataSource}
  onSelectChange={(rows) => selectedRows.value = rows}
/>`;

const exampleEmpty = `<Table
  columns={columns}
  dataSource={[]}
  locale={{ emptyText: "暂无数据" }}
/>
<Table columns={columns} dataSource={[]} renderEmpty={() => <span>自定义空状态</span>} />`;

const exampleTitleExtra = `<Table
  columns={columns}
  dataSource={dataSource}
  title="用户列表"
  extra={
    <ButtonGroup>
      <Button variant="default" size="sm" onClick={() => refresh()}>刷新</Button>
      <Button variant="primary" size="sm" onClick={() => exportData()}>导出</Button>
    </ButtonGroup>
  }
/>`;

const examplePagination = `<Table
  columns={columns}
  dataSource={dataSource}
  pagination={{ pageSize: 5, onChange: (page) => console.log(page) }}
/>`;

const exampleFixedColumn = `<Table
  columns={[
    { key: "name", title: "姓名", dataIndex: "name", width: 100, fixed: "left" },
    { key: "age", title: "年龄", dataIndex: "age" },
    { key: "address", title: "地址", dataIndex: "address" },
  ]}
  dataSource={dataSource}
/>`;

export default function DataDisplayTable() {
  const expandedKeys = createSignal<string[]>([]);
  const selectedRows = createSignal<Row[]>([]);
  const page = createSignal(1);

  const columns = [
    { key: "name", title: "姓名", dataIndex: "name" as const },
    { key: "age", title: "年龄", dataIndex: "age" as const },
    { key: "address", title: "地址", dataIndex: "address" as const },
  ];

  const dataSource: Row[] = [
    { key: "1", name: "张三", age: 28, address: "北京" },
    { key: "2", name: "李四", age: 32, address: "上海" },
  ];

  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>Table 表格</Title>
        <Paragraph class="mt-2">
          表格：columns、dataSource、rowKey、bordered、size、striped、loading、onRow、expandable、summary、locale、renderEmpty、title、extra、pagination、onSelectChange、rowClassName、headerClass、固定列
          fixed。 使用 Tailwind v4，支持 light/dark 主题。
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
          <Title level={3}>基础 + 边框 + 展开行</Title>
          <Table<Row>
            columns={columns}
            dataSource={dataSource}
            bordered
            stateKey="table-doc-expand"
            expandable={{
              // 不传 expandedRowKeys 时使用 Table 内部展开态；stateKey 避免整树重渲染丢失展开态
              onExpand: (expanded, record) => {
                expandedKeys.value = expanded
                  ? [...expandedKeys.value, record.key]
                  : expandedKeys.value.filter((k) => k !== record.key);
              },
              expandedRowRender: (record) => (
                <p class="text-sm text-slate-500">详情：{record.address}</p>
              ),
            }}
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
          <Title level={3}>size / striped / loading</Title>
          <Table<Row>
            columns={columns}
            dataSource={dataSource}
            size="sm"
            striped
          />
          <Table<Row> columns={columns} dataSource={[]} loading />
          <CodeBlock
            title="代码示例"
            code={exampleSizeStripedLoading}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>行选择 onSelectChange</Title>
          <Table<Row>
            columns={columns}
            dataSource={dataSource}
            stateKey="table-doc-row-selection"
            onSelectChange={(rows) => selectedRows.value = rows}
          />
          {() => (
            <p class="text-sm text-slate-500">
              已选行: {selectedRows.value.length
                ? selectedRows.value.map((r) => r.name).join("、")
                : "-"}
            </p>
          )}
          <CodeBlock
            title="代码示例"
            code={exampleRowSelection}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>空状态 locale / renderEmpty</Title>
          <Table<Row>
            columns={columns}
            dataSource={[]}
            locale={{ emptyText: "暂无数据" }}
          />
          <Table<Row>
            columns={columns}
            dataSource={[]}
            renderEmpty={() => <span class="text-slate-500">自定义空状态</span>}
          />
          <CodeBlock
            title="代码示例"
            code={exampleEmpty}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>标题与工具栏 title / extra</Title>
          <Table<Row>
            columns={columns}
            dataSource={dataSource}
            title="用户列表"
            extra={
              <ButtonGroup attached>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => console.log("刷新")}
                >
                  刷新
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => console.log("导出")}
                >
                  导出
                </Button>
              </ButtonGroup>
            }
          />
          <CodeBlock
            title="代码示例"
            code={exampleTitleExtra}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>分页 pagination</Title>
          <Table<Row>
            columns={columns}
            dataSource={[
              ...dataSource,
              { key: "3", name: "王五", age: 25, address: "广州" },
              { key: "4", name: "赵六", age: 30, address: "深圳" },
              { key: "5", name: "钱七", age: 22, address: "杭州" },
            ]}
            pagination={{
              current: page.value,
              pageSize: 2,
              onChange: (p) => page.value = p,
            }}
          />
          <CodeBlock
            title="代码示例"
            code={examplePagination}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>固定列 fixed</Title>
          <div class="max-w-md overflow-x-auto border border-slate-200 dark:border-slate-600 rounded-lg">
            <Table<Row>
              columns={[
                {
                  key: "name",
                  title: "姓名",
                  dataIndex: "name" as const,
                  width: 100,
                  fixed: "left",
                },
                {
                  key: "age",
                  title: "年龄",
                  dataIndex: "age" as const,
                },
                {
                  key: "address",
                  title: "地址",
                  dataIndex: "address" as const,
                  width: 180,
                },
              ]}
              dataSource={dataSource}
              bordered
            />
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleFixedColumn}
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
          TableColumn：key、title、dataIndex、render、width、align、fixed、sorter、ellipsis。Table
          属性如下。
        </Paragraph>
        <div class="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-600">
          <Table<ApiRow>
            columns={apiColumns}
            dataSource={TABLE_API}
            rowKey="name"
            bordered
            striped
            hoverable
            size="md"
            class="min-w-lg text-sm"
            headerClass="border-b border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/80"
            rowClassName={() =>
              "border-b border-slate-100 dark:border-slate-700 last:border-b-0"}
          />
        </div>
      </section>
    </div>
  );
}
