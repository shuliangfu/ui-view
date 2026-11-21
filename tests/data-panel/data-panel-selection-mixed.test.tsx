/** @jsxImportSource @dreamer/view */
import "../shared/happy-dom-setup.ts";
import { mount } from "@dreamer/view";
import { describe, expect, it } from "@dreamer/test";
import { DataPanel } from "../../src/desktop/data-display/DataPanel.tsx";
const flush = () => new Promise((resolve) => setTimeout(resolve, 40));
describe("DataPanel header selection", () => {
  it("DataPanel header selection reflects none/mixed/all and excludes locked/disabled rows", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const stop = mount(
      () => (
        <DataPanel
          title="mixed"
          panelKey={"unit-mixed-" + crypto.randomUUID()}
          syncUrl={false}
          data={[
            { id: "locked", name: "locked", locked: true },
            { id: "disabled", name: "disabled" },
            { id: "a", name: "a" },
            { id: "b", name: "b" },
          ]}
          columns={[{
            type: "selection",
            disable: (row) => row.id === "disabled",
          }, { prop: "name", label: "Name" }]}
          toolbar={false}
        />
      ),
      host,
    );
    const header = () =>
      host.querySelector('[data-testid="dp-select-all"]') as HTMLInputElement;
    const row = (id: string) =>
      host.querySelector(`[data-testid="dp-select-${id}"]`) as HTMLInputElement;
    const change = async (el: HTMLInputElement) => {
      el.checked = !el.checked;
      el.dispatchEvent(new Event("change", { bubbles: true }));
      await flush();
    };
    try {
      await flush();
      expect(header().indeterminate).toBe(false);
      expect(header().getAttribute("aria-checked")).toBe("false");
      await change(row("a"));
      expect(header().indeterminate).toBe(true);
      expect(header().getAttribute("aria-checked")).toBe("mixed");
      expect(header().checked).toBe(false);
      await change(header());
      expect(row("a").checked).toBe(true);
      expect(row("b").checked).toBe(true);
      expect(row("locked").checked).toBe(false);
      expect(row("disabled").checked).toBe(false);
      expect(header().checked).toBe(true);
      expect(header().indeterminate).toBe(false);
      expect(header().getAttribute("aria-checked")).toBe("true");
      await change(header());
      expect(row("a").checked).toBe(false);
      expect(row("b").checked).toBe(false);
      expect(header().indeterminate).toBe(false);
      expect(header().getAttribute("aria-checked")).toBe("false");
    } finally {
      stop();
      host.remove();
    }
  });
});
