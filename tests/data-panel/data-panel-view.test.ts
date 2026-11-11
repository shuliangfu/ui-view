/**
 * DataPanel view / form / search：`{ title, props }`、字段继承、回落、底部 actions、click toggle。
 */
import { describe, expect, it } from "@dreamer/test";
import {
  enrichViewField,
  fallbackViewItems,
  fieldsOf,
  resolveViewActionsCfg,
  resolveViewFields,
  resolveViewFooterActions,
  toggleOptionValue,
} from "../../src/desktop/data-display/data-panel-utils.ts";
import type {
  Column,
  FormConfig,
  FormField,
  ViewConfig,
} from "../../src/desktop/data-display/data-panel-types.ts";

const COLUMNS: Column[] = [
  { type: "selection" },
  { type: "index" },
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
    format: "YYYY-MM-DD HH:mm",
  },
  { type: "actions", actions: { view: true } },
];

const VIEW: ViewConfig = {
  title: (row) => `详情 · ${row.name}`,
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
      click: "toggle",
    },
    {
      prop: "createdAt",
      label: "创建时间",
      type: "datetime",
      format: "YYYY-MM-DD HH:mm",
    },
  ],
  actions: {
    password: { label: "密码", action: () => {} },
    site: { label: "主页", href: (row) => `/u/${row.id}` },
    close: true,
  },
};

describe("DataPanel view / form / search 配置", () => {
  it("fieldsOf 取出 props；未传则为空", () => {
    expect(fieldsOf(undefined)).toEqual([]);
    expect(fieldsOf(VIEW).map((x) => x.prop ?? x.type)).toEqual([
      "name",
      "email",
      "status",
      "createdAt",
    ]);
    expect(
      typeof VIEW.title === "function"
        ? VIEW.title({ name: "Ada" })
        : VIEW.title,
    )
      .toBe("详情 · Ada");
  });

  it("缺省展示项从同 prop 列继承，也可覆盖", () => {
    const inherited = enrichViewField(
      { prop: "status", click: "toggle" },
      COLUMNS,
    );
    expect(inherited.label).toBe("状态");
    expect(inherited.type).toBe("tag");
    expect(inherited.options?.map((o) => o.value)).toEqual([
      "active",
      "disabled",
    ]);
    expect(inherited.click).toBe("toggle");

    const override = enrichViewField(
      { prop: "name", label: "用户名" },
      COLUMNS,
    );
    expect(override.label).toBe("用户名");
  });

  it("resolveViewFields 只取 props 字段，并按列继承", () => {
    const fields = resolveViewFields(VIEW, COLUMNS)!;
    expect(fields.map((f) => f.prop)).toEqual([
      "name",
      "email",
      "status",
      "createdAt",
    ]);
    expect(fields[2].click).toBe("toggle");
    expect(resolveViewFields(undefined, COLUMNS)).toBe(undefined);
  });

  it("不写 view 时回落列＋表单字段（跳过已出现的列与 password）", () => {
    const form: FormField[] = [
      { prop: "name", label: "姓名" },
      { prop: "note", label: "备注" },
      { prop: "secret", type: "password", label: "密码" },
    ];
    const items = fallbackViewItems(COLUMNS, form);
    expect(items.map((x) => x.prop)).toEqual([
      "name",
      "email",
      "status",
      "createdAt",
      "note",
    ]);
  });

  it("底部 actions：自定义在前，close 默认靠右最后；href 按行解析", () => {
    const row = { id: "7", name: "Ada" };
    const cfg = resolveViewActionsCfg(VIEW);
    const slots = resolveViewFooterActions(cfg, row, "关闭");
    expect(slots.map((s) => s.key)).toEqual(["password", "site", "close"]);
    expect(slots[0].label).toBe("密码");
    expect(slots[1].href).toBe("/u/7");
    expect(slots[2].builtinClose).toBe(true);
    expect(slots[2].label).toBe("关闭");
  });

  it("close 写在 Record 中间仍靠右最后；close:false 隐藏", () => {
    const row = { id: "1" };
    const mid = resolveViewFooterActions(
      {
        audit: { label: "审核", action: () => {} },
        close: true,
        extra: { label: "更多", action: () => {} },
      },
      row,
      "关闭",
    );
    expect(mid.map((s) => s.key)).toEqual(["audit", "extra", "close"]);

    const hidden = resolveViewFooterActions(
      { audit: { label: "审核", action: () => {} }, close: false },
      row,
      "关闭",
    );
    expect(hidden.map((s) => s.key)).toEqual(["audit"]);

    const fallback = resolveViewFooterActions(undefined, row, "关闭");
    expect(fallback.map((s) => s.key)).toEqual(["close"]);
    expect(fallback[0].builtinClose).toBe(true);
  });

  it("click toggle 在两档 options 间切换", () => {
    const opts = [
      { value: "active", label: "启用" },
      { value: "disabled", label: "停用" },
    ];
    expect(toggleOptionValue("active", opts)).toBe("disabled");
    expect(toggleOptionValue("disabled", opts)).toBe("active");
    expect(toggleOptionValue("active", [{ value: "only" }])).toBe(undefined);
    expect(toggleOptionValue("x", undefined)).toBe(undefined);
  });

  it("form/view 可仅有 render（props 可省略）；fieldsOf 为空", () => {
    const formOnlyRender: FormConfig = {
      render: () => "form-body",
    };
    const viewOnlyRender: ViewConfig = {
      render: () => "view-body",
      actions: { close: true },
    };
    expect(fieldsOf(formOnlyRender)).toEqual([]);
    expect(fieldsOf(viewOnlyRender)).toEqual([]);
    expect(typeof formOnlyRender.render).toBe("function");
    expect(typeof viewOnlyRender.render).toBe("function");
    expect(resolveViewFields(viewOnlyRender, COLUMNS)).toEqual([]);
    const slots = resolveViewFooterActions(
      resolveViewActionsCfg(viewOnlyRender),
      { id: "1" },
      "关闭",
    );
    expect(slots.map((s) => s.key)).toEqual(["close"]);
  });

  it("FormField / ViewItem 可挂字段级 render", () => {
    const form: FormField[] = [
      {
        prop: "email",
        label: "邮箱",
        render: () => "custom-field",
      },
    ];
    expect(typeof form[0].render).toBe("function");
    expect(form[0].render!({
      field: form[0],
      prop: "email",
      value: { value: "a@b.c" } as never,
      multiValue: { value: [] } as never,
      mode: "edit",
      row: { id: "1" },
      disabled: false,
    })).toBe("custom-field");

    const viewItem = {
      prop: "name",
      label: "姓名",
      render: (ctx: { defaultNode: unknown }) => `wrap:${ctx.defaultNode}`,
    };
    expect(viewItem.render({ defaultNode: "Ada" })).toBe("wrap:Ada");
  });
});
