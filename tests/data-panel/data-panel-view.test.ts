/**
 * DataPanel view / form / search：`{ title, props }`、字段继承、回落、底部 actions、click toggle。
 */
import { describe, expect, it } from "@dreamer/test";
import {
  columnAlignFlexJustify,
  columnAlignTextClass,
  columnWidthStyle,
  enrichViewField,
  fallbackViewItems,
  fieldsOf,
  resolveColumnAlign,
  resolveColumnHeaderAlign,
  resolveViewActionsCfg,
  resolveViewFields,
  pickPanelPaginationProps,
  pickViewDescriptionsProps,
  resolvePanelPagination,
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

  it("view.props 未写 prop 的拼接字段会显示，并保留 formatter", () => {
    const fields = resolveViewFields(
      {
        props: [
          { prop: "lastName", label: "姓" },
          {
            label: "姓名",
            formatter: (row) =>
              `${row.lastName ?? ""}${row.firstName ?? ""}` || "—",
          },
        ],
      },
      [],
    )!;
    expect(fields[1].prop).toBe("__custom:姓名");
    expect(typeof fields[1].formatter).toBe("function");
    expect(
      fields[1].formatter!({ lastName: "张", firstName: "三" }, undefined),
    )
      .toBe("张三");
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
    expect(slots[2].tone).toBe("default");
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
    expect(fallback[0].tone).toBe("default");

    const primaryClose = resolveViewFooterActions(
      { close: { tone: "primary" } },
      row,
      "关闭",
    );
    expect(primaryClose[0].tone).toBe("primary");
  });

  it("edit: true 会出现在关闭按钮前面，并用传入的编辑文案", () => {
    const slots = resolveViewFooterActions(
      { edit: true, close: true },
      { id: "1" },
      "关闭",
      { edit: "编辑" },
    );
    expect(slots.map((s) => s.key)).toEqual(["edit", "close"]);
    expect(slots[0].label).toBe("编辑");
    expect(slots[1].builtinClose).toBe(true);
  });

  it("edit 写成对象且未指定文案时，仍用传入的编辑文案，而不是键名 edit", () => {
    const slots = resolveViewFooterActions(
      { edit: { show: () => true }, close: true },
      { id: "1" },
      "关闭",
      { edit: "编辑" },
    );
    expect(slots.map((s) => s.key)).toEqual(["edit", "close"]);
    expect(slots[0].label).toBe("编辑");
  });

  it("edit 对象若自带 title，优先生效", () => {
    const slots = resolveViewFooterActions(
      { edit: { show: true, title: "改资料" }, close: true },
      { id: "1" },
      "关闭",
      { edit: "编辑" },
    );
    expect(slots[0].label).toBe("改资料");
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

  it("Column.align / headerAlign 解析与 class", () => {
    expect(resolveColumnAlign({})).toBe("center");
    expect(resolveColumnAlign({ align: "right" })).toBe("right");
    expect(resolveColumnHeaderAlign({ align: "right" })).toBe("right");
    expect(resolveColumnHeaderAlign({ align: "right", headerAlign: "center" }))
      .toBe("center");
    expect(columnAlignTextClass("left")).toBe("text-left");
    expect(columnAlignTextClass("center")).toBe("text-center");
    expect(columnAlignTextClass("right")).toBe("text-right");
    expect(columnAlignFlexJustify("center")).toBe("justify-center");
    expect(columnAlignFlexJustify("right")).toBe("justify-end");
  });

  it("Column.width / minWidth / maxWidth 拼 style", () => {
    expect(columnWidthStyle({})).toBe(
      "width:max-content;white-space:nowrap",
    );
    expect(columnWidthStyle({ width: 120 })).toBe("width:120px");
    expect(columnWidthStyle({ width: "auto" })).toBe(
      "width:max-content;white-space:nowrap",
    );
    expect(columnWidthStyle({ width: "auto", minWidth: 80 })).toBe(
      "width:max-content;white-space:nowrap;min-width:80px",
    );
    expect(columnWidthStyle({ minWidth: 80, maxWidth: 240 })).toBe(
      "width:max-content;white-space:nowrap;min-width:80px;max-width:240px",
    );
    expect(columnWidthStyle({ width: 100, minWidth: 60, maxWidth: 200 })).toBe(
      "width:100px;min-width:60px;max-width:200px",
    );
  });

  it("enrichViewField 保留 ViewItem.labelAlign，不丢字段", () => {
    const inherited = enrichViewField(
      {
        prop: "name",
        labelAlign: { vertical: "center", horizontal: "left" },
      },
      COLUMNS,
    );
    expect(inherited.label).toBe("姓名");
    expect(inherited.labelAlign).toEqual({
      vertical: "center",
      horizontal: "left",
    });

    const override = enrichViewField(
      {
        prop: "name",
        label: "用户名",
        labelAlign: { vertical: "bottom", horizontal: "center" },
      },
      COLUMNS,
    );
    expect(override.label).toBe("用户名");
    expect(override.labelAlign).toEqual({
      vertical: "bottom",
      horizontal: "center",
    });
  });

  it("resolveViewFields 保留各字段 labelAlign", () => {
    const fields = resolveViewFields(
      {
        labelColPercent: 28,
        labelMinWidth: "7rem",
        props: [
          {
            prop: "name",
            label: "姓名",
            labelAlign: { vertical: "center", horizontal: "left" },
          },
          { prop: "email", label: "邮箱" },
        ],
      },
      COLUMNS,
    )!;
    expect(fields[0].labelAlign).toEqual({
      vertical: "center",
      horizontal: "left",
    });
    expect(fields[1].labelAlign).toBe(undefined);
    expect(fields[0].label).toBe("姓名");
    expect(fields[1].label).toBe("邮箱");
  });
});

describe("pickViewDescriptionsProps", () => {
  it("只抽出已写的 Descriptions 参数，不带上弹层 title", () => {
    const picked = pickViewDescriptionsProps({
      title: "详情 · 张三",
      column: 3,
      size: "md",
      bordered: false,
      layout: "vertical",
      colon: false,
      class: "view-desc",
      labelClass: "lbl",
      contentClass: "cnt",
      labelColPercent: 28,
      labelMinWidth: "7rem",
      labelAlign: { vertical: "center", horizontal: "left" },
      props: [{ prop: "name", label: "姓名" }],
    });
    expect(picked).toEqual({
      column: 3,
      size: "md",
      bordered: false,
      layout: "vertical",
      colon: false,
      class: "view-desc",
      labelClass: "lbl",
      contentClass: "cnt",
      labelColPercent: 28,
      labelMinWidth: "7rem",
      labelAlign: { vertical: "center", horizontal: "left" },
    });
    expect("title" in picked).toBe(false);
  });

  it("未写的键不出现，空 view 返回空对象", () => {
    expect(pickViewDescriptionsProps()).toEqual({});
    expect(pickViewDescriptionsProps({ title: "详情" })).toEqual({});
    expect(pickViewDescriptionsProps({ column: 2 })).toEqual({ column: 2 });
  });
});

describe("resolvePanelPagination", () => {
  const auto = { preset: "full" as const, size: "md" as const };

  it("未写配置时走断点缺省", () => {
    const r = resolvePanelPagination(undefined, undefined, auto);
    expect(r.preset).toBe("full");
    expect(r.size).toBe("md");
    expect(r.rest).toEqual({});
  });

  it("pagination.preset 优先于 paginationPreset，未写 size 仍走断点", () => {
    const r = resolvePanelPagination(
      { preset: "simple", showFirstLast: true },
      "default",
      auto,
    );
    expect(r.preset).toBe("simple");
    expect(r.size).toBe("md");
    expect(r.rest).toEqual({ showFirstLast: true });
  });

  it("只写 paginationPreset 时用它作 preset", () => {
    const r = resolvePanelPagination(undefined, "default", auto);
    expect(r.preset).toBe("default");
    expect(r.size).toBe("md");
  });

  it("pickPanelPaginationProps 丢掉未写的键", () => {
    expect(pickPanelPaginationProps()).toEqual({});
    expect(pickPanelPaginationProps({ size: "lg", disabled: true })).toEqual({
      size: "lg",
      disabled: true,
    });
  });
});
