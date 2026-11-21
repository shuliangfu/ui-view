import { describe, expect, it } from "@dreamer/test";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, open, value, visible } from "./driver.ts";
describe("DataPanel options physical", () => {
  it(
    "物理操作 DataPanel动态options：角色级联精确选项、无关输入同节点/焦点草稿、真实保存回显及取消",
    async (t) => {
      const page = await open(t, "/desktop/data-display/data-panel"),
        panel = page.getByTestId("panel-demo-form-cond");
      await panel.getByTestId("dp-create").click();
      const form = page.getByRole("dialog").filter({
        has: page.getByTestId("dp-form"),
      });
      const trigger = (field: string) =>
        form.getByTestId("dp-fld-" + field).locator(
          'button[aria-haspopup="listbox"]',
        );
      const name = form.getByTestId("dp-fld-name").locator("input"),
        email = form.getByTestId("dp-fld-email").locator("input");
      const nameNode = await name.elementHandle();
      if (!nameNode) throw new Error("Missing name node");
      const choose = async (field: string, label: string) => {
        await trigger(field).click({ delay: 180 });
        await page.getByRole("option", { name: label, exact: true }).click({
          delay: 180,
        });
      };
      const options = async (expected: string[]) => {
        await trigger("scope").click();
        const list = page.getByRole("listbox");
        await visible(list);
        expect(
          (await list.getByRole("option").allTextContents()).map((s) =>
            s.trim()
          ),
        ).toEqual(["—", ...expected]);
        await page.keyboard.press("Escape");
        await visible(list, false);
        await visible(form);
      };
      await value(name, "");
      await options(["仅本人"]);
      await choose("scope", "—");
      await value(
        form.getByTestId("dp-fld-scope").locator('input[type="hidden"]'),
        "",
      );
      expect((await trigger("scope").textContent())!.trim()).toBe("—");
      await choose("scope", "仅本人");
      await value(
        form.getByTestId("dp-fld-scope").locator('input[type="hidden"]'),
        "self",
      );
      await name.fill("options-kept-draft");
      await choose("role", "管理员");
      await options(["仅本人", "本团队", "所有用户"]);
      await choose("scope", "本团队");
      await email.fill("options@example.test");
      const scopeNode = await trigger("scope").elementHandle();
      if (!scopeNode) throw new Error("Missing scope node");
      await name.click();
      await name.press("End");
      await name.pressSequentially("-typing", { delay: 60 });
      await value(name, "options-kept-draft-typing");
      expect(await name.evaluate((el, old) => el === old, nameNode)).toBe(true);
      expect(await name.evaluate((el) => document.activeElement === el)).toBe(
        true,
      );
      expect(
        await trigger("scope").evaluate((el, old) => el === old, scopeNode),
      )
        .toBe(true);
      expect((await trigger("scope").textContent())!.trim()).toBe("本团队");
      await choose("role", "编辑");
      await options(["仅本人", "本团队"]);
      expect((await trigger("scope").textContent())!.trim()).toBe("本团队");
      await choose("scope", "仅本人");
      await choose("role", "访客");
      await options(["仅本人"]);
      expect(await email.isDisabled()).toBe(true);
      await value(email, "options@example.test");
      expect(await name.evaluate((el, old) => el === old, nameNode)).toBe(true);
      await choose("role", "管理员");
      await choose("scope", "所有用户");
      await form.getByTestId("dp-form-submit").click();
      await visible(form, false);
      const row = panel.getByTestId("dp-row-9");
      await visible(row);
      expect(await row.textContent()).toContain("options-kept-draft-typing");
      expect((await panel.getByTestId("dp-total-count").textContent())!.trim())
        .toBe("共 9 条记录");
      await row.getByTestId("dp-edit-9").click();
      await value(name, "options-kept-draft-typing");
      await value(email, "options@example.test");
      expect((await trigger("scope").textContent())!.trim()).toBe("所有用户");
      await options(["仅本人", "本团队", "所有用户"]);
      await choose("scope", "仅本人");
      await form.getByTestId("dp-form-cancel").click();
      await visible(form, false);
      await row.getByTestId("dp-edit-9").click();
      expect((await trigger("scope").textContent())!.trim()).toBe("所有用户");
      await form.getByTestId("dp-form-cancel").click();
      await visible(form, false);
      await row.getByTestId("dp-select-9").check();
      await panel.getByTestId("dp-batch-delete").click();
      await page.locator("[data-dreamer-popconfirm-panel]:visible").getByRole(
        "button",
        { name: "删除", exact: true },
      ).click();
      await visible(row, false);
      await eventually(async () =>
        (await panel.getByTestId("dp-total-count").textContent())!.trim() ===
          "共 8 条记录"
      );
    },
    DOCS_BROWSER_CONFIG,
  );
});
