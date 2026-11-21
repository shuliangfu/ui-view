/** @jsxImportSource @dreamer/view */
/**
 * 单元格多选编辑：勾选不得把整表/整个编辑器重绘掉导致草稿重置。
 */
import "../shared/happy-dom-setup.ts";
import { mount } from "@dreamer/view";
import { describe, expect, it } from "@dreamer/test";
import { DataPanel } from "../../src/desktop/data-display/DataPanel.tsx";

const OPTIONS = [
  { value: "vip", label: "VIP" },
  { value: "new", label: "新用户" },
  { value: "beta", label: "内测" },
  { value: "staff", label: "员工" },
];

async function flush(): Promise<void> {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    globalThis.requestAnimationFrame(() => resolve());
  });
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 30);
  });
}

describe("DataPanel inline MultiSelect", () => {
  it("勾选选项后保持选中，不会因整段重绘重置", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const stop = mount(
      () => (
        <DataPanel
          title="用户"
          syncUrl={false}
          columns={[
            { prop: "name", label: "姓名" },
            {
              prop: "tags",
              label: "标签",
              inline: "multiselect",
              options: OPTIONS,
            },
          ]}
          data={[{ id: "1", name: "Ada", tags: ["vip"] }]}
          caps={{ create: false, remove: false, view: false, update: true }}
        />
      ),
      host,
    );
    await flush();
    const display = host.querySelector(
      '[data-testid="dp-edit-tags-1"]',
    ) as HTMLElement;
    expect(display).toBeTruthy();
    display.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    await flush();
    const editor = host.querySelector(
      '[data-testid="dp-inline-tags"]',
    ) as HTMLElement;
    expect(editor).toBeTruthy();
    await flush();
    const option = (label: string) =>
      [...editor.querySelectorAll('[role="option"]')].find((o) =>
        (o.textContent ?? "").includes(label)
      ) as HTMLElement;
    expect(option("VIP").getAttribute("aria-selected")).toBe("true");
    expect(option("新用户").getAttribute("aria-selected")).not.toBe("true");
    const newer = option("新用户");
    // 浏览器顺序：pointerdown → microtask → click。queueMicrotask 清旗会把这次勾选再拨回去。
    newer.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    await Promise.resolve();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 30));
    newer.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    await flush();
    expect(option("VIP").getAttribute("aria-selected")).toBe("true");
    expect(option("新用户").getAttribute("aria-selected")).toBe("true");
    expect(option("内测").getAttribute("aria-selected")).not.toBe("true");
    const stillEditor = host.querySelector(
      '[data-testid="dp-inline-tags"]',
    );
    expect(stillEditor).toBe(editor);
    stop();
    host.remove();
  });
});
