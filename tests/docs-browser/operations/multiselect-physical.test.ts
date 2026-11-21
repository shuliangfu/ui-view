/** Real Playwright input; no handler calls or dispatchEvent substitutes. */
import { describe, expect, it } from "@dreamer/test";
import { attr, open, section, visible } from "./driver.ts";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";

describe("MultiSelect physical", () => {
  it("物理操作 MultiSelect：按住跨定时器后释放不得反选", async (t) => {
    const page = await open(t, "/desktop/form/multiselect");
    const demo = page.locator('[data-multiselect-demo="select-all"]');
    await demo.getByRole("button", { name: "请选择", exact: true }).click();
    const option = page.getByRole("option", { name: "选项 A", exact: true });
    await option.click({ delay: 150 });
    expect(await option.getAttribute("aria-selected")).toBe("true");
    await option.click({ delay: 150 });
    expect(await option.getAttribute("aria-selected")).toBe("false");
  }, DOCS_BROWSER_CONFIG);

  it(
    "物理操作 MultiSelect：全选清空、完成、快捷键、外部关闭与重开持久化",
    async (t) => {
      const page = await open(t, "/desktop/form/multiselect");
      const demo = page.locator('[data-multiselect-demo="select-all"]');
      const trigger = demo.locator('button[aria-haspopup="listbox"]');
      await trigger.click();
      const list = page.getByRole("listbox");
      const a = list.getByRole("option", { name: "选项 A", exact: true });
      const b = list.getByRole("option", { name: "选项 B", exact: true });
      const c = list.getByRole("option", { name: "选项 C", exact: true });
      expect(
        await list.getByRole("button", { name: "清空", exact: true })
          .isDisabled(),
      ).toBe(true);
      await list.getByRole("button", { name: "全选", exact: true }).click();
      await attr(a, "aria-selected", "true");
      await attr(b, "aria-selected", "true");
      await attr(c, "aria-selected", "false");
      expect(
        await list.getByRole("button", { name: "全选", exact: true })
          .isDisabled(),
      ).toBe(true);
      await list.getByRole("button", { name: "清空", exact: true }).click();
      await attr(a, "aria-selected", "false");
      await attr(b, "aria-selected", "false");
      await a.click();
      await list.getByRole("button", { name: "完成", exact: true }).click();
      await attr(trigger, "aria-expanded", "false");
      expect(await trigger.textContent()).toContain("选项 A");
      await trigger.click();
      await attr(a, "aria-selected", "true");
      await page.keyboard.press("Escape");
      await attr(trigger, "aria-expanded", "false");
      await trigger.focus();
      await page.keyboard.press("Control+a");
      expect(await trigger.textContent()).toContain("选项 B");
      await page.keyboard.press("Control+a");
      expect((await trigger.textContent())?.trim()).toBe("请选择");
      await trigger.click();
      // The fixed backdrop is the intended outside-click target, not the covered heading.
      await page.mouse.click(5, 200);
      await attr(trigger, "aria-expanded", "false");
    },
    DOCS_BROWSER_CONFIG,
  );

  it("物理操作 MultiSelect：默认值与禁用项、禁用控件", async (t) => {
    const page = await open(t, "/desktop/form/multiselect");
    const demo = section(page, "有默认选中 + 选项含 disabled");
    const trigger = demo.locator('button[aria-haspopup="listbox"]');
    expect(await trigger.textContent()).toContain("选项 A、选项 B");
    await trigger.click();
    const a = page.getByRole("option", { name: "选项 A", exact: true });
    const c = page.getByRole("option", { name: "选项 C", exact: true });
    await attr(a, "aria-selected", "true");
    await attr(c, "aria-disabled", "true");
    // role=option aria-disabled is intentionally non-actionable: mouse tests the actual hit target.
    const box = await c.boundingBox();
    if (!box) throw new Error("disabled option missing");
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, {
      delay: 80,
    });
    await attr(c, "aria-selected", "false");
    await attr(a, "aria-selected", "true");
    await a.click();
    await attr(a, "aria-selected", "false");
    await page.keyboard.press("Escape");
    const disabled = section(page, "disabled").locator(
      'button[aria-haspopup="listbox"]',
    );
    expect(await disabled.isDisabled()).toBe(true);
    expect(await disabled.textContent()).toContain("选项 A");
    await disabled.scrollIntoViewIfNeeded();
    const disabledBox = await disabled.boundingBox();
    if (!disabledBox) throw new Error("disabled trigger missing");
    await page.mouse.click(disabledBox.x + 10, disabledBox.y + 10);
    await attr(disabled, "aria-expanded", "false");
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 MultiSelect：四种尺寸逐个选中、完成与重开", async (t) => {
    const page = await open(t, "/desktop/form/multiselect");
    const triggers = section(page, "size（xs / sm / md / lg）").locator(
      'button[aria-haspopup="listbox"]',
    );
    expect(await triggers.count()).toBe(4);
    const heights: number[] = [];
    for (let i = 0; i < 4; i++) {
      const trigger = triggers.nth(i);
      await trigger.scrollIntoViewIfNeeded();
      const bounds = await trigger.boundingBox();
      if (!bounds) throw new Error("size trigger missing");
      heights.push(bounds.height);
      await trigger.click();
      await page.getByRole("option", { name: "选项 B", exact: true }).click({
        delay: 60,
      });
      await page.getByRole("button", { name: "完成", exact: true }).click();
      expect(await trigger.textContent()).toContain("选项 B");
      await trigger.click();
      await attr(
        page.getByRole("option", { name: "选项 B", exact: true }),
        "aria-selected",
        "true",
      );
      await page.keyboard.press("Escape");
    }
    for (let i = 1; i < heights.length; i++) {
      expect(heights[i] > heights[i - 1]).toBe(true);
    }
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 MultiSelect：搜索、无匹配、清除、加载禁用", async (t) => {
    const page = await open(t, "/desktop/form/multiselect");
    const demo = section(page, "清除、搜索与加载");
    const trigger = demo.locator('button[aria-haspopup="listbox"]').first();
    await trigger.click();
    const list = page.getByRole("listbox");
    const search = list.locator('input[type="search"]');
    await search.fill("选项 B");
    expect(await list.getByRole("option").count()).toBe(1);
    await attr(
      list.getByRole("option", { name: "选项 B", exact: true }),
      "aria-selected",
      "true",
    );
    await search.fill("not-a-match");
    expect(await list.getByRole("option").count()).toBe(0);
    await visible(list.getByText("无匹配选项", { exact: true }));
    await search.fill("");
    expect(await list.getByRole("option").count()).toBe(3);
    await list.getByRole("button", { name: "完成", exact: true }).click();
    await demo.getByRole("button", { name: "清空", exact: true }).click();
    expect((await trigger.textContent())?.trim()).toBe("可搜索并清除");
    await trigger.click();
    await attr(
      list.getByRole("option", { name: "选项 A", exact: true }),
      "aria-selected",
      "false",
    );
    expect(await search.inputValue()).toBe("");
    await page.keyboard.press("Escape");
    const loading = demo.locator('button[aria-haspopup="listbox"]').nth(1);
    expect(await loading.isDisabled()).toBe(true);
    await attr(loading, "aria-busy", "true");
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 MultiSelect：表单空值校验、选择后提交", async (t) => {
    const page = await open(t, "/desktop/form/multiselect");
    const demo = section(page, "与 createForm");
    await demo.getByRole("button", { name: "提交", exact: true }).click();
    await visible(demo.getByText("请至少选一项", { exact: true }));
    await demo.locator('button[aria-haspopup="listbox"]').click();
    await page.getByRole("option", { name: "选项 A", exact: true }).click({
      delay: 100,
    });
    await page.getByRole("button", { name: "完成", exact: true }).click();
    await demo.getByRole("button", { name: "提交", exact: true }).click();
    await visible(page.getByText("已提交", { exact: true }));
    await visible(demo.getByText("请至少选一项", { exact: true }), false);
    expect(await demo.locator('input[name="tags"]').inputValue()).toBe("a");
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 MultiSelect：自动聚焦后可直接打开并选择", async (t) => {
    const page = await open(t, "/desktop/form/multiselect");
    const trigger = page.locator("#docs-autofocus-multiselect");
    expect(await trigger.evaluate((el) => el === document.activeElement)).toBe(
      true,
    );
    await page.keyboard.press("Enter");
    await attr(trigger, "aria-expanded", "true");
    await page.getByRole("option", { name: "选项 A", exact: true }).click();
    await page.getByRole("button", { name: "完成", exact: true }).click();
    expect(await trigger.textContent()).toContain("选项 A");
  }, DOCS_BROWSER_CONFIG);
});
