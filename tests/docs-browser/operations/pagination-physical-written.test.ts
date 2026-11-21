/** WRITTEN-UNRUN. Eight live Pagination examples; headings use browser-decoded quote entities. */
import { describe, expect, it } from "@dreamer/test";
import type { TestContext } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, open } from "./driver.ts";

// Pagination renders a nav directly (not a div preview wrapper).
const example = (page: Page, title: string) =>
  page.getByRole("heading", { name: title, exact: true }).locator("..");

const FULL = 'preset="full"（全部能力）';
const DEFAULT = 'preset="default"（一般能力）';
const SIMPLE = 'preset="simple"（极简）';

const navOf = (root: Locator) =>
  root.getByRole("navigation", { name: "分页" }).first();

async function openPage(t: TestContext | undefined): Promise<Page> {
  if (!t?.browser?.page) {
    throw new Error("Physical tests require Playwright Page");
  }
  await (t.browser.page as Page).context().clearCookies({ name: "pageSize" });
  return await open(t, "/desktop/navigation/pagination");
}

async function currentPage(nav: Locator) {
  return await nav.locator("[aria-current='page']").innerText();
}

async function pageButtons(nav: Locator) {
  return await nav.locator("button[data-testid^='pagination-page-']")
    .evaluateAll((es) =>
      es.map((e) => ({
        text: (e.textContent ?? "").trim(),
        current: e.getAttribute("aria-current"),
        disabled: (e as HTMLButtonElement).disabled,
      }))
    );
}

async function btnSize(nav: Locator) {
  const btn = nav.locator("[data-testid='pagination-next']");
  return await btn.evaluate((e) => {
    const c = getComputedStyle(e);
    const icon = e.querySelector("svg");
    const ic = icon ? getComputedStyle(icon) : undefined;
    return {
      height: Math.round((e as HTMLElement).getBoundingClientRect().height),
      font: c.fontSize,
      icon: ic ? Math.round(parseFloat(ic.width)) : 0,
    };
  });
}

async function choosePageSize(p: Page, nav: Locator, n: number) {
  const trigger = nav.getByTestId("pagination-pagesize").locator(
    'button[aria-haspopup="listbox"]',
  );
  await trigger.click();
  const option = p.getByRole("option", { name: `${n} 条/页` });
  await eventually(async () => await option.isVisible());
  await option.click();
  await eventually(async () =>
    (await trigger.innerText()).replace(/\s+/g, "") === `${n}条/页`
  );
}

