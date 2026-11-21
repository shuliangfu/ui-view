import { describe, expect, it } from "@dreamer/test";
import type { Locator } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, open, section, value, visible } from "./driver.ts";
const route = "/desktop/form/transfer";
function column(demo: Locator, side: number) {
  return demo.locator("select").nth(side);
}
async function keys(select: Locator, expected: string[]) {
  const read = () =>
    select.locator("option").evaluateAll((options) =>
      options.map((o) => (o as HTMLOptionElement).value)
    );
  await eventually(async () =>
    JSON.stringify(await read()) === JSON.stringify(expected)
  );
  expect(await read()).toEqual(expected);
}
async function selected(select: Locator, expected: string[]) {
  const read = () =>
    select.evaluate((el) =>
      [...(el as HTMLSelectElement).selectedOptions].map((o) => o.value)
    );
  await eventually(async () =>
    JSON.stringify(await read()) === JSON.stringify(expected)
  );
  expect(await read()).toEqual(expected);
}
async function pick(select: Locator, key: string, meta = false) {
  await select.locator(`option[value="${key}"]`).click({
    delay: 180,
    modifiers: meta ? ["ControlOrMeta"] : [],
  });
}
async function move(demo: Locator, right: boolean) {
  await demo.getByRole("button", { name: right ? "右移" : "左移", exact: true })
    .click({ delay: 180 });
}

