import { describe, expect, it } from "@dreamer/test";
import type { Locator } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, eventually, open, value, visible } from "./driver.ts";
import { pickTime } from "./time-driver.ts";
const route = "/desktop/data-display/data-panel";
async function rows(panel: Locator, expected: string[]) {
  const read = () =>
    panel.locator('[data-testid^="dp-row-"]').evaluateAll((els) =>
      els.map((el) => el.getAttribute("data-testid")!.slice(7))
    );
  try {
    await eventually(async () =>
      JSON.stringify(await read()) === JSON.stringify(expected)
    );
  } catch (cause) {
    throw new Error(
      JSON.stringify({ expectedRows: expected, actualRows: await read() }),
      { cause },
    );
  }
  expect(await read()).toEqual(expected);
}
describe("DataPanel advanced physical", () => {
  it(
    "物理操作 DataPanel命令式API：筛选、选中读取、刷新、新增取消、详情关闭且URL不变",
    async (t) => {
      const page = await open(t, route),
        panel = page.getByTestId("panel-demo-handles"),
        hint = page.getByTestId("demo-handles-hint");
      const initialUrl = page.url();
      await rows(panel, ["1", "2", "3", "4", "5", "6", "7", "8"]);
      await page.getByTestId("demo-handles-filter").click({ delay: 180 });
      await rows(panel, ["1", "4", "7"]);
      expect(await hint.textContent()).toBe("已筛选管理员");
      await panel.getByTestId("dp-select-7").check();
      await page.getByTestId("demo-handles-reload").click();
      await eventually(async () =>
        (await hint.textContent()) === "刷新 · page=1 · 已选 1"
      );
      await rows(panel, ["1", "4", "7"]);
      // load() clears selected IDs after the synchronous API button reads the pre-refresh state.
      await eventually(async () =>
        !(await panel.getByTestId("dp-select-7").isChecked())
      );
      expect(await panel.getByTestId("dp-selected-count").count()).toBe(0);
      await page.getByTestId("demo-handles-reload").click();
      await eventually(async () =>
        (await hint.textContent()) === "刷新 · page=1 · 已选 0"
      );
      await page.getByTestId("demo-handles-open-form").click();
      let form = page.getByRole("dialog").filter({
        has: page.getByTestId("dp-form"),
      });
      await visible(form);
      expect(await hint.textContent()).toBe("打开新增");
      await value(form.getByTestId("dp-fld-name").locator("input"), "");
      await form.getByTestId("dp-fld-name").locator("input").fill(
        "discarded-imperative",
      );
      await form.getByTestId("dp-form-cancel").click();
      await visible(form, false);
      await rows(panel, ["1", "4", "7"]);
      await page.getByTestId("demo-handles-open-form").click();
      form = page.getByRole("dialog").filter({
        has: page.getByTestId("dp-form"),
      });
      await value(form.getByTestId("dp-fld-name").locator("input"), "");
      await form.getByTestId("dp-form-cancel").click();
      await page.getByTestId("demo-handles-open-view").click();
      const view = page.getByRole("dialog").filter({
        has: page.getByTestId("dp-view"),
      });
      await visible(view);
      expect(await hint.textContent()).toBe("打开详情");
      await visible(view.getByText("Alice", { exact: true }));
      await visible(view.getByText("alice1@example.com", { exact: true }));
      await view.getByTestId("dp-view-close").click();
      await visible(view, false);
      expect(page.url()).toBe(initialUrl);
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "物理操作 DataPanel条件表单：角色实时禁用邮箱、显隐积分并保留同节点草稿",
    async (t) => {
      const page = await open(t, route),
        panel = page.getByTestId("panel-demo-form-cond");
      await panel.getByTestId("dp-create").click();
      const form = page.getByRole("dialog").filter({
          has: page.getByTestId("dp-form"),
        }),
        email = form.getByTestId("dp-fld-email").locator("input"),
        name = form.getByTestId("dp-fld-name").locator("input"),
        score = form.getByTestId("dp-fld-score");
      await visible(form);
      expect(await email.isDisabled()).toBe(true);
      await visible(score, false);
      await name.fill("condition-draft");
      const nameNode = await name.elementHandle();
      const pick = async (label: string) => {
        await form.getByTestId("dp-fld-role").locator(
          'button[aria-haspopup="listbox"]',
        ).click({ delay: 180 });
        await page.getByRole("option", { name: label, exact: true }).click({
          delay: 180,
        });
      };
      await pick("管理员");
      await eventually(async () => !(await email.isDisabled()));
      await visible(score);
      await email.fill("conditional@example.test");
      await score.locator("input").fill("42");
      await value(name, "condition-draft");
      expect(await name.evaluate((el, previous) => el === previous, nameNode))
        .toBe(true);
      await pick("访客");
      expect(await email.isDisabled()).toBe(true);
      await visible(score, false);
      await value(email, "conditional@example.test");
      await pick("编辑");
      expect(await email.isDisabled()).toBe(false);
      await visible(score, false);
      await value(email, "conditional@example.test");
      await pick("管理员");
      await value(score.locator("input"), "42");
      await form.getByTestId("dp-form-cancel").click();
      await visible(form, false);
      await rows(panel, ["1", "2", "3", "4", "5", "6", "7", "8"]);
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "物理操作 DataPanel高级搜索：姓名、多选全包含、状态、数字、自定义字段、重置和自定义底栏",
    async (t) => {
      const page = await open(t, route),
        panel = page.getByTestId("panel-demo-search-adv"),
        initialUrl = page.url();
      const form = page.getByRole("dialog").filter({
        has: page.getByTestId("dp-search"),
      });
      const all = Array.from({ length: 20 }, (_, i) => String(i + 1));
      const reopen = async () => {
        await panel.getByTestId("dp-search-toggle").click({ delay: 180 });
        await visible(form);
      };
      const submit = async (expected: string[]) => {
        await form.getByTestId("dp-search-submit").click();
        await visible(form, false);
        await rows(panel, expected);
      };
      const reset = async () => {
        await form.getByTestId("dp-search-reset").click();
        await rows(panel, all);
        expect(
          (await panel.getByTestId("dp-total-count").textContent())?.trim(),
        )
          .toBe("共 25 条记录");
      };
      await rows(panel, all);
      await reopen();
      await form.getByTestId("dp-f-name").locator("input").fill("ALIce");
      await submit(["1"]);
      await reopen();
      await reset();
      const multi = form.getByTestId("dp-f-role");
      await multi.locator('button[aria-haspopup="listbox"]').click();
      await page.getByRole("option", { name: "管理员", exact: true }).click({
        delay: 180,
      });
      await page.getByRole("button", { name: "完成", exact: true }).click();
      await submit(["1", "4", "7", "10", "13", "16", "19", "22", "25"]);
      await reopen();
      await multi.locator('button[aria-haspopup="listbox"]').click();
      await attr(
        page.getByRole("option", { name: "管理员", exact: true }),
        "aria-selected",
        "true",
      );
      await page.getByRole("option", { name: "编辑", exact: true }).click({
        delay: 180,
      });
      await page.getByRole("button", { name: "完成", exact: true }).click();
      // filterRows 的 multiselect 合同是全部包含；单值角色不能同时拥有 admin/editor。
      await submit([]);
      await reopen();
      await multi.locator('button[aria-haspopup="listbox"]').click();
      await page.getByRole("button", { name: "清空", exact: true }).click();
      await page.getByRole("button", { name: "完成", exact: true }).click();
      await form.getByTestId("dp-f-status").locator(
        'button[aria-haspopup="listbox"]',
      ).click();
      await page.getByRole("option", { name: "停用", exact: true }).click({
        delay: 180,
      });
      await submit(["4", "8", "12", "16", "20", "24"]);
      await reopen();
      await reset();
      await form.getByTestId("dp-f-score").locator("input").fill("14");
      await submit(["3"]);
      await reopen();
      await reset();
      const memo = form.getByPlaceholder("字段 render");
      await memo.fill("missing-memo");
      await submit([]);
      await reopen();
      await value(memo, "missing-memo");
      await reset();
      await value(memo, "");
      await form.getByTestId("dp-search-action-onlyActive").click();
      await visible(form, false);
      await rows(
        panel,
        Array.from({ length: 25 }, (_, i) => i + 1).filter((id) =>
          (id - 1) % 4 !== 3
        ).map(String),
      );
      expect((await panel.getByTestId("dp-total-count").textContent())?.trim())
        .toBe("共 19 条记录");
      expect(page.url()).toBe(initialUrl);
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "物理操作 DataPanel高级搜索：原生年月日和时间筛选包含本地时区边界记录",
    async (t) => {
      const page = await open(t, route),
        panel = page.getByTestId("panel-demo-search-adv");
      const session = await page.context().newCDPSession(page);
      await session.send("Emulation.setTimezoneOverride", {
        timezoneId: "Asia/Shanghai",
      });
      try {
        await open(t, route);
        expect(
          await page.evaluate(() =>
            Intl.DateTimeFormat().resolvedOptions().timeZone
          ),
        ).toBe("Asia/Shanghai");
        await panel.getByTestId("dp-columns").click();
        await page.getByTestId("dp-col-createdAt").check();
        await page.mouse.click(2, 2);
        const dateIndex = (await panel.locator("thead th").allTextContents())
          .findIndex((s) => s.includes("创建时间"));
        expect(dateIndex).toBeGreaterThanOrEqual(0);
        const shown =
          (await panel.getByTestId("dp-row-15").locator("td").nth(dateIndex)
            .textContent())!.trim();
        expect(/^2026-01-15 \d{2}:38$/.test(shown)).toBe(true);
        const hour = Number(shown.slice(11, 13));
        console.log(
          "Shanghai displayed date boundary",
          shown,
          "filter hour",
          hour,
        );
        for (
          const [filterHour, start] of [[hour + 1, 16], [hour, 15]] as const
        ) {
          await panel.getByTestId("dp-search-toggle").click();
          const form = page.getByRole("dialog").filter({
              has: page.getByTestId("dp-search"),
            }),
            field = form.getByTestId("dp-f-createdAt");
          await field.locator("button[aria-haspopup]").click();
          const picker = page.getByRole("dialog", {
            name: "选择日期与时间",
            exact: true,
          });
          await picker.getByRole("button", {
            name: "选择月份与年份",
            exact: true,
          })
            .click();
          await picker.getByRole("button", { name: "选择年份", exact: true })
            .click();
          await picker.getByRole("gridcell", { name: "2026", exact: true })
            .click();
          expect(await picker.getByRole("gridcell").count()).toBe(12);
          await picker.getByRole("gridcell").nth(0).click();
          await picker.locator("[data-ui-calendar-day]").filter({
            hasText: /^15$/,
          })
            .click({ delay: 180 });
          await pickTime(picker, { hour: filterHour, minute: 0 });
          await picker.getByRole("button", { name: "确定", exact: true })
            .click();
          await value(
            field.locator("input[type=hidden]"),
            `2026-01-15 ${String(filterHour).padStart(2, "0")}:00`,
          );
          await form.getByTestId("dp-search-submit").click();
          await visible(form, false);
          await rows(
            panel,
            Array.from({ length: 26 - start }, (_, i) => String(i + start)),
          );
          expect(
            (await panel.getByTestId("dp-total-count").textContent())?.trim(),
          )
            .toBe(`共 ${26 - start} 条记录`);
        }
      } finally {
        await session.send("Emulation.setTimezoneOverride", { timezoneId: "" });
        await session.detach();
      }
    },
    DOCS_BROWSER_CONFIG,
  );
});
