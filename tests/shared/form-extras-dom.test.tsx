/** @jsxImportSource @dreamer/view */
/**
 * Checkbox 半选与 Rate 再次点击清零（需 DOM 属性 / 点击）。
 */
import "./happy-dom-setup.ts";
import { createSignal, mount } from "@dreamer/view";
import { describe, expect, it } from "@dreamer/test";
import { Checkbox } from "../../src/shared/form/Checkbox.tsx";
import { Rate } from "../../src/shared/form/Rate.tsx";
import { Input } from "../../src/shared/form/Input.tsx";
import { MultiSelect } from "../../src/shared/form/MultiSelect.tsx";
import { Select } from "../../src/shared/form/Select.tsx";

async function flush(): Promise<void> {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    globalThis.requestAnimationFrame(() => resolve());
  });
}

describe("Checkbox indeterminate", () => {
  it("sets the DOM indeterminate property via ref", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const stop = mount(
      () => <Checkbox indeterminate checked={false} />,
      host,
    );
    await flush();
    const input = host.querySelector(
      "input[type=checkbox]",
    ) as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.indeterminate).toEqual(true);
    expect(input.checked).toEqual(false);
    stop();
    host.remove();
  });
});

describe("Rate allowClear", () => {
  it("clears to 0 when the current score is clicked again", async () => {
    const value = createSignal(3);
    const host = document.createElement("div");
    document.body.appendChild(host);
    const stop = mount(
      () => <Rate value={value} allowClear count={5} />,
      host,
    );
    await flush();
    const stars = host.querySelectorAll("[role=button], .cursor-pointer");
    expect(stars.length).toBeGreaterThanOrEqual(3);
    (stars[2] as HTMLElement).click();
    await flush();
    expect(value()).toEqual(0);
    stop();
    host.remove();
  });
});

describe("Select uncontrolled", () => {
  it("keeps the selected label when value is omitted", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const stop = mount(
      () => (
        <Select
          options={[
            { value: "a", label: "选项 A" },
            { value: "b", label: "选项 B" },
          ]}
          placeholder="请选择"
        />
      ),
      host,
    );
    await flush();
    const trigger = host.querySelector(
      'button[aria-haspopup="listbox"]',
    ) as HTMLButtonElement;
    expect(trigger).toBeTruthy();
    expect((trigger.textContent || "").includes("请选择")).toEqual(true);
    trigger.click();
    await flush();
    const option = [...host.querySelectorAll('[role="option"]')].find((el) =>
      (el.textContent || "").includes("选项 A")
    ) as HTMLButtonElement | undefined;
    expect(option).toBeTruthy();
    option!.click();
    await flush();
    expect((trigger.textContent || "").includes("选项 A")).toEqual(true);
    stop();
    host.remove();
  });
});

describe("literal value write-back", () => {
  it('Select with value="" keeps the selected label', async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const stop = mount(
      () => (
        <Select
          value=""
          options={[
            { value: "a", label: "选项 A" },
            { value: "b", label: "选项 B" },
          ]}
          placeholder="请选择"
        />
      ),
      host,
    );
    await flush();
    const trigger = host.querySelector(
      'button[aria-haspopup="listbox"]',
    ) as HTMLButtonElement;
    trigger.click();
    await flush();
    const option = [...host.querySelectorAll('[role="option"]')].find((el) =>
      (el.textContent || "").includes("选项 A")
    ) as HTMLElement;
    option.click();
    await flush();
    expect((trigger.textContent || "").includes("选项 A")).toEqual(true);
    stop();
    host.remove();
  });

  it('Input with value="" keeps typed text', async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const stop = mount(() => <Input value="" placeholder="请输入" />, host);
    await flush();
    const input = host.querySelector("input") as HTMLInputElement;
    expect(input).toBeTruthy();
    input.value = "hello";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await flush();
    expect(input.value).toEqual("hello");
    stop();
    host.remove();
  });

  it("MultiSelect with value={[]} keeps the selected label", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const stop = mount(
      () => (
        <MultiSelect
          value={[]}
          options={[
            { value: "a", label: "选项 A" },
            { value: "b", label: "选项 B" },
          ]}
          placeholder="请选择"
        />
      ),
      host,
    );
    await flush();
    const trigger = host.querySelector(
      'button[aria-haspopup="listbox"]',
    ) as HTMLButtonElement;
    expect(trigger).toBeTruthy();
    trigger.click();
    await flush();
    const option = [...host.querySelectorAll('[role="option"]')].find((el) =>
      (el.textContent || "").includes("选项 A")
    ) as HTMLElement;
    expect(option).toBeTruthy();
    option.click();
    await flush();
    expect((trigger.textContent || "").includes("选项 A")).toEqual(true);
    stop();
    host.remove();
  });

  it("Rate with a literal value can change the score", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const stop = mount(
      () => <Rate value={3} count={5} name="score" />,
      host,
    );
    await flush();
    const hidden = host.querySelector(
      "input[type=hidden][name=score]",
    ) as HTMLInputElement;
    const root = host.querySelector('[role="slider"]') as HTMLElement;
    expect(hidden).toBeTruthy();
    expect(hidden.value).toEqual("3");
    const stars = host.querySelectorAll('[role="button"]');
    expect(stars.length).toEqual(5);
    (stars[0] as HTMLElement).click();
    await flush();
    expect(hidden.value).toEqual("1");
    expect(root.getAttribute("aria-valuenow")).toEqual("1");
    stop();
    host.remove();
  });
});
