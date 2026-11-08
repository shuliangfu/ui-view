/**
 * Unified toolbar / rowActions Record: assert, resolve, disable (not hide).
 */
import { describe, expect, it } from "@dreamer/test";
import {
  assertRowActionsConfig,
  assertToolbarConfig,
  isRowBuiltin,
  isToolbarBuiltin,
  actionTipText,
  actionDisplayText,
  resolveActionCtrl,
  resolveRowActionCtrl,
  ROW_BUILTINS,
  TOOLBAR_BUILTINS,
  type DataPanelRowActionsConfig,
  type DataPanelToolbarConfig,
} from "../../src/desktop/data-display/data-panel-types.ts";

describe("DataPanel ActionCtrl unified Record", () => {
  it("resolveActionCtrl: undefined uses fallbackShow; boolean; disable defaults false", () => {
    expect(resolveActionCtrl(undefined, true)).toEqual({
      show: true,
      disable: false,
    });
    expect(resolveActionCtrl(undefined, false).show).toBe(false); // caps hide
    expect(resolveActionCtrl(false, true).show).toBe(false);
    expect(resolveActionCtrl(true, false).show).toBe(true);
    expect(resolveActionCtrl({ show: true, disable: true }, false)).toEqual({
      show: true,
      disable: true,
      title: undefined,
      tone: undefined,
      label: undefined,
      icon: undefined,
      action: undefined,
    });
  });

  it("declared object: omit show → true (not caps); omit disable → false", () => {
    // even if caps fallback would be false, object without show stays visible
    expect(resolveActionCtrl({}, false)).toEqual({
      show: true,
      disable: false,
      title: undefined,
      tone: undefined,
      label: undefined,
      icon: undefined,
      action: undefined,
    });
    expect(resolveActionCtrl({ disable: true }, false)).toEqual({
      show: true,
      disable: true,
      title: undefined,
      tone: undefined,
      label: undefined,
      icon: undefined,
      action: undefined,
    });
    const hid = resolveActionCtrl({ show: false, disable: true }, true);
    expect(hid.show).toBe(false);
    expect(hid.disable).toBe(true);
  });

  it("undeclared vs declared: undefined ctrl → caps; {} → show", () => {
    // undeclared / capGate allow path
    expect(resolveActionCtrl(undefined, false).show).toBe(false);
    // declared empty object
    expect(resolveActionCtrl({}, false).show).toBe(true);
  });

  it("resolveActionCtrl: toolbar show/disable as zero-arg functions", () => {
    let showCalls = 0;
    let disCalls = 0;
    const r = resolveActionCtrl(
      {
        show: () => {
          showCalls++;
          return true;
        },
        disable: () => {
          disCalls++;
          return true;
        },
        action: () => {},
      },
      false,
    );
    expect(r.show).toBe(true);
    expect(r.disable).toBe(true);
    expect(showCalls).toBe(1);
    expect(disCalls).toBe(1);
    expect(typeof r.action).toBe("function");
  });

  it("resolveRowActionCtrl: omit show → true even when caps fallback false", () => {
    const item = { id: "1" };
    expect(resolveRowActionCtrl({}, item, false).show).toBe(true);
    expect(resolveRowActionCtrl({ disable: true }, item, false)).toEqual({
      show: true,
      disable: true,
      icon: undefined,
      label: undefined,
      title: undefined,
      tone: undefined,
      action: undefined,
    });
    expect(resolveRowActionCtrl(undefined, item, false).show).toBe(false);
  });

  it("resolveRowActionCtrl: disable(item) / action receives correct item", () => {
    const item = { id: "42", locked: true, name: "Ada" };
    const seen: unknown[] = [];
    const r = resolveRowActionCtrl(
      {
        show: true,
        disable: (x) => {
          seen.push(["disable", x]);
          return !!x.locked;
        },
        action: (x) => {
          seen.push(["action", x]);
        },
        label: "分配",
      },
      item,
      true,
    );
    expect(r.show).toBe(true);
    expect(r.disable).toBe(true);
    expect(r.label).toBe("分配");
    expect(seen[0]).toEqual(["disable", item]);
    r.action?.(item);
    expect(seen[1]).toEqual(["action", item]);

    const unlocked = { id: "7", locked: false };
    expect(
      resolveRowActionCtrl(
        { disable: (x) => !!x.locked, action: () => {} },
        unlocked,
        true,
      ).disable,
    ).toBe(false);
  });

  it("assertToolbarConfig throws when custom key lacks action", () => {
    expect(() => assertToolbarConfig({ create: true })).not.toThrow();
    expect(() => assertToolbarConfig({ my: true })).toThrow(/my.*action/i);
    expect(() => assertToolbarConfig({ my: { label: "L" } })).toThrow(/my/);
    expect(() =>
      assertToolbarConfig({ my: { label: "L", action: () => {}, disable: true } })
    ).not.toThrow();
  });

  it("assertRowActionsConfig throws when custom key lacks action", () => {
    expect(() => assertRowActionsConfig({ view: false })).not.toThrow();
    expect(() => assertRowActionsConfig({ assign: { label: "A" } })).toThrow(
      /assign/,
    );
    expect(() =>
      assertRowActionsConfig({
        assign: { label: "A", action: () => {}, disable: (i) => !!i.locked },
      })
    ).not.toThrow();
  });

  it("isToolbarBuiltin / isRowBuiltin / default orders", () => {
    expect(isToolbarBuiltin("create")).toBe(true);
    expect(isToolbarBuiltin("assign")).toBe(false);
    expect(isRowBuiltin("edit")).toBe(true);
    expect(isRowBuiltin("assign")).toBe(false);
    expect([...TOOLBAR_BUILTINS]).toContain("fullscreen");
    expect([...ROW_BUILTINS]).toEqual(["view", "edit", "remove"]);
  });

  it("Object.keys write order is display order for declared keys", () => {
    const toolbar: DataPanelToolbarConfig = {
      create: true,
      myBtn: { label: "Mine", action: () => {}, disable: false },
      search: true,
    };
    assertToolbarConfig(toolbar);
    expect(Object.keys(toolbar)).toEqual(["create", "myBtn", "search"]);

    const rowActions: DataPanelRowActionsConfig = {
      assign: { label: "A", action: () => {} },
      view: false,
      edit: false,
      remove: false,
    };
    assertRowActionsConfig(rowActions);
    expect(Object.keys(rowActions)).toEqual([
      "assign",
      "view",
      "edit",
      "remove",
    ]);
  });

  it("resolveActionCtrl: title string / zero-arg function", () => {
    expect(resolveActionCtrl({ title: "提示", action: () => {} }, true).title)
      .toBe("提示");
    expect(
      resolveActionCtrl({ title: () => "动态", action: () => {} }, true).title,
    ).toBe("动态");
    expect(resolveActionCtrl({ title: "", action: () => {} }, true).title)
      .toBe(undefined);
  });

  it("resolveRowActionCtrl: title(item) receives row", () => {
    const item = { id: "9", name: "Ada" };
    const r = resolveRowActionCtrl(
      {
        title: (x) => `编辑 ${String(x.name)}`,
        action: () => {},
      },
      item,
      true,
    );
    expect(r.title).toBe("编辑 Ada");
  });


  it("actionTipText: title ?? label ?? builtin ?? key", () => {
    // 内置：无 title／label → messages
    expect(actionTipText("create", undefined, undefined, "新建")).toBe("新建");
    expect(actionTipText("refresh", undefined, undefined, "刷新")).toBe("刷新");
    // 有 label、无 title → label（优先于 builtin／key）
    expect(actionTipText("assign", undefined, "分配", "新建")).toBe("分配");
    expect(actionTipText("assign", undefined, "分配")).toBe("分配");
    // 都无 → key
    expect(actionTipText("assign")).toBe("assign");
    expect(actionTipText("freeze")).toBe("freeze");
    // title 覆盖 label／builtin
    expect(actionTipText("create", "Add item", "分配", "新建")).toBe("Add item");
    expect(actionTipText("assign", "分配管理员", "分配")).toBe("分配管理员");
    // 空串视为 omit
    expect(actionTipText("create", "", undefined, "新建")).toBe("新建");
    expect(actionTipText("create", "", "分配", "新建")).toBe("分配");
    expect(actionTipText("customBtn", "", "自定义")).toBe("自定义");
    expect(actionTipText("customBtn", "")).toBe("customBtn");
    // 内置默认文案优先于裸 key
    expect(actionTipText("create", undefined, undefined, "新建")).toBe("新建");
  });

  it("actionDisplayText: label ?? title ?? key（无 label 有 title → 显示 title）", () => {
    expect(actionDisplayText("assign", "分配", "开一个")).toBe("分配");
    expect(actionDisplayText("assign", undefined, "开一个")).toBe("开一个");
    expect(actionDisplayText("assign", "", "开一个")).toBe("开一个");
    expect(actionDisplayText("assign")).toBe("assign");
    expect(actionDisplayText("freeze", "冻结")).toBe("冻结");
  });

  it("title／label 互落：resolve 后 tip 与显示文案", () => {
    const a = resolveActionCtrl(true, true);
    expect(a.title).toBe(undefined);
    expect(actionTipText("create", a.title, a.label, "新建")).toBe("新建");
    const c = resolveActionCtrl({ label: "分配", action: () => {} }, true);
    expect(c.title).toBe(undefined);
    expect(c.label).toBe("分配");
    expect(actionTipText("assign", c.title, c.label, "新建")).toBe("分配");
    expect(actionDisplayText("assign", c.label, c.title)).toBe("分配");
    const bare = resolveActionCtrl({ action: () => {} }, true);
    expect(actionTipText("assign", bare.title, bare.label)).toBe("assign");
    expect(actionDisplayText("assign", bare.label, bare.title)).toBe("assign");
    // 仅 title：tip 与显示都用 title
    const tOnly = resolveActionCtrl({ title: "开一个", action: () => {} }, true);
    expect(tOnly.title).toBe("开一个");
    expect(tOnly.label).toBe(undefined);
    expect(actionTipText("assign", tOnly.title, tOnly.label, "新建")).toBe("开一个");
    expect(actionDisplayText("assign", tOnly.label, tOnly.title)).toBe("开一个");
    // title + label：tip 用 title，显示用 label
    const d = resolveActionCtrl({ title: "开一个", label: "分配", action: () => {} }, true);
    expect(d.title).toBe("开一个");
    expect(actionTipText("assign", d.title, d.label)).toBe("开一个");
    expect(actionDisplayText("assign", d.label, d.title)).toBe("分配");
  });

  it("resolveActionCtrl: tone full Button ColorVariant set (no confirm field)", () => {
    for (const tone of [
      "default",
      "primary",
      "secondary",
      "success",
      "warning",
      "danger",
      "ghost",
    ] as const) {
      expect(resolveActionCtrl({ tone, action: () => {} }, true).tone).toBe(tone);
    }
    expect(resolveActionCtrl({ action: () => {} }, true).tone).toBe(undefined);
    // confirm is not part of ActionCtrl — callers manage confirmation inside action
    expect(
      "confirm" in (resolveActionCtrl({ action: () => {} }, true) as object),
    ).toBe(false);
  });

  it("resolveRowActionCtrl: tone / tip=label??key (no confirm field)", () => {
    const item = { id: "9", name: "Ada" };
    const r = resolveRowActionCtrl(
      {
        tone: "danger",
        label: "冻结",
        action: () => {},
      },
      item,
      true,
    );
    expect(r.tone).toBe("danger");
    expect(r.label).toBe("冻结");
    expect(actionTipText("freeze", r.title, r.label, "删除")).toBe("冻结");
    expect(actionDisplayText("freeze", r.label, r.title)).toBe("冻结");
    expect("confirm" in (r as object)).toBe(false);
  });

  it("batchStatus is TOOLBAR_BUILTIN (Record-gated; UI = batch bar)", () => {
    expect(isToolbarBuiltin("batchStatus")).toBe(true);
    expect([...TOOLBAR_BUILTINS]).toContain("batchStatus");
    // undeclared → caps; declared false hides
    expect(resolveActionCtrl(undefined, true).show).toBe(true);
    expect(resolveActionCtrl(false, true).show).toBe(false);
    expect(resolveActionCtrl({ disable: true }, false)).toEqual({
      show: true,
      disable: true,
      title: undefined,
      tone: undefined,
      label: undefined,
      icon: undefined,
      action: undefined,
    });
  });

});