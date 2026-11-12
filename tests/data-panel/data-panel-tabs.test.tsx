/** @jsxImportSource @dreamer/view */
/**
 * DataPanel / DataView tab chrome: key resolution, URL / cache, and SSR structure.
 */
import { describe, expect, it } from "@dreamer/test";
import { renderToString } from "@dreamer/view/ssr";
import { DataPanel } from "../../src/desktop/data-display/DataPanel.tsx";
import { DataView } from "../../src/desktop/data-display/DataView.tsx";
import {
  DEFAULT_TAB_PARAM,
  peekCachedTabKey,
  readTabFromLocation,
  rememberTabKey,
  resolveDataChromeTabKey,
  resolveInitialTabKey,
  writeTabToLocation,
} from "../../src/desktop/data-display/data-panel-tabs.tsx";

const tabs = [
  { key: "all", label: "全部" },
  { key: "admin", label: "管理员" },
  { key: "stats", label: "统计", disabled: true },
];

type Loc = { pathname: string; search: string; hash: string };

function withLocation<T>(loc: Loc, fn: (loc: Loc) => T): T {
  const g = globalThis as {
    location?: Loc;
    history?: { replaceState: (a: unknown, b: string, c: string) => void };
  };
  const prevLoc = Object.getOwnPropertyDescriptor(globalThis, "location");
  const prevHist = Object.getOwnPropertyDescriptor(globalThis, "history");
  const state = { ...loc };
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: state,
  });
  Object.defineProperty(globalThis, "history", {
    configurable: true,
    value: {
      replaceState(_a: unknown, _b: string, url: string) {
        const u = new URL(url, "http://ui-view.test");
        state.pathname = u.pathname;
        state.search = u.search;
        state.hash = u.hash;
      },
    },
  });
  try {
    return fn(state);
  } finally {
    if (prevLoc) Object.defineProperty(globalThis, "location", prevLoc);
    else delete g.location;
    if (prevHist) Object.defineProperty(globalThis, "history", prevHist);
    else delete g.history;
  }
}

describe("resolveDataChromeTabKey", () => {
  it("uses activeTab when it exists", () => {
    expect(resolveDataChromeTabKey(tabs, "admin", "all")).toBe("admin");
  });

  it("falls back to defaultActiveTab", () => {
    expect(resolveDataChromeTabKey(tabs, undefined, "admin")).toBe("admin");
  });

  it("skips a missing key and uses the first enabled tab", () => {
    expect(resolveDataChromeTabKey(tabs, "missing")).toBe("all");
  });

  it("is empty when there are no tabs", () => {
    expect(resolveDataChromeTabKey(undefined)).toBe("");
    expect(resolveDataChromeTabKey([])).toBe("");
  });
});

describe("tab URL and cache", () => {
  it("DEFAULT_TAB_PARAM is tab", () => {
    expect(DEFAULT_TAB_PARAM).toBe("tab");
  });

  it("reads the tab query and ignores an empty value", () => {
    withLocation(
      { pathname: "/p", search: "?tab=admin&page=2", hash: "#tab" },
      () => {
        expect(readTabFromLocation("tab")).toBe("admin");
        expect(readTabFromLocation("missing")).toBeUndefined();
        expect(readTabFromLocation("")).toBeUndefined();
      },
    );
    withLocation({ pathname: "/p", search: "?tab=", hash: "" }, () => {
      expect(readTabFromLocation("tab")).toBeUndefined();
    });
  });

  it("writes the tab query and keeps the hash", () => {
    withLocation(
      {
        pathname: "/desktop/data-display/data-panel",
        search: "?page=2",
        hash: "#tab",
      },
      (loc) => {
        writeTabToLocation("tab", "admin");
        expect(loc.search).toBe("?page=2&tab=admin");
        expect(loc.hash).toBe("#tab");
        expect(loc.pathname).toBe("/desktop/data-display/data-panel");
        writeTabToLocation("tab", "");
        expect(loc.search).toBe("?page=2");
        expect(loc.hash).toBe("#tab");
      },
    );
  });

  it("remembers a tab per panelKey", () => {
    const key = `tabs-test-${Date.now()}`;
    expect(peekCachedTabKey(key)).toBeUndefined();
    rememberTabKey(key, "admin");
    expect(peekCachedTabKey(key)).toBe("admin");
    rememberTabKey("", "ignored");
    expect(peekCachedTabKey("")).toBeUndefined();
  });

  it("resolveInitialTabKey prefers controlled, then cache, then URL, then default", () => {
    const panelKey = `tabs-init-${Date.now()}`;
    rememberTabKey(panelKey, "admin");
    withLocation({ pathname: "/p", search: "?tab=stats", hash: "" }, () => {
      expect(
        resolveInitialTabKey({
          tabs,
          activeTab: "all",
          defaultActiveTab: "admin",
          panelKey,
          tabParam: "tab",
        }),
      ).toBe("all");
      expect(
        resolveInitialTabKey({
          tabs,
          defaultActiveTab: "all",
          panelKey,
          tabParam: "tab",
        }),
      ).toBe("admin");
    });
    const urlOnly = `tabs-url-${Date.now()}`;
    withLocation({ pathname: "/p", search: "?tab=admin", hash: "" }, () => {
      expect(
        resolveInitialTabKey({
          tabs,
          defaultActiveTab: "all",
          panelKey: urlOnly,
          tabParam: "tab",
        }),
      ).toBe("admin");
    });
    expect(
      resolveInitialTabKey({
        tabs,
        defaultActiveTab: "admin",
        tabParam: false as unknown as string,
      }),
    ).toBe("admin");
  });
});

