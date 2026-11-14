/**
 * @fileoverview DataPanel／DataView 命令式句柄与 refreshDataPanel 回落。
 */
import { describe, expect, it } from "@dreamer/test";
import {
  getDataPanel,
  getDataPanelQuery,
  getDataPanelSelected,
  getDataView,
  getDataViewRecord,
  openDataPanelForm,
  openDataPanelView,
  openDataViewForm,
  panelHandles,
  refreshDataPanel,
  refreshers,
  setDataPanelQuery,
  viewHandles,
} from "../../src/desktop/data-display/data-panel-chrome.tsx";
import type { Query, Row } from "../../src/desktop/data-display/data-panel-types.ts";

const Q: Query = {
  page: 1,
  pageSize: 20,
  sort: "",
  order: "asc",
  filters: { name: "张三" },
};

describe("DataPanel／DataView 命令式句柄", () => {
  it("get／set／open／refresh 委派到已注册面板句柄；缺失键安全回落", async () => {
    const calls: string[] = [];
    const selected: Row[] = [{ id: "1", name: "张三" }];
    let query = { ...Q };
    panelHandles.set("users", {
      reload: () => {
        calls.push("reload");
        return Promise.resolve();
      },
      getQuery: () => query,
      setQuery: (patch) => {
        query = { ...query, ...patch };
        calls.push(`setQuery:${patch.page}`);
      },
      getSelected: () => selected,
      openForm: (row) => {
        calls.push(`openForm:${row?.id ?? "new"}`);
      },
      openView: (row) => {
        calls.push(`openView:${typeof row === "string" ? row : row.id}`);
      },
    });
    try {
      expect(getDataPanel("users")?.getQuery()).toEqual(Q);
      expect(getDataPanelQuery("users")).toEqual(Q);
      expect(getDataPanelSelected("users")).toEqual(selected);
      setDataPanelQuery("users", { page: 2 });
      expect(getDataPanelQuery("users")?.page).toBe(2);
      openDataPanelForm("users");
      openDataPanelForm("users", { id: "1", name: "张三" });
      openDataPanelView("users", "1");
      openDataPanelView("users", { id: "2", name: "李四" });
      await refreshDataPanel("users");
      expect(calls).toEqual([
        "setQuery:2",
        "openForm:new",
        "openForm:1",
        "openView:1",
        "openView:2",
        "reload",
      ]);
      expect(getDataPanel("missing")).toBe(undefined);
      expect(getDataPanelQuery("missing")).toBe(undefined);
      expect(getDataPanelSelected("missing")).toEqual([]);
    } finally {
      panelHandles.delete("users");
    }
  });

  it("DataView 句柄：getRecord／openForm／reload；refreshDataPanel 同键复用", async () => {
    const calls: string[] = [];
    const record: Row = { id: "3", name: "王五" };
    viewHandles.set("detail", {
      reload: () => {
        calls.push("reload");
        return Promise.resolve();
      },
      getRecord: () => record,
      openForm: (row) => {
        calls.push(`openForm:${row?.id ?? record.id}`);
      },
    });
    try {
      expect(getDataView("detail")?.getRecord()).toEqual(record);
      expect(getDataViewRecord("detail")).toEqual(record);
      openDataViewForm("detail");
      openDataViewForm("detail", { id: "9", name: "李四" });
      await refreshDataPanel("detail");
      expect(calls).toEqual(["openForm:3", "openForm:9", "reload"]);
      expect(getDataView("missing")).toBe(undefined);
      expect(getDataViewRecord("missing")).toBe(undefined);
    } finally {
      viewHandles.delete("detail");
    }
  });

  it("没有句柄时 refreshDataPanel 回落到 refreshers", async () => {
    const calls: string[] = [];
    refreshers.set("legacy", () => {
      calls.push("legacy");
      return Promise.resolve();
    });
    try {
      await refreshDataPanel("legacy");
      expect(calls).toEqual(["legacy"]);
    } finally {
      refreshers.delete("legacy");
    }
  });
});