describe("Pagination physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `Pagination preset full @${width}：共 120 条，翻到末页、跳至第 5 页`,
      async (t) => {
        const p = await openPage(t);
        await p.setViewportSize({ width, height: 900 });
        const nav = navOf(example(p, FULL));
        expect(await nav.getAttribute("data-pagination-preset")).toBe("full");
        expect(await nav.getAttribute("data-pagination-size")).toBe("md");
        expect((await nav.innerText()).includes("共 120 条")).toBe(true);
        expect(await nav.getByTestId("pagination-first").isDisabled()).toBe(
          true,
        );
        expect(await nav.getByTestId("pagination-prev").isDisabled()).toBe(
          true,
        );
        expect(await nav.getByTestId("pagination-next").isDisabled()).toBe(
          false,
        );
        expect(await nav.getByTestId("pagination-last").isDisabled()).toBe(
          false,
        );
        expect((await pageButtons(nav)).map((b) => b.text)).toEqual([
          "1",
          "2",
          "12",
        ]);
        expect(await nav.locator("span", { hasText: "…" }).count()).toBe(1);
        expect(await currentPage(nav)).toBe("1");
        expect(await nav.getByTestId("pagination-jump").innerText()).toContain(
          "跳至",
        );
        expect(await nav.getByTestId("pagination-jump").innerText()).toContain(
          "页",
        );
        expect(
          (await nav.getByTestId("pagination-pagesize").innerText()).replace(
            /\s+/g,
            "",
          ),
        ).toBe("10条/页");

        await nav.getByTestId("pagination-next").click();
        await eventually(async () => await currentPage(nav) === "2");
        expect(await nav.getByTestId("pagination-first").isDisabled()).toBe(
          false,
        );
        await nav.getByTestId("pagination-last").click();
        await eventually(async () => await currentPage(nav) === "12");
        expect(await nav.getByTestId("pagination-next").isDisabled()).toBe(
          true,
        );
        expect(await nav.getByTestId("pagination-last").isDisabled()).toBe(
          true,
        );
        expect(await nav.getByTestId("pagination-prev").isDisabled()).toBe(
          false,
        );
        expect((await pageButtons(nav)).map((b) => b.text)).toEqual([
          "1",
          "11",
          "12",
        ]);

        await nav.getByTestId("pagination-jump").locator("input").fill("5");
        await nav.getByTestId("pagination-jump").locator("input").press(
          "Enter",
        );
        await eventually(async () => await currentPage(nav) === "5");
        expect((await pageButtons(nav)).map((b) => b.text)).toEqual([
          "1",
          "4",
          "5",
          "6",
          "12",
        ]);
        expect(await nav.locator("span", { hasText: "…" }).count()).toBe(2);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Pagination preset default @${width}：无首页末页与跳转，点第 3 页`,
      async (t) => {
        const p = await openPage(t);
        await p.setViewportSize({ width, height: 900 });
        const nav = navOf(example(p, DEFAULT));
        expect(await nav.getAttribute("data-pagination-preset")).toBe(
          "default",
        );
        expect(await nav.getByTestId("pagination-first").count()).toBe(0);
        expect(await nav.getByTestId("pagination-last").count()).toBe(0);
        expect(await nav.getByTestId("pagination-jump").count()).toBe(0);
        expect(await nav.getByTestId("pagination-pagesize").count()).toBe(0);
        expect((await nav.innerText()).includes("共 120 条")).toBe(false);
        expect(await nav.getByTestId("pagination-prev").isDisabled()).toBe(
          true,
        );
        // At page 1 the compact range is 1,2,…,12. Reach page 2 first,
        // then verify the newly visible page 3 (not a nonexistent initial button).
        expect((await pageButtons(nav)).map((button) => button.text)).toEqual([
          "1",
          "2",
          "12",
        ]);
        await nav.getByTestId("pagination-page-2").click();
        await eventually(async () => await currentPage(nav) === "2");
        await nav.getByTestId("pagination-page-3").click();
        await eventually(async () => await currentPage(nav) === "3");
        expect(await nav.getByTestId("pagination-prev").isDisabled()).toBe(
          false,
        );
        expect(await nav.getByTestId("pagination-next").isDisabled()).toBe(
          false,
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Pagination preset simple @${width}：第 n / m 页，无数字页码`,
      async (t) => {
        const p = await openPage(t);
        await p.setViewportSize({ width, height: 900 });
        const nav = navOf(example(p, SIMPLE));
        expect(await nav.getAttribute("data-pagination-preset")).toBe("simple");
        expect(await nav.getByTestId("pagination-simple-current").innerText())
          .toBe("第 1 / 12 页");
        expect(await nav.locator("[data-testid^='pagination-page-']").count())
          .toBe(0);
        expect(await nav.getByTestId("pagination-first").count()).toBe(0);
        expect(await nav.getByTestId("pagination-last").count()).toBe(0);
        expect(await nav.getByTestId("pagination-jump").count()).toBe(0);
        await nav.getByTestId("pagination-next").click();
        await eventually(async () =>
          (await nav.getByTestId("pagination-simple-current").innerText()) ===
            "第 2 / 12 页"
        );
        await nav.getByTestId("pagination-prev").click();
        await eventually(async () =>
          (await nav.getByTestId("pagination-simple-current").innerText()) ===
            "第 1 / 12 页"
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Pagination totalPages @${width}：共 5 页，点第 5 页后下一页禁用`,
      async (t) => {
        const p = await openPage(t);
        await p.setViewportSize({ width, height: 900 });
        const nav = navOf(example(p, "totalPages 直接指定总页数"));
        expect((await pageButtons(nav)).map((b) => b.text)).toEqual([
          "1",
          "2",
          "3",
          "4",
          "5",
        ]);
        expect((await nav.innerText()).includes("共")).toBe(false);
        await nav.getByTestId("pagination-page-5").click();
        await eventually(async () => await currentPage(nav) === "5");
        expect(await nav.getByTestId("pagination-next").isDisabled()).toBe(
          true,
        );
        expect(await nav.getByTestId("pagination-prev").isDisabled()).toBe(
          false,
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Pagination disabled @${width}：受控第 2 页，坐标点击第 3 页无效`,
      async (t) => {
        const p = await openPage(t);
        await p.setViewportSize({ width, height: 900 });
        const nav = navOf(example(p, "disabled"));
        expect(await currentPage(nav)).toBe("2");
        const buttons = nav.locator("button");
        const count = await buttons.count();
        expect(count > 0).toBe(true);
        for (let i = 0; i < count; i++) {
          expect(await buttons.nth(i).isDisabled()).toBe(true);
        }
        const box = await nav.getByTestId("pagination-page-3").boundingBox();
        expect(box != null).toBe(true);
        await p.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
        expect(await currentPage(nav)).toBe("2");
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Pagination syncUrl @${width}：翻页与改条数写入 ?page=&pageSize=`,
      async (t) => {
        const p = await openPage(t);
        await p.setViewportSize({ width, height: 900 });
        const nav = navOf(
          example(p, "syncUrl（与 URL ?page=1&pageSize=10 同步）"),
        );
        expect(new URL(p.url()).searchParams.get("page")).toBe(null);
        await nav.getByTestId("pagination-next").click();
        await eventually(async () => await currentPage(nav) === "2");
        await eventually(() => {
          const u = new URL(p.url());
          return u.searchParams.get("page") === "2" &&
            u.searchParams.get("pageSize") === "10";
        });
        await choosePageSize(p, nav, 20);
        await eventually(async () => await currentPage(nav) === "1");
        const u = new URL(p.url());
        expect(u.searchParams.get("page")).toBe("1");
        expect(u.searchParams.get("pageSize")).toBe("20");
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Pagination 尺寸 size @${width}：xs/sm/md/lg 按钮高度与字号递进，仅 xs 翻页`,
      async (t) => {
        const p = await openPage(t);
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "尺寸 size（xs｜sm｜md｜lg）");
        const sized = (label: string) =>
          root.locator("div.space-y-2").filter({ hasText: label })
            .getByRole("navigation", { name: "分页" });
        const xs = await sized("xs");
        const sm = await sized("sm");
        const md = await sized("md（默认）");
        const lg = await sized("lg");
        expect(await xs.getAttribute("data-pagination-size")).toBe("xs");
        expect(await sm.getAttribute("data-pagination-size")).toBe("sm");
        expect(await md.getAttribute("data-pagination-size")).toBe("md");
        expect(await lg.getAttribute("data-pagination-size")).toBe("lg");
        const xsBtn = await btnSize(xs);
        const smBtn = await btnSize(sm);
        const mdBtn = await btnSize(md);
        const lgBtn = await btnSize(lg);
        expect(xsBtn).toEqual({ height: 24, font: "12px", icon: 12 });
        expect(smBtn).toEqual({ height: 28, font: "12px", icon: 14 });
        expect(mdBtn).toEqual({ height: 32, font: "14px", icon: 16 });
        expect(lgBtn).toEqual({ height: 40, font: "16px", icon: 20 });
        await xs.getByTestId("pagination-next").click();
        await eventually(async () => await currentPage(xs) === "2");
        expect(await currentPage(sm)).toBe("1");
        expect(await currentPage(md)).toBe("1");
        expect(await currentPage(lg)).toBe("1");
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Pagination 每页条数 Select @${width}：无原生 select，改 50 条后回到第 1 页`,
      async (t) => {
        const p = await openPage(t);
        await p.setViewportSize({ width, height: 900 });
        const nav = navOf(example(p, "每页条数：库内 Select（无原生 select）"));
        expect(await nav.locator("select").count()).toBe(0);
        expect((await nav.innerText()).includes("共 120 条")).toBe(true);
        await nav.getByTestId("pagination-page-2").click();
        await eventually(async () => await currentPage(nav) === "2");
        await choosePageSize(p, nav, 50);
        await eventually(async () => await currentPage(nav) === "1");
        expect(
          (await nav.getByTestId("pagination-pagesize").innerText()).replace(
            /\s+/g,
            "",
          ),
        ).toBe("50条/页");
        expect((await pageButtons(nav)).map((b) => b.text)).toEqual([
          "1",
          "2",
          "3",
        ]);
        await nav.getByTestId("pagination-page-3").click();
        await eventually(async () => await currentPage(nav) === "3");
        expect(await nav.getByTestId("pagination-next").isDisabled()).toBe(
          true,
        );
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
