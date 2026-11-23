/** @jsxImportSource @dreamer/view */
import "../shared/happy-dom-setup.ts";
import { mount } from "@dreamer/view";
import { describe, expect, it } from "@dreamer/test";
import {
  DataPanel,
  openDataPanelView,
} from "../../src/desktop/data-display/DataPanel.tsx";
import type {
  DataSource,
  Row,
} from "../../src/desktop/data-display/data-panel-types.ts";

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 40));

async function openAndCount(opts: { render?: boolean }): Promise<number> {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const row: Row = { id: "1", name: "Ada" };
  let calls = 0;
  const source: DataSource = {
    list: () => ({ rows: [row], total: 1 }),
    view: () => {
      calls++;
      return { ...row, extra: "from-view" };
    },
  };
  const stop = mount(
    () => (
      <DataPanel
        panelKey={opts.render ? "custom-view-fetch" : "default-view-fetch"}
        title="test"
        syncUrl={false}
        columns={[
          { prop: "name", label: "名称" },
          { type: "actions", actions: { view: true } },
        ]}
        dataSource={source}
        view={opts.render
          ? { render: () => <div data-testid="custom-view-body">custom</div> }
          : { props: [{ prop: "name", label: "名称" }] }}
      />
    ),
    host,
  );
  try {
    await flush();
    openDataPanelView(
      opts.render ? "custom-view-fetch" : "default-view-fetch",
      row,
    );
    await flush();
    return calls;
  } finally {
    stop();
    host.remove();
  }
}

describe("DataPanel custom view.render fetch", () => {
  it("有 view.render 时不请求 dataSource.view", async () => {
    expect(await openAndCount({ render: true })).toBe(0);
  });

  it("无 view.render 时仍请求 dataSource.view", async () => {
    expect(await openAndCount({ render: false })).toBe(1);
  });
});
