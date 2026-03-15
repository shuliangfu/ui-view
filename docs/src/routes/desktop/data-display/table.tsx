/** 路由: /data-display/table */
import { createSignal } from "@dreamer/view";
import { Paragraph, Table, Title } from "@dreamer/ui-view";

type Row = { key: string; name: string; age: number; address: string };

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
    <div class="space-y-6">
      <Title level={1}>Table</Title>
      <Paragraph>
        表格：columns、dataSource、rowKey、bordered、size、striped、loading、onRow、expandable、summary、rowSelection、rowClassName、headerClass。
      </Paragraph>

      <Title level={2}>基础 + 边框 + 展开行</Title>
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

      <Title level={2}>size / striped / loading</Title>
      <Table<Row>
        columns={columns}
        dataSource={dataSource}
        size="sm"
        striped
      />
      <Table<Row>
        columns={columns}
        dataSource={[]}
        loading
      />

      <Title level={2}>rowSelection 行选择</Title>
      <Table<Row>
        columns={columns}
        dataSource={dataSource}
        rowSelection={{
          selectedRowKeys: selectedKeys(),
          onChange: (keys, rows) => setSelectedKeys(keys as string[]),
        }}
      />
      <p class="text-sm text-slate-500">
        已选行 key: {selectedKeys().join(", ") || "-"}
      </p>
    </div>
  );
}
