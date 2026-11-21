import { describe, expect, it } from "@dreamer/test";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, open, value, visible } from "./driver.ts";
describe("DataPanel form continue physical", () => {
  it(
    "物理操作 DataPanel保存并继续：校验失败保留草稿及精确错误、修正成功只保存一次并重开空表单",
    async (t) => {
      const page = await open(t, "/desktop/data-display/data-panel"),
        panel = page.getByTestId("panel-demo-form-cond");
      await panel.getByTestId("dp-create").click();
      const form = page.getByRole("dialog").filter({
        has: page.getByTestId("dp-form"),
      });
      const field = (name: string) =>
        form.getByTestId("dp-fld-" + name).locator("input");
      await form.getByTestId("dp-form-action-saveMore").click();
      for (const prop of ["name", "email"]) {
        const id = await field(prop).getAttribute("id");
        if (!id) throw new Error("required field needs error association");
        await visible(form.locator(`[id="${id}-error"]`));
        expect(await form.locator(`[id="${id}-error"]`).textContent()).toBe(
          "此项必填",
        );
      }
      await field("name").fill("continue-kept-draft");
      await form.getByTestId("dp-fld-role").locator(
        'button[aria-haspopup="listbox"]',
      ).click();
      await page.getByRole("option", { name: "管理员", exact: true }).click({
        delay: 180,
      });
      await field("email").fill("invalid-email");
      await field("score").fill("42");
      await form.getByTestId("dp-form-action-saveMore").click({ delay: 180 });
      await visible(form);
      console.log("saveMore validation result", {
        name: await field("name").inputValue(),
        email: await field("email").inputValue(),
        scoreVisible: await form.getByTestId("dp-fld-score").isVisible(),
      });
      await value(field("name"), "continue-kept-draft");
      await value(field("email"), "invalid-email");
      await value(field("score"), "42");
      const id = await field("email").getAttribute("id");
      if (!id) throw new Error("email needs error association");
      await visible(form.locator(`[id="${id}-error"]`));
      expect(await form.locator(`[id="${id}-error"]`).textContent()).toBe(
        "格式不正确",
      );
      expect((await panel.getByTestId("dp-total-count").textContent())?.trim())
        .toBe("共 8 条记录");
      await field("email").fill("continue@example.test");
      await field("balance").fill("-1");
      await form.getByTestId("dp-form-action-saveMore").click();
      await value(field("name"), "continue-kept-draft");
      const balanceId = await field("balance").getAttribute("id");
      if (!balanceId) throw new Error("balance needs error association");
      await visible(form.locator(`[id="${balanceId}-error"]`));
      expect(await form.locator(`[id="${balanceId}-error"]`).textContent())
        .toBe(
          "不能小于 0",
        );
      await field("balance").fill("12.5");
      await form.getByTestId("dp-form-action-saveMore").click({ delay: 180 });
      await visible(form);
      await value(field("name"), "");
      await value(field("email"), "");
      await value(field("balance"), "0");
      expect(await field("email").isDisabled()).toBe(true);
      await visible(form.getByTestId("dp-fld-score"), false);
      expect((await panel.getByTestId("dp-total-count").textContent())?.trim())
        .toBe("共 9 条记录");
      const row = panel.getByTestId("dp-row-9");
      await visible(row);
      const cells = (await row.locator("td").allTextContents()).map((s) =>
        s.trim()
      );
      expect(cells).toContain("continue-kept-draft");
      expect(cells).toContain("continue@example.test");
      expect(cells).toContain("42");
      expect(cells).toContain("12.50");
      await field("name").fill("discard-second-record");
      await form.getByTestId("dp-form-cancel").click();
      await visible(form, false);
      expect(
        await panel.getByText("continue-kept-draft", { exact: true }).count(),
      ).toBe(1);
      expect(
        await panel.getByText("discard-second-record", { exact: true }).count(),
      ).toBe(0);
      await row.getByTestId("dp-edit-9").click();
      await value(field("name"), "continue-kept-draft");
      await value(field("score"), "42");
      await value(field("balance"), "12.5");
      await field("name").fill("continue-updated");
      await form.getByTestId("dp-fld-role").locator(
        'button[aria-haspopup="listbox"]',
      ).click();
      await page.getByRole("option", { name: "访客", exact: true }).click({
        delay: 180,
      });
      expect(await field("email").isDisabled()).toBe(true);
      await visible(form.getByTestId("dp-fld-score"), false);
      const status = form.getByTestId("dp-fld-status").getByRole("checkbox");
      expect(await status.isChecked()).toBe(true);
      await form.getByTestId("dp-fld-status").locator("label").click({
        delay: 180,
      });
      expect(await status.isChecked()).toBe(false);
      await form.getByTestId("dp-form-submit").click();
      await visible(form, false);
      const updated = (await row.locator("td").allTextContents()).map((s) =>
        s.trim()
      );
      for (
        const expected of [
          "continue-updated",
          "continue@example.test",
          "访客",
          "42",
          "12.50",
        ]
      ) expect(updated).toContain(expected);
      await attr(row.getByTestId("dp-switch-9"), "title", "停用");
      expect(
        await row.getByTestId("dp-switch-9").getByRole("checkbox").isChecked(),
      ).toBe(false);
      await row.getByTestId("dp-edit-9").click();
      await field("name").fill("cancel-edit");
      await form.getByTestId("dp-form-cancel").click();
      await visible(form, false);
      expect(await row.textContent()).toContain("continue-updated");
      expect(await row.textContent()).not.toContain("cancel-edit");
      await row.getByTestId("dp-view-9").click();
      const view = page.getByRole("dialog").filter({
        has: page.getByTestId("dp-view"),
      });
      await visible(view.getByText("continue-updated", { exact: true }));
      await visible(view.getByText("continue@example.test", { exact: true }));
      await view.getByTestId("dp-view-close").click();
      await visible(view, false);
      await row.getByTestId("dp-select-9").check();
      await panel.getByTestId("dp-batch-delete").click();
      let confirm = page.locator("[data-dreamer-popconfirm-panel]:visible");
      await confirm.getByRole("button", { name: "取消", exact: true }).click();
      await visible(row);
      await panel.getByTestId("dp-batch-delete").click();
      confirm = page.locator("[data-dreamer-popconfirm-panel]:visible");
      await confirm.getByRole("button", { name: "删除", exact: true }).click();
      await visible(row, false);
      expect((await panel.getByTestId("dp-total-count").textContent())?.trim())
        .toBe("共 8 条记录");
    },
    DOCS_BROWSER_CONFIG,
  );
});
