/** @jsxImportSource @dreamer/view */
/**
 * Table：右侧固定列、scroll、内部分页 pageSizeOptions / showTotal。
 * 泛型不再强制 Record，任意行类型可通过 JSX 传入。
 */
import { describe, expect, it } from "@dreamer/test";
import { renderToString } from "@dreamer/view/ssr";
import { Table } from "../../src/desktop/data-display/Table.tsx";

type Row = { id: string; name: string; age: number; action: string };

const rows: Row[] = [
  { id: "1", name: "Ada", age: 30, action: "编辑" },
  { id: "2", name: "Bob", age: 28, action: "编辑" },
  { id: "3", name: "Cara", age: 41, action: "编辑" },
];

const columns = [
  {
    key: "name",
    title: "姓名",
    dataIndex: "name",
    width: 80,
    fixed: "left" as const,
  },
  { key: "age", title: "年龄", dataIndex: "age", width: 80 },
  {
    key: "action",
    title: "操作",
    dataIndex: "action",
    width: 80,
    fixed: "right" as const,
  },
];

describe("Table flex API", () => {
  it("右侧固定列写出 sticky right，scroll.y 限制高度", async () => {
    const h = String(
      await renderToString(() => (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={rows}
          scroll={{ x: 640, y: 240 }}
        />
      )),
    );
    expect(h.replace(/:\s+/g, ":")).toContain("min-width:640px");
    expect(h.replace(/:\s+/g, ":")).toContain("max-height:240px");
    expect(h.replace(/:\s+/g, ":")).toContain("right:0px");
    expect(h.replace(/:\s+/g, ":")).toContain("left:0px");
  });

  it("pageSizeOptions 渲染条数选择；showTotal=false 隐藏条数摘要", async () => {
    const withOpts = String(
      await renderToString(() => (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 2, pageSizeOptions: [2, 10] }}
        />
      )),
    );
    expect(withOpts).toContain("2 条/页");
    expect(withOpts).toContain("10 条/页");
    expect(withOpts).toContain("第 1–2 条");

    const hidden = String(
      await renderToString(() => (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 2, showTotal: false }}
        />
      )),
    );
    expect(hidden).not.toContain("第 1–2 条");
    expect(hidden).toContain("第 1 / 2 页");
  });
});
