import { describe, expect, it } from "@dreamer/test";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, eventually, open, section, value, visible } from "./driver.ts";

describe("Search number physical", () => {
  it(
    "物理操作 Search：逐字输入不搜索、Enter与按钮各一次、清空与再搜索",
    async (t) => {
      const page = await open(t, "/desktop/form/search");
      const logs: string[] = [];
      page.on("console", (m) => {
        if (m.text().startsWith("搜索:")) logs.push(m.text());
      });
      const demo = section(page, "基础（带 onSearch 时显示搜索与清除）");
      const input = demo.locator("input");
      await input.pressSequentially("keyword");
      await value(input, "keyword");
      expect(await input.evaluate((el) => el === document.activeElement)).toBe(
        true,
      );
      expect(logs).toEqual([]);
      await input.press("Enter");
      await eventually(() => logs.length === 1);
      expect(logs[0]).toBe("搜索: keyword");
      await demo.getByRole("button", { name: "搜索", exact: true }).click();
      await eventually(() => logs.length === 2);
      expect(logs[1]).toBe("搜索: keyword");
      await demo.getByRole("button", { name: "清除", exact: true }).click();
      await value(input, "");
      expect(logs.length).toBe(2);
      await visible(
        demo.getByRole("button", { name: "清除", exact: true }),
        false,
      );
      await input.fill("second");
      await input.press("Enter");
      await eventually(() => logs.length === 3);
      expect(logs[2]).toBe("搜索: second");
    },
    DOCS_BROWSER_CONFIG,
  );

  it("物理操作 Search：仅输入无按钮、失焦才回调、禁用、关闭清除", async (t) => {
    const page = await open(t, "/desktop/form/search");
    const logs: string[] = [];
    page.on("console", (m) => {
      if (m.text().startsWith("失焦搜索:")) logs.push(m.text());
    });
    const plain = section(page, "仅输入（无 onSearch，无搜索/清除按钮）");
    await plain.locator("input").pressSequentially("plain input");
    await value(plain.locator("input"), "plain input");
    expect(
      await plain.getByRole("button", { name: "搜索", exact: true }).count(),
    )
      .toBe(0);
    expect(
      await plain.getByRole("button", { name: "清除", exact: true }).count(),
    )
      .toBe(0);
    const blur = section(page, "失焦再请求（onBlur）");
    const input = blur.locator("input");
    await input.pressSequentially("blur keyword");
    expect(logs).toEqual([]);
    await page.getByRole("heading", { name: "Search 搜索框", exact: true })
      .click();
    await eventually(() => logs.length === 1);
    expect(logs[0]).toBe("失焦搜索: blur keyword");
    expect(await section(page, "disabled").locator("input").isDisabled()).toBe(
      true,
    );
    await value(section(page, "disabled").locator("input"), "");
    const off = section(page, "关闭清除按钮");
    await off.locator("input").fill("cannot clear by button");
    await value(off.locator("input"), "cannot clear by button");
    expect(await off.getByRole("button", { name: "清除", exact: true }).count())
      .toBe(0);
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 Search：四尺寸逐字输入、几何、自动聚焦", async (t) => {
    const page = await open(t, "/desktop/form/search");
    expect(
      await page.locator("#docs-autofocus-search").evaluate((el) =>
        el === document.activeElement
      ),
    ).toBe(true);
    const heights = [];
    for (const size of ["xs", "sm", "md", "lg"]) {
      const input = section(page, "size").getByPlaceholder(size, {
        exact: true,
      });
      await input.pressSequentially(size + "123");
      await value(input, size + "123");
      const box = await input.boundingBox();
      if (!box) throw new Error("size missing");
      heights.push(box.height);
    }
    for (let i = 1; i < 4; i++) expect(heights[i] > heights[i - 1]).toBe(true);
    await page.locator("#docs-autofocus-search").fill("focused editable");
    await value(page.locator("#docs-autofocus-search"), "focused editable");
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 Search：表单空值校验、成功提交与清空后再次失败", async (t) => {
    const page = await open(t, "/desktop/form/search");
    const demo = section(page, "与 createForm");
    const input = demo.locator("input"),
      submit = demo.getByRole("button", { name: "校验", exact: true });
    await submit.click();
    await visible(demo.getByText("此项为必填", { exact: true }));
    await attr(input, "aria-invalid", "true");
    await input.fill("form keyword");
    await submit.click();
    await visible(page.getByText("ok", { exact: true }));
    await visible(demo.getByText("此项为必填", { exact: true }), false);
    await input.fill("");
    await submit.click();
    await visible(demo.getByText("此项为必填", { exact: true }));
  }, DOCS_BROWSER_CONFIG);

  it(
    "物理操作 InputNumber：按钮和方向键步进、min/max禁用及失焦夹取",
    async (t) => {
      const page = await open(t, "/desktop/form/input-number");
      const demo = section(page, "步进按钮 + min/max/step");
      const input = demo.locator("input"),
        up = demo.getByRole("button", { name: "增加", exact: true }),
        down = demo.getByRole("button", { name: "减少", exact: true });
      await value(input, "10");
      await up.click();
      await value(input, "15");
      await down.click();
      await value(input, "10");
      await input.focus();
      await input.press("ArrowUp");
      await value(input, "15");
      await input.press("ArrowDown");
      await value(input, "10");
      await input.fill("99");
      await input.press("Tab");
      await up.click();
      await value(input, "100");
      expect(await up.isDisabled()).toBe(true);
      await input.focus();
      await input.press("ArrowUp");
      await value(input, "100");
      await input.fill("-3");
      await input.press("Tab");
      await value(input, "0");
      expect(await down.isDisabled()).toBe(true);
      await input.fill("105");
      await input.press("Tab");
      await value(input, "100");
    },
    DOCS_BROWSER_CONFIG,
  );

  it("物理操作 InputNumber：小数精确步进、空值输入清除、禁用", async (t) => {
    const page = await open(t, "/desktop/form/input-number");
    const demo = section(page, "小数步进（step=0.1）");
    const input = demo.locator("input"),
      up = demo.getByRole("button", { name: "增加", exact: true });
    await value(input, "0");
    await up.click();
    await up.click();
    await up.click();
    await value(input, "0.3");
    await demo.getByRole("button", { name: "减少", exact: true }).click();
    await value(input, "0.2");
    await input.focus();
    await input.press("ArrowUp");
    await value(input, "0.3");
    const empty = section(page, "placeholder").getByPlaceholder("请输入数量", {
      exact: true,
    });
    await value(empty, "");
    await empty.pressSequentially("42");
    await value(empty, "42");
    await empty.fill("");
    await empty.press("Tab");
    await value(empty, "");
    const disabled = section(page, "disabled");
    expect(await disabled.locator("input").isDisabled()).toBe(true);
    await value(disabled.locator("input"), "99");
    expect(
      await disabled.getByRole("button", { name: "增加", exact: true })
        .isDisabled(),
    ).toBe(true);
    expect(
      await disabled.getByRole("button", { name: "减少", exact: true })
        .isDisabled(),
    ).toBe(true);
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 InputNumber：四尺寸独立步进、几何及自动聚焦", async (t) => {
    const page = await open(t, "/desktop/form/input-number");
    expect(
      await page.locator("#docs-autofocus-input-number").evaluate((el) =>
        el === document.activeElement
      ),
    ).toBe(true);
    const demo = section(page, "size（xs / sm / md / lg）");
    const inputs = demo.locator("input"),
      up = demo.getByRole("button", { name: "增加", exact: true });
    const heights = [];
    expect(await inputs.count()).toBe(4);
    for (let i = 0; i < 4; i++) {
      const input = inputs.nth(i);
      const before = Number(await input.inputValue());
      await up.nth(i).click();
      await value(input, String(before + 1));
      const box = await input.boundingBox();
      if (!box) throw new Error("size missing");
      heights.push(box.height);
    }
    for (let i = 1; i < 4; i++) expect(heights[i] > heights[i - 1]).toBe(true);
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 InputNumber：前后缀、精度和格式化聚焦/失焦往返", async (t) => {
    const page = await open(t, "/desktop/form/input-number");
    const demo = section(page, "前缀、精度与格式化");
    const input = demo.locator("input");
    await value(input, "1,234.57");
    await visible(demo.locator("span").getByText("¥", { exact: true }));
    await visible(demo.getByText("元", { exact: true }));
    await input.focus();
    await value(input, "1234.567");
    await input.fill("2345.678");
    await input.press("Tab");
    await value(input, "2,345.68");
    await input.focus();
    await value(input, "2345.68");
    await demo.getByRole("button", { name: "增加", exact: true }).click();
    await input.blur();
    // stepInputNumberValue 的既有契约：按 step=1 的精度先舍入再步进，
    // precision=2 仅用于失焦展示，并不覆盖步进网格（单元测试也固定此规则）。
    await value(input, "2,347");
    await input.focus();
    await value(input, "2347");
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 InputNumber：表单空值校验及数量提交", async (t) => {
    const page = await open(t, "/desktop/form/input-number");
    const demo = section(page, "与 createForm");
    const input = demo.locator("input"),
      submit = demo.getByRole("button", { name: "校验", exact: true });
    await submit.click();
    await visible(demo.getByText("此项为必填", { exact: true }));
    await input.fill("12");
    await submit.click();
    await visible(page.getByText("ok", { exact: true }));
    await visible(demo.getByText("此项为必填", { exact: true }), false);
    await value(input, "12");
  }, DOCS_BROWSER_CONFIG);
});
