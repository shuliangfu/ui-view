import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, eventually, open, value, visible } from "./driver.ts";
const route = "/desktop/data-display/data-panel";
const names = [
  "Alice",
  "Bob",
  "Carol",
  "David",
  "Eve",
  "Frank",
  "Grace",
  "Heidi",
  "Ivan",
  "Judy",
  "Mallory",
  "Niaj",
  "Olivia",
  "Peggy",
  "Rupert",
  "Sybil",
  "Trent",
  "Victor",
  "Walter",
  "Zoe",
  "Liang",
  "Wei",
  "Mei",
  "Chen",
  "Hao",
];
const ids = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => String(from + i));
async function rows(panel: Locator, expected: string[]) {
  const read = () =>
    panel.locator('[data-testid^="dp-row-"]').evaluateAll((els) =>
      els.map((el) => el.getAttribute("data-testid")!.slice(7))
    );
  await eventually(async () =>
    JSON.stringify(await read()) === JSON.stringify(expected)
  );
  expect(await read()).toEqual(expected);
}
async function total(panel: Locator, n: number) {
  await eventually(async () =>
    (await panel.getByTestId("dp-total-count").textContent())?.trim() ===
      `共 ${n} 条记录`
  );
}
async function pick(page: Page, scope: Locator, prop: string, label: string) {
  await scope.getByTestId("dp-f-" + prop).locator(
    'button[aria-haspopup="listbox"]',
  ).click({ delay: 160 });
  await page.getByRole("option", { name: label, exact: true }).click({
    delay: 180,
  });
}
async function url(page: Page, entries: Record<string, string | null>) {
  try {
    await eventually(() =>
      Object.entries(entries).every(([key, v]) =>
        new URL(page.url()).searchParams.get(key) === v
      )
    );
  } catch {
    throw new Error(
      "Query mismatch: " +
        JSON.stringify({
          expected: entries,
          actual: Object.fromEntries(new URL(page.url()).searchParams),
        }),
    );
  }
  for (const [key, v] of Object.entries(entries)) {
    expect(new URL(page.url()).searchParams.get(key)).toBe(v);
  }
}
function searchDialog(page: Page) {
  return page.getByRole("dialog").filter({
    has: page.getByTestId("dp-search"),
  });
}
describe("DataPanel query physical", () => {
  for (const mode of ["modal", "expand"] as const) {
    it(
      "物理操作 DataPanel搜索 " + mode +
        "：姓名/角色/状态精确筛选、无匹配、重置、取消草稿",
      async (t) => {
        const page = await open(t, route),
          panel = page.getByTestId(
            mode === "modal" ? "panel-demo-search" : "panel-demo-search-expand",
          );
        await total(panel, 25);
        await rows(panel, ids(1, 20));
        await panel.getByTestId("dp-search-toggle").click({ delay: 180 });
        let form = mode === "modal"
          ? searchDialog(page)
          : panel.getByTestId("dp-search-slot");
        await visible(form);
        expect(await page.getByRole("dialog").count()).toBe(
          mode === "modal" ? 1 : 0,
        );
        await form.getByTestId("dp-f-name").locator("input").fill("  ALI  ");
        await form.getByTestId("dp-search-submit").click();
        await total(panel, 1);
        await rows(panel, ["1"]);
        await visible(form, mode === "expand");
        await url(page, { name: "ALI" });
        if (mode === "modal") {
          await panel.getByTestId("dp-search-toggle").click();
          form = searchDialog(page);
        }
        await value(
          form.getByTestId("dp-f-name").locator("input"),
          mode === "modal" ? "ALI" : "  ALI  ",
        );
        await form.getByTestId("dp-f-name").locator("input").fill("");
        await pick(page, form, "role", "管理员");
        await pick(page, form, "status", "停用");
        await form.getByTestId("dp-search-submit").click();
        await total(panel, 2);
        await rows(panel, ["4", "16"]);
        await url(page, { name: null, role: "admin", status: "disabled" });
        if (mode === "modal") {
          await panel.getByTestId("dp-search-toggle").click();
          form = searchDialog(page);
        }
        await form.getByTestId("dp-f-name").locator("input").fill(
          "no-such-generated-name",
        );
        await form.getByTestId("dp-search-submit").click();
        await total(panel, 0);
        await rows(panel, []);
        expect((await panel.getByTestId("dp-range").textContent())?.trim())
          .toBe(
            "暂无数据",
          );
        if (mode === "modal") {
          await panel.getByTestId("dp-search-toggle").click();
          form = searchDialog(page);
        }
        await form.getByTestId("dp-search-reset").click();
        await total(panel, 25);
        await rows(panel, ids(1, 20));
        await visible(form);
        await value(form.getByTestId("dp-f-name").locator("input"), "");
        for (const prop of ["role", "status"]) {
          await value(
            form.getByTestId("dp-f-" + prop).locator('input[type="hidden"]'),
            "",
          );
        }
        await url(page, { name: null, role: null, status: null });
        await form.getByTestId("dp-f-name").locator("input").fill(
          "discarded-draft",
        );
        if (mode === "modal") await page.keyboard.press("Escape");
        else await panel.getByTestId("dp-search-toggle").click();
        await visible(form, false);
        await rows(panel, ids(1, 20));
        await panel.getByTestId("dp-search-toggle").click();
        form = mode === "modal"
          ? searchDialog(page)
          : panel.getByTestId("dp-search-slot");
        await value(form.getByTestId("dp-f-name").locator("input"), "");
      },
      DOCS_BROWSER_CONFIG,
    );
  }
  it(
    "物理操作 DataPanel地址栏：初始筛选/分页回填、提交归一化、重置保留无关参数",
    async (t) => {
      const page = await open(
          t,
          route + "?role=admin&page=2&pageSize=5&keep=ok",
        ),
        panel = page.getByTestId("panel-demo-sync-url");
      await total(panel, 9);
      await rows(panel, ["16", "19", "22", "25"]);
      await panel.getByTestId("dp-search-toggle").click();
      let form = searchDialog(page);
      expect(
        (await form.getByTestId("dp-f-role").locator(
          'button[aria-haspopup="listbox"]',
        ).textContent())?.trim(),
      ).toBe("管理员");
      await value(form.getByTestId("dp-f-name").locator("input"), "");
      await form.getByTestId("dp-f-name").locator("input").fill(" ALI ");
      await form.getByTestId("dp-search-submit").click();
      await rows(panel, ["1"]);
      await url(page, {
        role: "admin",
        name: "ALI",
        page: null,
        pageSize: "5",
        keep: "ok",
      });
      await page.reload();
      await rows(panel, ["1"]);
      await panel.getByTestId("dp-search-toggle").click();
      form = searchDialog(page);
      await value(form.getByTestId("dp-f-name").locator("input"), "ALI");
      await form.getByTestId("dp-search-reset").click();
      await total(panel, 25);
      await rows(panel, ids(1, 5));
      await url(page, {
        role: null,
        name: null,
        page: null,
        pageSize: "5",
        keep: "ok",
      });
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "物理操作 DataPanel分页：首末/前后/页码/跳页夹取/每页条数及移动端",
    async (t) => {
      const page = await open(t, route),
        panel = page.getByTestId("panel-demo-page");
      await total(panel, 40);
      await rows(panel, ids(1, 5));
      expect(await panel.getByTestId("dp-first").isDisabled()).toBe(true);
      expect(await panel.getByTestId("dp-prev").isDisabled()).toBe(true);
      async function range(from: number, to: number) {
        await rows(panel, ids(from, to));
        expect((await panel.getByTestId("dp-range").textContent())?.trim())
          .toBe(
            `第 ${from}-${to} 条，共 40 条`,
          );
      }
      await panel.getByTestId("dp-next").click({ delay: 180 });
      await range(6, 10);
      await url(page, { page: "2" });
      await panel.getByTestId("dp-page-3").click();
      await range(11, 15);
      await panel.getByTestId("dp-prev").click();
      await range(6, 10);
      await panel.getByTestId("dp-last").click();
      await range(36, 40);
      expect(await panel.getByTestId("dp-next").isDisabled()).toBe(true);
      expect(await panel.getByTestId("dp-last").isDisabled()).toBe(true);
      await panel.getByTestId("dp-first").click();
      await range(1, 5);
      const jump = panel.getByTestId("dp-jump").locator("input");
      await jump.fill("3");
      await jump.press("Enter");
      await range(11, 15);
      await value(jump, "");
      await jump.fill("999");
      await jump.press("Enter");
      await range(36, 40);
      await jump.fill("0");
      await jump.press("Enter");
      await range(1, 5);
      await jump.fill("ab3z");
      await value(jump, "3");
      await jump.press("Enter");
      await range(11, 15);
      await panel.getByTestId("dp-pagesize").locator(
        'button[aria-haspopup="listbox"]',
      ).click();
      await page.getByRole("option", { name: "10 条/页", exact: true }).click({
        delay: 180,
      });
      await range(1, 10);
      await url(page, { page: null, pageSize: "10" });
      await panel.getByTestId("dp-next").click();
      await range(11, 20);
      await page.setViewportSize({ width: 375, height: 812 });
      await attr(
        panel.getByTestId("dp-pagination"),
        "data-dp-pg-preset",
        "simple",
      );
      expect(await panel.getByTestId("dp-jump").count()).toBe(0);
      await panel.getByTestId("dp-next").click({ delay: 180 });
      await range(21, 30);
      await panel.getByTestId("dp-prev").click();
      await range(11, 20);
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "物理操作 DataPanel排序：金额默认降序、姓名三态/数字三态、合计与URL",
    async (t) => {
      const page = await open(t, route),
        panel = page.getByTestId("panel-demo-table");
      const data = ids(1, 8).map((id) => {
        const i = Number(id) - 1;
        return {
          id,
          name: names[i],
          balance: 100 + ((i * 137) % 900) + (i % 7) / 10,
          score: (i * 7) % 100,
        };
      });
      const by = (prop: "name" | "balance" | "score", desc = false) =>
        [...data].sort((a, b) => {
          const x = a[prop], y = b[prop];
          return (typeof x === "number" && typeof y === "number"
            ? x - y
            : String(x).localeCompare(String(y))) * (desc ? -1 : 1);
        }).map((r) => r.id);
      await rows(panel, by("balance", true));
      expect(
        (await panel.getByTestId("dp-total-balance").textContent())?.trim(),
      )
        .toBe(
          data.reduce((sum, r) => sum + r.balance, 0).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
        );
      for (const prop of ["name", "score"] as const) {
        await panel.getByTestId("dp-sort-" + prop).click({ delay: 180 });
        await rows(panel, by(prop));
        await url(page, { sort: prop, order: "asc", page: null });
        await panel.getByTestId("dp-sort-" + prop).click();
        await rows(panel, by(prop, true));
        await url(page, { sort: prop, order: "desc" });
        await panel.getByTestId("dp-sort-" + prop).click();
        await rows(panel, by("balance", true));
        await url(page, { sort: null, order: null });
      }
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "物理操作 DataPanel批量：禁用项、原生勾选/反选/全选/取消和删除取消",
    async (t) => {
      const page = await open(t, route),
        panel = page.getByTestId("panel-demo-batch");
      await rows(panel, ids(1, 10));
      for (const id of ["1", "4", "5"]) {
        expect(await panel.getByTestId("dp-select-" + id).isDisabled()).toBe(
          true,
        );
      }
      await panel.getByTestId("dp-select-2").check();
      expect(
        (await panel.getByTestId("dp-selected-count").textContent())?.trim(),
      )
        .toBe("已选 1 项");
      await panel.getByTestId("dp-select-3").check();
      expect(
        (await panel.getByTestId("dp-selected-count").textContent())?.trim(),
      )
        .toBe("已选 2 项");
      expect(
        await panel.getByTestId("dp-select-all").evaluate((el) =>
          (el as HTMLInputElement).indeterminate
        ),
      ).toBe(true);
      await panel.getByTestId("dp-select-2").uncheck();
      expect(
        (await panel.getByTestId("dp-selected-count").textContent())?.trim(),
      )
        .toBe("已选 1 项");
      await panel.getByTestId("dp-select-all").check();
      expect(
        (await panel.getByTestId("dp-selected-count").textContent())?.trim(),
      )
        .toBe("已选 7 项");
      for (const id of ids(1, 10)) {
        expect(await panel.getByTestId("dp-select-" + id).isChecked()).toBe(
          !["1", "4", "5"].includes(id),
        );
      }
      await panel.getByTestId("dp-batch-delete").click({ delay: 180 });
      const confirm = page.locator("[data-dreamer-popconfirm-panel]:visible");
      await visible(confirm);
      await confirm.getByRole("button", { name: "取消", exact: true }).click();
      await visible(confirm, false);
      await rows(panel, ids(1, 10));
      await panel.getByTestId("dp-batch-clear").click();
      expect(await panel.getByTestId("dp-batch-bar").count()).toBe(0);
      expect(await panel.getByTestId("dp-select-all").isChecked()).toBe(false);
      expect(
        await panel.getByTestId("dp-select-all").evaluate((el) =>
          (el as HTMLInputElement).indeterminate
        ),
      ).toBe(false);
      await rows(panel, ids(1, 10));
      await panel.getByTestId("dp-select-all").check();
      await panel.getByTestId("dp-select-all").uncheck();
      expect(await panel.getByTestId("dp-batch-bar").count()).toBe(0);
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "物理操作 DataPanel批量删除：仅新建两行取消/确认及刷新保留所有种子行",
    async (t) => {
      const page = await open(t, route),
        panel = page.getByTestId("panel-demo-batch"),
        origin = new URL(page.url());
      expect(["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname))
        .toBe(
          true,
        );
      expect(["8001", "8003"].includes(origin.port)).toBe(false);
      await rows(panel, ids(1, 10));
      const owned: string[] = [];
      for (let i = 0; i < 2; i++) {
        const name = "ui-bulk-" + crypto.randomUUID().slice(0, 8);
        await panel.getByTestId("dp-create").click({ delay: 180 });
        const form = page.getByRole("dialog").filter({
          has: page.getByTestId("dp-form"),
        });
        await visible(form);
        await form.getByTestId("dp-fld-name").locator("input").fill(name);
        await form.getByTestId("dp-fld-email").locator("input").fill(
          "bulk-owned@example.test",
        );
        await form.getByTestId("dp-form-submit").click();
        await visible(form, false);
        await total(panel, 11 + i);
        const row = panel.locator('[data-testid^="dp-row-"]').filter({
          hasText: name,
        });
        await visible(row);
        const id = await row.getAttribute("data-testid");
        if (!id) throw new Error("owned bulk row missing id");
        owned.push(id.slice(7));
      }
      for (const id of owned) {
        await panel.getByTestId("dp-select-" + id).check();
      }
      expect(
        (await panel.getByTestId("dp-selected-count").textContent())?.trim(),
      )
        .toBe("已选 2 项");
      for (const id of ids(1, 10)) {
        expect(await panel.getByTestId("dp-select-" + id).isChecked()).toBe(
          false,
        );
      }
      await panel.getByTestId("dp-batch-delete").click({ delay: 180 });
      let confirm = page.locator("[data-dreamer-popconfirm-panel]:visible");
      await confirm.getByRole("button", { name: "取消", exact: true }).click();
      await visible(confirm, false);
      await total(panel, 12);
      for (const id of owned) await visible(panel.getByTestId("dp-row-" + id));
      await panel.getByTestId("dp-batch-delete").click();
      confirm = page.locator("[data-dreamer-popconfirm-panel]:visible");
      await confirm.getByRole("button", { name: "删除", exact: true }).click({
        delay: 180,
      });
      await total(panel, 10);
      await rows(panel, ids(1, 10));
      expect(await panel.getByTestId("dp-batch-bar").count()).toBe(0);
      await panel.getByTestId("dp-refresh").click();
      await rows(panel, ids(1, 10));
      for (const id of owned) {
        expect(
          await panel.getByTestId("dp-row-" + id).count(),
        ).toBe(0);
      }
    },
    DOCS_BROWSER_CONFIG,
  );
});