const COLUMNS = [
  { type: "index" as const },
  { prop: "name", label: "姓名" },
];
const ROWS = [
  { id: "1", name: "Ada", role: "admin" },
  { id: "2", name: "Bob", role: "user" },
];

describe("DataPanel tabs SSR", () => {
  it("puts tab buttons in the toolbar and keeps the default table body", async () => {
    const h = String(
      await renderToString(() => (
        <DataPanel
          panelKey="ssr-tabs-panel"
          title="用户管理"
          columns={COLUMNS}
          data={ROWS}
          tabs={[
            { key: "all", label: "全部" },
            { key: "admin", label: "管理员" },
            { key: "stats", label: "统计", children: <div>统计面板</div> },
          ]}
        />
      )),
    );
    expect(h).toContain("全部");
    expect(h).toContain("管理员");
    expect(h).toContain("统计");
    expect(h).toContain('data-testid="data-panel-toolbar"');
    const barStart = h.indexOf('data-testid="data-panel-toolbar"');
    const allAt = h.indexOf("全部");
    const toolsAt = h.indexOf("data-dp-tools");
    expect(barStart).toBeGreaterThan(-1);
    expect(allAt).toBeGreaterThan(barStart);
    expect(toolsAt).toBeGreaterThan(allAt);
    expect(h).toContain('data-testid="dp-table"');
    expect(h).toContain("Ada");
    expect(h).not.toContain("统计面板");
  });

  it("renders the active tab body instead of the table", async () => {
    const h = String(
      await renderToString(() => (
        <DataPanel
          panelKey="ssr-tabs-stats"
          title="用户管理"
          columns={COLUMNS}
          data={ROWS}
          activeTab="stats"
          tabs={[
            { key: "all", label: "全部" },
            { key: "stats", label: "统计", children: <div>统计面板</div> },
          ]}
        />
      )),
    );
    expect(h).toContain("统计面板");
    expect(h).toContain('data-testid="data-chrome-tabs"');
    expect(h).not.toContain('data-testid="dp-table"');
  });
});

describe("DataView tabs SSR", () => {
  it("puts tab buttons in the toolbar and shows default descriptions", async () => {
    const h = String(
      await renderToString(() => (
        <DataView
          panelKey="ssr-tabs-view"
          title="用户详情"
          data={{ name: "Ada", email: "ada@example.com" }}
          view={{
            props: [{ prop: "name", label: "姓名" }, {
              prop: "email",
              label: "邮箱",
            }],
          }}
          tabs={[
            { key: "basic", label: "基本信息" },
            {
              key: "extra",
              label: "其他",
              children: <p>注册来源：后台录入</p>,
            },
          ]}
        />
      )),
    );
    expect(h).toContain("基本信息");
    expect(h).toContain("其他");
    expect(h).toContain('data-testid="data-view-toolbar"');
    expect(h).toContain("Ada");
    expect(h).toContain("ada@example.com");
    expect(h).not.toContain("注册来源：后台录入");
  });

  it("renders custom tab children when that tab is active", async () => {
    const h = String(
      await renderToString(() => (
        <DataView
          panelKey="ssr-tabs-view-extra"
          title="用户详情"
          data={{ name: "Ada" }}
          view={{ props: [{ prop: "name", label: "姓名" }] }}
          activeTab="extra"
          tabs={[
            { key: "basic", label: "基本信息" },
            {
              key: "extra",
              label: "其他",
              children: <p>注册来源：后台录入</p>,
            },
          ]}
        />
      )),
    );
    expect(h).toContain("注册来源：后台录入");
    expect(h).not.toContain("Ada");
  });
});