describe("Transfer physical", () => {
  it(
    "物理操作 Transfer：原生单选替换、Command多选、双向移动及共享四尺寸状态",
    async (t) => {
      const page = await open(t, route),
        demo = section(page, "基础（无搜索）"),
        left = column(demo, 0),
        right = column(demo, 1);
      await keys(left, ["1", "2", "3", "4", "5", "6"]);
      await keys(right, []);
      await pick(left, "1");
      await selected(left, ["1"]);
      await pick(left, "3");
      await selected(left, ["3"]);
      await pick(left, "4", true);
      await selected(left, ["3", "4"]);
      await visible(demo.getByText("6 项，已选 2", { exact: true }));
      await move(demo, true);
      await keys(left, ["1", "2", "5", "6"]);
      await keys(right, ["3", "4"]);
      await selected(right, []);
      const shared = section(page, "size（xs / sm / md / lg）").locator(
        ".transfer",
      );
      for (let i = 0; i < 4; i++) {
        await keys(column(shared.nth(i), 1), [
          "3",
          "4",
        ]);
      }
      await pick(right, "3");
      await move(demo, false);
      await keys(right, ["4"]);
      await keys(left, ["1", "2", "3", "5", "6"]);
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "物理操作 Transfer：双击移动、Command+A全选、无选择移动全部且跳过disabled",
    async (t) => {
      const page = await open(t, route),
        demo = section(page, "基础（无搜索）"),
        left = column(demo, 0),
        right = column(demo, 1);
      await left.locator('option[value="2"]').dblclick({ delay: 150 });
      await keys(right, ["2"]);
      await right.locator('option[value="2"]').dblclick({ delay: 150 });
      await keys(right, []);
      await left.focus();
      await page.keyboard.press("ControlOrMeta+A");
      await selected(left, ["1", "2", "3", "4", "5"]);
      await move(demo, true);
      await keys(left, ["6"]);
      await keys(right, ["1", "2", "3", "4", "5"]);
      await move(demo, true);
      await keys(right, ["1", "2", "3", "4", "5"]);
      await right.focus();
      await page.keyboard.press("ControlOrMeta+A");
      await selected(right, ["1", "2", "3", "4", "5"]);
      await move(demo, false);
      await keys(left, ["1", "2", "3", "4", "5", "6"]);
      await keys(right, []);
      // No active selection means all enabled visible rows, rather than a fake click-only probe.
      await move(demo, true);
      await keys(left, ["6"]);
      await keys(right, ["1", "2", "3", "4", "5"]);
      await move(demo, false);
      await keys(right, []);
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "物理操作 Transfer：搜索键入不失焦、隐藏选择保留、左右筛选和清空",
    async (t) => {
      const page = await open(t, route),
        demo = section(page, "showSearch 搜索筛选"),
        left = column(demo, 0),
        right = column(demo, 1);
      const search = demo.getByPlaceholder("筛选左侧", { exact: true }),
        reverse = demo.getByPlaceholder("筛选右侧", { exact: true });
      await keys(left, ["1", "3", "5", "6"]);
      await keys(right, ["2", "4"]);
      await pick(left, "1");
      const original = await search.elementHandle();
      await search.click();
      await page.keyboard.type("橙", { delay: 80 });
      await value(search, "橙");
      expect(
        await search.evaluate(
          (el, before) => el === before && el === document.activeElement,
          original,
        ),
      ).toBe(true);
      await keys(left, ["3"]);
      await pick(left, "3");
      await search.fill("");
      await selected(left, ["1", "3"]);
      await search.fill("no-such-fruit");
      await keys(left, []);
      await search.fill("橙");
      await move(demo, true);
      await keys(right, ["1", "2", "3", "4"]);
      await value(search, "橙");
      expect(await search.evaluate((el, before) => el === before, original))
        .toBe(
          true,
        );
      await keys(left, []);
      await search.fill("");
      await keys(left, ["5", "6"]);
      await reverse.fill("葡萄");
      await keys(right, ["4"]);
      await move(demo, false);
      await keys(right, []);
      await reverse.fill("");
      await keys(right, ["1", "2", "3"]);
      await keys(left, ["4", "5", "6"]);
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "物理操作 Transfer：optgroup、分组名搜索、标题不区分大小写和移动",
    async (t) => {
      const page = await open(t, route),
        demo = section(page, "按 group 分组"),
        left = column(demo, 0),
        right = column(demo, 1),
        searches = demo.getByRole("searchbox");
      expect(
        await left.locator("optgroup").evaluateAll((gs) =>
          gs.map((g) => g.getAttribute("label"))
        ),
      ).toEqual(["角色", "权限", "路由"]);
      await keys(right, ["r2"]);
      await searches.nth(0).fill("权限");
      await keys(left, ["p1", "p2"]);
      await left.focus();
      await page.keyboard.press("ControlOrMeta+A");
      await selected(left, ["p1", "p2"]);
      await move(demo, true);
      await keys(right, ["r2", "p1", "p2"]);
      await searches.nth(0).fill("/SETTINGS");
      await keys(left, ["u1"]);
      await searches.nth(0).fill("no-such-group");
      await keys(left, []);
      await searches.nth(0).fill("");
      await keys(left, ["r1", "u1", "u2"]);
      await searches.nth(1).fill("角色");
      await keys(right, ["r2"]);
      await move(demo, false);
      await searches.nth(1).fill("");
      await keys(right, ["p1", "p2"]);
      await keys(left, ["r1", "r2", "u1", "u2"]);
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "物理操作 Transfer：disabled项真实命中、整组禁用、受控目标可往返",
    async (t) => {
      const page = await open(t, route),
        demo = section(page, "dataSource 含 disabled 项 / 整组 disabled"),
        transfers = demo.locator(".transfer"),
        active = transfers.nth(0),
        blocked = transfers.nth(1);
      const left = column(active, 0),
        right = column(active, 1),
        disabled = left.locator('option[value="6"]');
      await keys(right, ["1"]);
      expect(await disabled.isDisabled()).toBe(true);
      await disabled.scrollIntoViewIfNeeded();
      const b = await disabled.boundingBox();
      if (!b) throw new Error("disabled option missing geometry");
      await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2, {
        delay: 180,
      });
      expect(
        await disabled.evaluate((el) => (el as HTMLOptionElement).selected),
      )
        .toBe(false);
      await move(active, true);
      await keys(left, ["6"]);
      await keys(right, ["1", "2", "3", "4", "5"]);
      await move(active, false);
      await keys(right, []);
      for (const select of await blocked.locator("select").all()) {
        expect(await select.isDisabled()).toBe(true);
        await select.scrollIntoViewIfNeeded();
        const box = await select.boundingBox();
        if (!box) throw new Error("disabled select missing");
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, {
          delay: 180,
        });
        await page.keyboard.press("ArrowDown");
      }
      for (const button of await blocked.getByRole("button").all()) {
        expect(
          await button.isDisabled(),
        ).toBe(true);
      }
      await keys(column(blocked, 0), ["3", "4", "5", "6"]);
      await keys(column(blocked, 1), ["1", "2"]);
    },
    DOCS_BROWSER_CONFIG,
  );

  it("物理操作 Transfer：四尺寸分别移动、120px列表与响应式方向", async (t) => {
    const page = await open(t, route),
      demos = section(page, "size（xs / sm / md / lg）").locator(".transfer"),
      viewport = page.viewportSize();
    try {
      await page.setViewportSize({ width: 1280, height: 900 });
      expect(await demos.count()).toBe(4);
      const fonts = ["12px", "14px", "14px", "16px"];
      for (let i = 0; i < 4; i++) {
        const demo = demos.nth(i),
          left = column(demo, 0),
          right = column(demo, 1);
        expect(
          await left.locator("option").first().evaluate((el) =>
            getComputedStyle(el).fontSize
          ),
        ).toBe(fonts[i]);
        const box = await left.locator("xpath=../..").boundingBox();
        if (!box) throw new Error("sized list missing");
        expect(Math.round(box.height)).toBe(120);
        await pick(left, String(i + 1));
        await move(demo, true);
        await keys(right, [String(i + 1)]);
        await pick(right, String(i + 1));
        await move(demo, false);
        await keys(right, []);
      }
      expect(
        await demos.first().evaluate((el) =>
          getComputedStyle(el).flexDirection
        ),
      ).toBe("row");
      await page.setViewportSize({ width: 600, height: 900 });
      expect(
        await demos.first().evaluate((el) =>
          getComputedStyle(el).flexDirection
        ),
      ).toBe("column");
      await pick(column(demos.first(), 0), "1");
      await move(demos.first(), true);
      await keys(column(demos.first(), 1), ["1"]);
    } finally {
      if (viewport) await page.setViewportSize(viewport);
    }
  }, DOCS_BROWSER_CONFIG);

  it(
    "物理操作 Transfer：表单空提交失败、移动绑定后成功、全部移回再失败",
    async (t) => {
      const page = await open(t, route),
        demo = section(page, "与 createForm"),
        send = demo.getByRole("button", { name: "提交", exact: true });
      await send.click();
      await visible(demo.getByText("请至少选择一项", { exact: true }));
      await pick(column(demo, 0), "3");
      await move(demo, true);
      await keys(column(demo, 1), ["3"]);
      await send.click();
      await visible(page.getByText("已提交", { exact: true }));
      await visible(demo.getByText("请至少选择一项", { exact: true }), false);
      await move(demo, false);
      await keys(column(demo, 1), []);
      await send.click();
      await visible(demo.getByText("请至少选择一项", { exact: true }));
    },
    DOCS_BROWSER_CONFIG,
  );
});
