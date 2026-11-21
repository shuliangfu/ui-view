import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page, Response } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, open, value, visible } from "./driver.ts";
async function jsonOk(response: Response): Promise<Record<string, unknown>> {
  const raw = await response.text();
  if (response.status() !== 200) {
    throw new Error(
      `Local docs CRUD must succeed: ${response.status()} ${raw}`,
    );
  }
  return JSON.parse(raw);
}
function dialog(page: Page) {
  return page.getByRole("dialog").filter({ has: page.getByTestId("dp-form") });
}
async function fill(form: Locator, name: string, balance: string) {
  await form.getByTestId("dp-fld-name").locator("input").fill(name);
  await form.getByTestId("dp-fld-email").locator("input").fill(
    "isolated-ui-test@example.test",
  );
  await form.getByTestId("dp-fld-balance").locator("input").fill(balance);
}
describe("DataPanel CRUD physical", () => {
  for (const mode of ["action", "restful"] as const) {
    it(
      "物理操作 DataPanel " + mode +
        "：真实API创建、编辑取消/保存、详情、单选批量删除取消/确认和刷新",
      async (t) => {
        const page = await open(t, "/desktop/data-display/data-panel"),
          url = new URL(page.url());
        expect(["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)).toBe(
          true,
        );
        expect(["8001", "8003"].includes(url.port)).toBe(false);
        const base = mode === "action" ? "/api/users" : "/api/orders",
          panel = page.getByTestId(
            mode === "action"
              ? "panel-demo-api-users-action"
              : "panel-demo-api-orders-restful",
          );
        await eventually(async () =>
          await panel.locator('[data-testid^="dp-row-"]').count() > 0
        );
        const name = "ui-physical-" + mode + "-" +
          crypto.randomUUID().slice(0, 8);
        await panel.getByTestId("dp-create").click({ delay: 180 });
        let form = dialog(page);
        await visible(form);
        await form.getByTestId("dp-form-submit").click();
        for (const prop of ["name", "email"]) {
          const id = await form.getByTestId("dp-fld-" + prop).locator("input")
            .getAttribute("id");
          if (!id) throw new Error("required field must have an id");
          const error = form.locator(`[id="${id}-error"]`);
          await visible(error);
          expect(await error.textContent()).toBe("此项必填");
        }
        await fill(form, name, "12.5");
        const create = page.waitForResponse((r) =>
          new URL(r.url()).pathname ===
            (mode === "action" ? base + "/create" : base) &&
          r.request().method() === "POST"
        );
        await form.getByTestId("dp-form-submit").click({ delay: 180 });
        const createdResponse = await create,
          created = await jsonOk(createdResponse);
        const payload = createdResponse.request().postDataJSON();
        expect(payload.name).toBe(name);
        expect(payload.email).toBe("isolated-ui-test@example.test");
        expect(payload.balance).toBe(12.5);
        expect(payload.role).toBe("viewer");
        expect(payload.status).toBe("active");
        const record = (created.row ?? created) as Record<string, unknown>,
          id = String(record.id);
        expect(record.name).toBe(name);
        await visible(form, false);
        const row = panel.getByTestId("dp-row-" + id);
        await visible(row);
        expect(await row.textContent()).toContain(name);
        await row.getByTestId("dp-edit-" + id).click();
        form = dialog(page);
        await visible(form);
        await value(form.getByTestId("dp-fld-name").locator("input"), name);
        await fill(form, name + "-discarded", "999");
        await form.getByTestId("dp-form-cancel").click({ delay: 180 });
        await visible(form, false);
        expect(await row.textContent()).toContain(name);
        expect(await row.textContent()).not.toContain("discarded");
        await row.getByTestId("dp-edit-" + id).click();
        form = dialog(page);
        await visible(form);
        await value(
          form.getByTestId("dp-fld-balance").locator("input"),
          "12.5",
        );
        await fill(form, name + "-saved", "23.75");
        const update = page.waitForResponse((r) =>
          new URL(r.url()).pathname ===
            (mode === "action" ? base + "/update" : base + "/" + id) &&
          r.request().method() === (mode === "action" ? "POST" : "PUT")
        );
        await form.getByTestId("dp-form-submit").click({ delay: 180 });
        const updated = await update;
        await jsonOk(updated);
        expect(updated.request().postDataJSON().name).toBe(name + "-saved");
        expect(updated.request().postDataJSON().balance).toBe(23.75);
        await visible(form, false);
        await eventually(async () =>
          (await row.textContent())?.includes(name + "-saved") === true
        );
        expect(await row.textContent()).toContain("23.75");
        await row.getByTestId("dp-view-" + id).click();
        const view = page.getByRole("dialog").filter({
          has: page.getByTestId("dp-view"),
        });
        await visible(view);
        await visible(view.getByText(name + "-saved", { exact: true }));
        await view.getByTestId("dp-view-close").click();
        await visible(view, false);
        // DEMO_ROW_ACTIONS deliberately hides row removal; select only our new row.
        expect(await row.getByTestId("dp-delete-" + id).count()).toBe(0);
        await row.getByTestId("dp-select-" + id).check();
        expect(await panel.getByTestId("dp-selected-count").textContent()).toBe(
          "已选 1 项",
        );
        await panel.getByTestId("dp-batch-delete").click({ delay: 180 });
        let confirm = page.locator("[data-dreamer-popconfirm-panel]:visible");
        await visible(confirm);
        await confirm.getByRole("button", { name: "取消", exact: true })
          .click();
        await visible(confirm, false);
        await visible(row);
        await panel.getByTestId("dp-batch-delete").click();
        confirm = page.locator("[data-dreamer-popconfirm-panel]:visible");
        await visible(confirm);
        const removed = page.waitForResponse((r) =>
          new URL(r.url()).pathname === base + "/remote-batch" &&
          r.request().method() === "POST"
        );
        await confirm.getByRole("button", { name: "删除", exact: true }).click({
          delay: 180,
        });
        const removal = await removed;
        expect(removal.request().postDataJSON().ids).toEqual([String(id)]);
        expect(await jsonOk(removal)).toEqual({ removed: 1, failed: [] });
        await eventually(async () => await row.count() === 0);
        const refreshed = page.waitForResponse((r) =>
          new URL(r.url()).pathname === base && r.request().method() === "GET"
        );
        await panel.getByTestId("dp-refresh").click();
        await jsonOk(await refreshed);
        expect(await panel.getByText(name + "-saved", { exact: true }).count())
          .toBe(0);
      },
      DOCS_BROWSER_CONFIG,
    );
  }

  it(
    "物理操作 DataPanel本地CRUD：新增取消、角色/状态保存、编辑取消/保存、详情与批量删除",
    async (t) => {
      const page = await open(t, "/desktop/data-display/data-panel"),
        panel = page.getByTestId("panel-demo-crud");
      const rows = panel.locator('[data-testid^="dp-row-"]');
      await eventually(async () => await rows.count() === 8);
      const baseline = await rows.evaluateAll((els) =>
        els.map((el) => el.getAttribute("data-testid"))
      );
      const name = "ui-physical-local-" + crypto.randomUUID().slice(0, 8);
      await panel.getByTestId("dp-create").click({ delay: 180 });
      let form = dialog(page);
      await visible(form);
      await fill(form, name + "-cancelled", "99");
      await form.getByTestId("dp-form-cancel").click();
      await visible(form, false);
      expect(await rows.count()).toBe(8);
      expect(
        await panel.getByText(name + "-cancelled", { exact: true }).count(),
      )
        .toBe(0);
      await panel.getByTestId("dp-create").click();
      form = dialog(page);
      await fill(form, name, "12.5");
      await form.getByTestId("dp-fld-role").locator(
        'button[aria-haspopup="listbox"]',
      ).click({
        delay: 180,
      });
      await page.getByRole("option", { name: "管理员", exact: true }).click({
        delay: 180,
      });
      const status = form.getByTestId("dp-fld-status");
      expect(await status.getByRole("checkbox").isChecked()).toBe(true);
      await status.locator("label").click({ delay: 180 });
      expect(await status.getByRole("checkbox").isChecked()).toBe(false);
      await value(form.getByTestId("dp-fld-name").locator("input"), name);
      await form.getByTestId("dp-form-submit").click();
      await visible(form, false);
      await eventually(async () => await rows.count() === 9);
      const row = rows.filter({ hasText: name }),
        testId = await row.getAttribute("data-testid");
      if (!testId) throw new Error("created local row missing id");
      const id = testId.slice("dp-row-".length);
      expect(await row.textContent()).toContain("管理员");
      expect(await row.textContent()).toContain("12.5");
      expect(
        await row.getByTestId("dp-switch-" + id).getByRole("checkbox")
          .isChecked(),
      ).toBe(false);
      await row.getByTestId("dp-edit-" + id).click();
      form = dialog(page);
      await value(form.getByTestId("dp-fld-name").locator("input"), name);
      const roleTrigger = form.getByTestId("dp-fld-role").locator(
        'button[aria-haspopup="listbox"]',
      );
      await visible(roleTrigger);
      expect((await roleTrigger.textContent())?.trim()).toBe("管理员");
      expect(
        await form.getByTestId("dp-fld-status").getByRole("checkbox")
          .isChecked(),
      ).toBe(false);
      await fill(form, name + "-discarded", "999");
      await form.getByTestId("dp-form-cancel").click();
      await visible(form, false);
      expect(await row.textContent()).not.toContain("discarded");
      await row.getByTestId("dp-edit-" + id).click();
      form = dialog(page);
      await value(form.getByTestId("dp-fld-balance").locator("input"), "12.5");
      await fill(form, name + "-saved", "23.75");
      await form.getByTestId("dp-fld-status").locator("label").click({
        delay: 180,
      });
      await form.getByTestId("dp-form-submit").click();
      await visible(form, false);
      await eventually(async () =>
        (await row.textContent())?.includes("23.75") === true
      );
      expect(
        await row.getByTestId("dp-switch-" + id).getByRole("checkbox")
          .isChecked(),
      ).toBe(true);
      await row.getByTestId("dp-view-" + id).click();
      const view = page.getByRole("dialog").filter({
        has: page.getByTestId("dp-view"),
      });
      await visible(view.getByText(name + "-saved", { exact: true }));
      await view.getByTestId("dp-view-close").click();
      await visible(view, false);
      await row.getByTestId("dp-select-" + id).check();
      await panel.getByTestId("dp-batch-delete").click({ delay: 180 });
      let confirm = page.locator("[data-dreamer-popconfirm-panel]:visible");
      await visible(confirm);
      await confirm.getByRole("button", { name: "取消", exact: true }).click();
      await visible(confirm, false);
      await visible(row);
      await panel.getByTestId("dp-batch-delete").click();
      confirm = page.locator("[data-dreamer-popconfirm-panel]:visible");
      await confirm.getByRole("button", { name: "删除", exact: true }).click({
        delay: 180,
      });
      await eventually(async () => await rows.count() === 8);
      expect(await row.count()).toBe(0);
      await panel.getByTestId("dp-refresh").click();
      await eventually(async () =>
        JSON.stringify(
          await rows.evaluateAll((els) =>
            els.map((el) => el.getAttribute("data-testid"))
          ),
        ) === JSON.stringify(baseline)
      );
    },
    DOCS_BROWSER_CONFIG,
  );
});
