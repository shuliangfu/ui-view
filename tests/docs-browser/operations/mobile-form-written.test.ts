/** WRITTEN-UNRUN: dummy local-only values; real native keyboard, masking and validation outcomes. */
import { describe, expect, it } from "@dreamer/test";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, eventually, open, value } from "./driver.ts";
import {
  enterPasscode,
  passcodeContract,
  passcodeValue,
} from "./mobile-passcode-driver-written.ts";
describe("Mobile form written", () => {
  for (const width of [390, 1280]) {
    it(
      "移动Form 与 createForm @" + width +
        "：必填/密码长度/验证码边界/显隐/提交/重新导航",
      async (t) => {
        const p = await open(t, "/mobile/form/form-containers");
        await p.setViewportSize({ width, height: 900 });
        const form = p.locator("main form"),
          account = form.locator('[name="account"]'),
          password = form.locator('[name="password"]'),
          code = form.locator(".passcode-input"),
          submit = form.getByRole("button", { name: "提交", exact: true }),
          errors = form.locator('[id$="-error"]'),
          toast = p.getByRole("alert").filter({ hasText: /^已提交$/ });
        expect(await form.count()).toBe(1);
        await value(account, "");
        await value(password, "");
        await passcodeValue(code, "", 6);
        await submit.click({ delay: 180 });
        expect(await errors.allTextContents()).toEqual([
          "请输入账号",
          "此项为必填",
          "请输入验证码",
        ]);
        for (
          const input of [account, password, code.locator("input")]
        ) await attr(input, "aria-invalid", "true");
        expect(await toast.count()).toBe(0);
        await account.fill("local-docs-user");
        await password.fill("abc");
        await enterPasscode(p, code, "123", "123", 6);
        await submit.click({ delay: 180 });
        expect(await errors.allTextContents()).toEqual([
          "至少 6 个字符",
          "4～6 位数字",
        ]);
        await attr(account, "aria-invalid", "false");
        expect(await toast.count()).toBe(0);
        await password.fill("LocalOnly!9");
        await attr(password, "type", "password");
        await form.getByRole("button", { name: "显示密码", exact: true }).click(
          {
            delay: 180,
          },
        );
        await attr(password, "type", "text");
        await value(password, "LocalOnly!9");
        await form.getByRole("button", { name: "隐藏密码", exact: true }).press(
          "Enter",
        );
        await attr(password, "type", "password");
        await value(password, "LocalOnly!9");
        await enterPasscode(p, code, "", "", 6);
        await passcodeContract(p, code, 6);
        for (const digits of ["1234", "12345", "123456"]) {
          await enterPasscode(p, code, digits, digits, 6);
          await submit.click({ delay: 180 });
          await eventually(async () => await errors.count() === 0);
          expect(
            await form.evaluate((e) =>
              Array.from(new FormData(e as HTMLFormElement).entries()).map((
                [k, v],
              ) => [k, String(v)])
            ),
          ).toEqual([
            ["account", "local-docs-user"],
            ["password", "LocalOnly!9"],
            ["code", digits],
          ]);
          await eventually(async () => await toast.count() === 1);
          expect((await toast.textContent())?.trim()).toBe("已提交");
          for (const input of [account, password, code.locator("input")]) {
            await attr(input, "aria-invalid", "false");
          }
          await toast.waitFor({ state: "detached", timeout: 10000 });
        }
        await enterPasscode(p, code, "123", "123", 6);
        await submit.click({ delay: 180 });
        expect(await errors.allTextContents()).toEqual(["4～6 位数字"]);
        expect(await toast.count()).toBe(0);
        const fresh = await open(t, "/mobile/form/form-containers"),
          again = fresh.locator("main form");
        expect(
          await again.locator("input").evaluateAll((es) =>
            es.map((e) => (e as HTMLInputElement).value)
          ),
        ).toEqual(["", "", ""]);
        await again.getByRole("button", { name: "提交", exact: true }).click({
          delay: 180,
        });
        expect(await again.locator('[id$="-error"]').allTextContents()).toEqual(
          [
            "请输入账号",
            "此项为必填",
            "请输入验证码",
          ],
        );
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
