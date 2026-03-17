/**
 * Table 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/data-display/table
 */

import { createSignal } from "@dreamer/view";
import { CodeBlock, Paragraph, Table, Title } from "@dreamer/ui-view";

type Row = { key: string; name: string; age: number; address: string };

/** API 属性行类型 */
interface ApiRow {
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
    name: "rowSelection",
    type: "object",
    default: "-",
    description: "行选择配置",
  },
  {
    name: "rowClassName",
    type: "(record, index) => string",
    default: "-",
    description: "行 class",
  },
  {
    name: "headerClass",
    type: "string",
    default: "-",
    description: "表头 class",
  },
  { name: "class", type: "string", default: "-", description: "表格 class" },
];

const importCode = `import { Table } from "@dreamer/ui-view";

const columns = [{ key: "name", title: "姓名", dataIndex: "name" }, ...];
const dataSource = [{ key: "1", name: "张三", age: 28 }, ...];
<Table columns={columns} dataSource={dataSource} bordered />`;

const exampleBasic =
  `<Table<Row> columns={columns} dataSource={dataSource} bordered expandable={{ expandedRowKeys, onExpand, expandedRowRender: (record) => <p>详情：{record.address}</p> }} />`;

const exampleSizeStripedLoading =
  `<Table columns={columns} dataSource={dataSource} size="sm" striped />
<Table columns={columns} dataSource={[]} loading />`;

const exampleRowSelection =
  `<Table columns={columns} dataSource={dataSource} rowSelection={{ selectedRowKeys: selectedKeys(), onChange: (keys) => setSelectedKeys(keys) }} />`;

export default function DataDisplayTable() {
  const [expandedKeys, setExpandedKeys] = createSignal<string[]>([]);
  const [selectedKeys, setSelectedKeys] = createSignal<string[]>([]);

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
          表格：columns、dataSource、rowKey、bordered、size、striped、loading、onRow、expandable、summary、rowSelection、rowClassName、headerClass。
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
          <Title level={3}>基础 + 边框 + 展开行</Title>
          <Table<Row>
            columns={columns}
            dataSource={dataSource}
            bordered
            expandable={{
              expandedRowKeys: expandedKeys(),
              onExpand: (expanded, record) => {
                setExpandedKeys(
                  expanded
                    ? [...expandedKeys(), record.key]
                    : expandedKeys().filter((k) => k !== record.key),
                );
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
          <Title level={3}>rowSelection 行选择</Title>
          <Table<Row>
            columns={columns}
            dataSource={dataSource}
            rowSelection={{
              selectedRowKeys: selectedKeys(),
              onChange: (keys) => setSelectedKeys(keys as string[]),
            }}
          />
          <p class="text-sm text-slate-500">
            已选行 key: {selectedKeys().join(", ") || "-"}
          </p>
          <CodeBlock
            title="代码示例"
            code={exampleRowSelection}
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
              {TABLE_API.map((row) => (
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
