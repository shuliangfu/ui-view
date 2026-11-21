/** @jsxImportSource @dreamer/view */
/**
 * Select / MultiSelect：panelAttach=viewport 时浮层为视口 fixed，且多选顶栏不被窄触发器挤出。
 */
import "./happy-dom-setup.ts";
import { mount } from "@dreamer/view";
import { describe, expect, it } from "@dreamer/test";
import { MultiSelect } from "../../src/shared/form/MultiSelect.tsx";
import { Select } from "../../src/shared/form/Select.tsx";

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

describe("dropdown panelAttach", () => {
  it("MultiSelect viewport: listbox is fixed and keeps 全选／清空／完成 in the panel", async () => {
    const host = document.createElement("div");
    host.style.cssText = "width:80px;overflow:hidden";
    document.body.appendChild(host);
    const stop = mount(
      () => (
        <MultiSelect
          size="sm"
          value={["staff"]}
          options={OPTIONS}
          panelAttach="viewport"
        />
      ),
      host,
    );
    await flush();
    const toggle = host.querySelector(
      'button[aria-haspopup="listbox"]',
    ) as HTMLButtonElement;
    expect(toggle).toBeTruthy();
    toggle.click();
    await flush();
    const listbox = document.querySelector(
      '[role="listbox"]',
    ) as HTMLElement;
    expect(listbox).toBeTruthy();
    expect(listbox.className.includes("fixed")).toBe(true);
    const minW = Number.parseFloat(listbox.style.minWidth || "0");
    expect(minW >= 216).toBe(true);
    const done = [...listbox.querySelectorAll("button")].find((b) =>
      (b.textContent ?? "").includes("完成")
    );
    const selectAll = [...listbox.querySelectorAll("button")].find((b) =>
      (b.textContent ?? "").includes("全选")
    );
    expect(done).toBeTruthy();
    expect(selectAll).toBeTruthy();
    expect(listbox.contains(done as Node)).toBe(true);
    stop();
    host.remove();
  });

  it("Select viewport: listbox is fixed", async () => {
    const host = document.createElement("div");
    host.style.cssText = "width:80px;overflow:hidden";
    document.body.appendChild(host);
    const stop = mount(
      () => (
        <Select
          size="sm"
          value="staff"
          options={OPTIONS}
          panelAttach="viewport"
        />
      ),
      host,
    );
    await flush();
    const toggle = host.querySelector(
      'button[aria-haspopup="listbox"]',
    ) as HTMLButtonElement;
    toggle.click();
    await flush();
    const listbox = document.querySelector(
      '[role="listbox"]',
    ) as HTMLElement;
    expect(listbox).toBeTruthy();
    expect(listbox.className.includes("fixed")).toBe(true);
    stop();
    host.remove();
  });
});
