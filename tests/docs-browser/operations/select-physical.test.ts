import { describe, expect, it } from "@dreamer/test";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, open, section, visible } from "./driver.ts";

describe("Select physical", () => {
  it(
    "物理操作 Select：选择后关闭、共享绑定、重开选中、Escape及外部关闭",
    async (t) => {
      const page = await open(t, "/desktop/form/select");
      const demo = section(page, "placeholder");
      const trigger = demo.locator('button[aria-haspopup="listbox"]');
      await trigger.click();
      await page.getByRole("option", { name: "选项 A", exact: true }).click({
        delay: 100,
      });
      await attr(trigger, "aria-expanded", "false");
      expect(await trigger.textContent()).toContain("选项 A");
      const named = section(page, "name / id");
      expect(await named.locator('input[name="city"]').inputValue()).toBe("a");
      expect(
        await named.locator('button[aria-haspopup="listbox"]').textContent(),
      )
        .toContain("选项 A");
      await trigger.click();
      await attr(
        page.getByRole("option", { name: "选项 A", exact: true }),
        "aria-selected",
        "true",
      );
      await page.keyboard.press("Escape");
      await attr(trigger, "aria-expanded", "false");
      await trigger.click();
      await page.mouse.click(5, 200);
      await attr(trigger, "aria-expanded", "false");
    },
    DOCS_BROWSER_CONFIG,
  );

  it("物理操作 Select：默认值、禁用选项和控件不改变选择", async (t) => {
    const page = await open(t, "/desktop/form/select");
    const trigger = section(page, "有默认值 + 选项含 disabled").locator(
      'button[aria-haspopup="listbox"]',
    );
    expect(await trigger.textContent()).toContain("选项 B");
    await trigger.click();
    const disabledOption = page.getByRole("option", {
      name: "选项 C",
      exact: true,
    });
    expect(await disabledOption.isDisabled()).toBe(true);
    const box = await disabledOption.boundingBox();
    if (!box) throw new Error("disabled option missing");
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, {
      delay: 100,
    });
    await attr(trigger, "aria-expanded", "true");
    expect(await trigger.textContent()).toContain("选项 B");
    await attr(disabledOption, "aria-selected", "false");
    await page.getByRole("option", { name: "选项 A", exact: true }).click();
    expect(await trigger.textContent()).toContain("选项 A");
    const disabled = section(page, "disabled").locator(
      'button[aria-haspopup="listbox"]',
    );
    expect(await disabled.isDisabled()).toBe(true);
    await disabled.scrollIntoViewIfNeeded();
    const rect = await disabled.boundingBox();
    if (!rect) throw new Error("disabled trigger missing");
    await page.mouse.click(rect.x + 5, rect.y + 5);
    await attr(disabled, "aria-expanded", "false");
    expect(await disabled.textContent()).toContain("选项 A");
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 Select：每种尺寸独立选中与自动聚焦键盘展开", async (t) => {
    const page = await open(t, "/desktop/form/select");
    const autofocus = page.locator("#docs-autofocus-select");
    expect(await autofocus.evaluate((el) => el === document.activeElement))
      .toBe(
        true,
      );
    await page.keyboard.press("Enter");
    await page.getByRole("option", { name: "选项 A", exact: true }).click();
    expect(await autofocus.textContent()).toContain("选项 A");
    const triggers = section(page, "size（xs / sm / md / lg）").locator(
      'button[aria-haspopup="listbox"]',
    );
    expect(await triggers.count()).toBe(4);
    const heights = [];
    for (let i = 0; i < 4; i++) {
      const trigger = triggers.nth(i);
      await trigger.click();
      await page.getByRole("option", { name: "选项 B", exact: true }).click({
        delay: 50,
      });
      await attr(trigger, "aria-expanded", "false");
      expect(await trigger.textContent()).toContain("选项 B");
      const box = await trigger.boundingBox();
      if (!box) throw new Error("size missing");
      heights.push(box.height);
    }
    for (let i = 1; i < 4; i++) expect(heights[i] > heights[i - 1]).toBe(true);
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 Select：搜索过滤与无匹配、选中、清除、加载", async (t) => {
    const page = await open(t, "/desktop/form/select");
    const demo = section(page, "清除、搜索与加载");
    const trigger = demo.locator('button[aria-haspopup="listbox"]').first();
    await trigger.click();
    const list = page.getByRole("listbox");
    const search = list.locator('input[type="search"]');
    await search.fill("选项 A");
    expect(await list.getByRole("option", { name: /^选项 / }).count()).toBe(1);
    await search.fill("no match");
    expect(await list.getByRole("option", { name: /^选项 / }).count()).toBe(0);
    await visible(list.getByText("无匹配选项", { exact: true }));
    await search.fill("选项 A");
    await list.getByRole("option", { name: "选项 A", exact: true }).click({
      delay: 100,
    });
    expect(await trigger.textContent()).toContain("选项 A");
    await demo.getByRole("button", { name: "清除", exact: true }).click();
    expect((await trigger.textContent())?.trim()).toBe("可搜索并清除");
    await trigger.click();
    expect(await search.inputValue()).toBe("");
    await attr(
      list.getByRole("option", { name: "选项 A", exact: true }),
      "aria-selected",
      "false",
    );
    await page.keyboard.press("Escape");
    const loading = demo.locator('button[aria-haspopup="listbox"]').nth(1);
    expect(await loading.isDisabled()).toBe(true);
    await attr(loading, "aria-busy", "true");
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 Select：表单校验失败后选择提交成功", async (t) => {
    const page = await open(t, "/desktop/form/select");
    const demo = section(page, "与 createForm");
    await demo.getByRole("button", { name: "校验", exact: true }).click();
    await visible(demo.getByText("此项为必填", { exact: true }));
    await demo.locator('button[aria-haspopup="listbox"]').click();
    await page.getByRole("option", { name: "选项 B", exact: true }).click();
    await demo.getByRole("button", { name: "校验", exact: true }).click();
    await visible(page.getByText("ok", { exact: true }));
    await visible(demo.getByText("此项为必填", { exact: true }), false);
    expect(await demo.locator('input[name="city"]').inputValue()).toBe("b");
  }, DOCS_BROWSER_CONFIG);
});
