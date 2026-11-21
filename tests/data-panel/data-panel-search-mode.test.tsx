/** @jsxImportSource @dreamer/view */
/**
 * DataPanel 搜索展示：默认 modal 弹窗；mode=expand 时在工具栏下方展开。
 */
import "../shared/happy-dom-setup.ts";
import { mount } from "@dreamer/view";
import { describe, expect, it } from "@dreamer/test";
import { renderToString } from "@dreamer/view/ssr";
import { DataPanel } from "../../src/desktop/data-display/DataPanel.tsx";
import type { SearchConfig } from "../../src/desktop/data-display/data-panel-types.ts";

const COLUMNS = [
  { prop: "name", label: "姓名" },
  { prop: "role", label: "角色" },
];
const ROWS = [
  { id: "1", name: "Alice", role: "admin" },
  { id: "2", name: "Bob", role: "user" },
];
const SEARCH: SearchConfig = {
  props: [
    { prop: "name", label: "姓名", placeholder: "输入姓名" },
  ],
};

async function flush(): Promise<void> {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    globalThis.requestAnimationFrame(() => resolve());
  });
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 30);
  });
}

async function html(search: SearchConfig = SEARCH): Promise<string> {
  return String(
    await renderToString(() => (
      <DataPanel
        title="用户"
        columns={COLUMNS}
        data={ROWS}
        syncUrl={false}
        caps={{ create: false }}
        search={search}
      />
    )),
  );
}

describe("DataPanel search mode", () => {
  it("default modal: first paint has the toggle but no inline search form", async () => {
    const h = await html();
    expect(h).toContain('data-testid="dp-search-toggle"');
    expect(h).not.toContain('data-testid="dp-search-slot"');
  });

  it("expand: first paint has no form until the toggle is used", async () => {
    const h = await html({ ...SEARCH, mode: "expand" });
    expect(h).toContain('data-testid="dp-search-toggle"');
    expect(h).not.toContain('data-testid="dp-search-slot"');
    expect(h).not.toContain('data-testid="dp-search"');
  });

  it("expand: clicking search expands the form under the toolbar, not a modal", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const stop = mount(
      () => (
        <DataPanel
          title="用户"
          columns={COLUMNS}
          data={ROWS}
          syncUrl={false}
          caps={{ create: false }}
          search={{ ...SEARCH, mode: "expand" }}
        />
      ),
      host,
    );
    await flush();
    expect(host.querySelector('[data-testid="dp-search-slot"]')).toBeNull();
    const toggle = host.querySelector(
      '[data-testid="dp-search-toggle"]',
    ) as HTMLButtonElement;
    expect(toggle).toBeTruthy();
    toggle.click();
    await flush();
    const slot = host.querySelector(
      '[data-testid="dp-search-slot"] [data-testid="dp-search"]',
    );
    expect(slot).toBeTruthy();
    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(toggle.getAttribute("aria-expanded")).toEqual("true");
    toggle.click();
    await flush();
    expect(host.querySelector('[data-testid="dp-search-slot"]')).toBeNull();
    expect(toggle.getAttribute("aria-expanded")).toEqual("false");
    stop();
    host.remove();
  });

  it("modal: clicking search still opens a dialog", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const stop = mount(
      () => (
        <DataPanel
          title="用户"
          columns={COLUMNS}
          data={ROWS}
          syncUrl={false}
          caps={{ create: false }}
          search={SEARCH}
        />
      ),
      host,
    );
    await flush();
    expect(host.querySelector('[data-testid="dp-search-slot"]')).toBeNull();
    const toggle = host.querySelector(
      '[data-testid="dp-search-toggle"]',
    ) as HTMLButtonElement;
    toggle.click();
    await flush();
    expect(
      document.querySelector('[role="dialog"] [data-testid="dp-search"]'),
    ).toBeTruthy();
    expect(host.querySelector('[data-testid="dp-search-slot"]')).toBeNull();
    stop();
    host.remove();
  });
});
