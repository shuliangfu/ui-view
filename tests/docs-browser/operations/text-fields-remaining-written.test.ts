/** WRITTEN-UNRUN. Remaining visual/geometry assertions for Input, Password and Textarea live examples. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, eventually, open, section, value, visible } from "./driver.ts";

/** 宽屏顶栏直接点主题钮；<1280 须先打开「更多」站点菜单再点同一按钮（与 special-pages 官方入口一致）。 */
async function clickThemeToggle(page: Page, width: number) {
  if (width >= 1280) {
    await page.getByRole("button", { name: "切换主题", exact: true }).click();
    return;
  }
  const menu = page.getByRole("menu", { name: "站点菜单", exact: true });
  if (!await menu.isVisible()) {
    await page.getByRole("button", { name: "打开顶栏菜单", exact: true })
      .click();
    await visible(menu);
  }
  await menu.getByRole("button", { name: "切换主题", exact: true }).click();
}

async function box(el: Locator) {
  const b = await el.boundingBox();
  if (!b) throw new Error("missing bounding box");
  return b;
}

async function assertLeftOf(label: Locator, control: Locator) {
  const lb = await box(label);
  const cb = await box(control);
  expect(lb.x + lb.width).toBeLessThanOrEqual(cb.x + 1);
  expect(lb.width).toBeGreaterThanOrEqual(112 - 1);
  const midLabel = lb.y + lb.height / 2;
  const midControl = cb.y + cb.height / 2;
  expect(Math.abs(midLabel - midControl)).toBeLessThan(8);
}

async function assertLabelAlign(label: Locator, align: "left" | "right") {
  const lb = await box(label);
  const text = label.locator("span").first();
  const tb = await box(text);
  if (align === "left") {
    expect(Math.abs(tb.x - lb.x)).toBeLessThan(2);
  } else {
    const last = label.locator(":scope > *").last();
    const rb = await box(last);
    expect(Math.abs((rb.x + rb.width) - (lb.x + lb.width))).toBeLessThan(2);
  }
}

describe("Text fields remaining written", () => {
  for (const width of [390, 1280]) {
    it(
      `Input 标签在左侧几何 @${width}：标签在控件左侧且垂直居中`,
      async (t) => {
        const page = await open(t, "/desktop/form/input");
        await page.setViewportSize({ width, height: 900 });
        const root = section(page, "标签在左侧");
        await root.scrollIntoViewIfNeeded();
        for (const id of ["left-name", "left-phone", "left-email"]) {
          const input = page.locator("#" + id);
          const label = root.locator(`label[for="${id}"]`);
          await visible(label);
          await assertLeftOf(label, input);
          await input.fill("几何-" + id);
          await value(input, "几何-" + id);
        }
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Input 左对齐几何 @${width}：标签列内文字左贴齐`,
      async (t) => {
        const page = await open(t, "/desktop/form/input");
        await page.setViewportSize({ width, height: 900 });
        const root = section(page, "左对齐");
        await root.scrollIntoViewIfNeeded();
        for (const id of ["left-name", "left-phone", "left-email"]) {
          const label = root.locator(`label[for="${id}"]`);
          await visible(label);
          expect(
            await label.evaluate((el) => getComputedStyle(el).justifyContent),
          )
            .toBe("flex-start");
          await assertLabelAlign(label, "left");
          const input = page.locator("#" + id);
          await assertLeftOf(label, input);
        }
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Input 右对齐几何 @${width}：标签列内文字右贴齐`,
      async (t) => {
        const page = await open(t, "/desktop/form/input");
        await page.setViewportSize({ width, height: 900 });
        const root = section(page, "右对齐");
        await root.scrollIntoViewIfNeeded();
        for (const id of ["right-name", "right-phone", "right-email"]) {
          const label = root.locator(`label[for="${id}"]`);
          await visible(label);
          expect(
            await label.evaluate((el) => getComputedStyle(el).justifyContent),
          )
            .toBe("flex-end");
          await assertLabelAlign(label, "right");
          const input = page.locator("#" + id);
          await assertLeftOf(label, input);
          await input.fill("右齐-" + id);
          await value(input, "右齐-" + id);
        }
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Input 自动填充与暗色主题 @${width}：精确 autocomplete 与暗色切换后 autofill 样式类仍在`,
      async (t) => {
        const page = await open(t, "/desktop/form/input");
        await page.setViewportSize({ width, height: 900 });
        const root = section(page, "自动填充与暗色主题");
        await root.scrollIntoViewIfNeeded();
        const email = page.locator("#doc-input-autofill-email");
        const password = page.locator("#doc-input-autofill-password");
        await attr(email, "type", "email");
        await attr(email, "autocomplete", "email");
        await attr(password, "type", "password");
        await attr(password, "autocomplete", "current-password");
        for (const el of [email, password]) {
          const cls = await el.evaluate((n) => (n as HTMLElement).className);
          expect(cls.includes("-webkit-autofill")).toBe(true);
          expect(cls.includes("rgb(15_23_42)")).toBe(true);
        }
        const html = page.locator("html");
        const wasDark = await html.evaluate((n) =>
          n.classList.contains("dark")
        );
        await clickThemeToggle(page, width);
        await page.waitForTimeout(80);
        const nowDark = await html.evaluate((n) =>
          n.classList.contains("dark")
        );
        expect(nowDark).toBe(!wasDark);
        const wrap = root.locator("div.rounded-xl").first();
        const bg = await wrap.evaluate((n) =>
          getComputedStyle(n).backgroundColor
        );
        if (nowDark) {
          expect(bg).not.toBe("rgb(255, 255, 255)");
        }
        for (const el of [email, password]) {
          const cls = await el.evaluate((n) => (n as HTMLElement).className);
          expect(cls.includes("-webkit-autofill")).toBe(true);
          expect(cls.includes("dark:[&:-webkit-autofill]")).toBe(true);
        }
        await email.fill("dark-autofill@example.test");
        await value(email, "dark-autofill@example.test");
        await clickThemeToggle(page, width);
        expect(await html.evaluate((n) => n.classList.contains("dark"))).toBe(
          wasDark,
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Input 描边内嵌标签 @${width}：空值提示在框内，有值或聚焦后上到边框，密码可显隐`,
      async (t) => {
        const page = await open(t, "/desktop/form/input");
        await page.setViewportSize({ width, height: 900 });
        const root = section(page, "描边内嵌标签");
        await root.scrollIntoViewIfNeeded();

        function fieldsetOf(id: string) {
          return page.locator("#" + id).locator("xpath=ancestor::fieldset[1]");
        }
        async function legendOpacity(fs: Locator) {
          return await fs.locator("legend").evaluate((n) =>
            getComputedStyle(n).opacity
          );
        }
        async function innerVisible(fs: Locator) {
          const inner = fs.locator(".ui-outlined-inner");
          if (await inner.count() === 0) return false;
          return await inner.evaluate((n) => {
            const cs = getComputedStyle(n);
            return cs.visibility !== "hidden" && cs.opacity !== "0" &&
              cs.display !== "none";
          });
        }

        const empty = fieldsetOf("outline-empty");
        await page.locator("#outline-empty").blur();
        expect(await legendOpacity(empty)).toBe("0");
        expect(await innerVisible(empty)).toBe(true);
        const emptyBox = await box(empty);
        const innerBox = await box(empty.locator(".ui-outlined-inner"));
        expect(innerBox.y).toBeGreaterThan(emptyBox.y);
        expect(innerBox.y + innerBox.height).toBeLessThan(
          emptyBox.y + emptyBox.height,
        );

        await page.locator("#outline-empty").focus();
        await eventually(async () => Number(await legendOpacity(empty)) > 0.9);
        expect(Number(await legendOpacity(empty))).toBeGreaterThan(0.9);
        const focusColor = await empty.locator("legend").evaluate((n) =>
          getComputedStyle(n).color
        );
        expect(
          focusColor === "rgb(37, 99, 235)" ||
            focusColor === "rgb(147, 197, 253)",
        ).toBe(true);
        await page.locator("#outline-empty").blur();

        const filled = fieldsetOf("outline-filled");
        await eventually(async () => Number(await legendOpacity(filled)) > 0.9);
        expect(Number(await legendOpacity(filled))).toBeGreaterThan(0.9);
        const filledLegend = await box(filled.locator("legend"));
        const filledBox = await box(filled);
        expect(filledLegend.y).toBeLessThan(filledBox.y + 8);
        expect(
          await filled.locator("legend").evaluate((n) =>
            (n.textContent ?? "").includes("用户名")
          ),
        ).toBe(true);

        const floated = fieldsetOf("outline-float");
        await page.locator("#outline-float").fill("float@example.test");
        await page.locator("#outline-float").blur();
        await eventually(async () =>
          Number(await legendOpacity(floated)) > 0.9
        );
        expect(Number(await legendOpacity(floated))).toBeGreaterThan(0.9);
        expect(
          (await floated.locator("legend").textContent() ?? "").includes(
            "请输入邮箱",
          ),
        ).toBe(true);

        const pwd = page.locator("#outline-pwd");
        const pwdFs = fieldsetOf("outline-pwd");
        await pwd.fill("outline-secret");
        await value(pwd, "outline-secret");
        await attr(pwd, "type", "password");
        await pwdFs.getByRole("button", { name: "显示密码", exact: true })
          .click();
        await attr(pwd, "type", "text");
        await value(pwd, "outline-secret");
        await pwdFs.getByRole("button", { name: "隐藏密码", exact: true })
          .click();
        await attr(pwd, "type", "password");
        await value(pwd, "outline-secret");
        await eventually(async () => Number(await legendOpacity(pwdFs)) > 0.9);
        expect(Number(await legendOpacity(pwdFs))).toBeGreaterThan(0.9);

        const colorFs = fieldsetOf("outline-color");
        await page.locator("#outline-color").fill("备注内容");
        await page.locator("#outline-color").blur();
        await eventually(async () =>
          Number(await legendOpacity(colorFs)) > 0.9
        );
        expect(Number(await legendOpacity(colorFs))).toBeGreaterThan(0.9);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Password 强度中等边界 @${width}：abc123 为中，再补符号且满 10 位为强`,
      async (t) => {
        const page = await open(t, "/desktop/form/password");
        await page.setViewportSize({ width, height: 900 });
        const strength = section(page, "带强度提示（showStrength）");
        await strength.scrollIntoViewIfNeeded();
        const input = strength.locator("input");
        await input.fill("");
        await visible(strength.getByText(/^强度：/), false);
        await input.fill("abc12");
        await visible(strength.getByText("强度：弱", { exact: true }));
        await input.fill("abc123");
        await visible(strength.getByText("强度：中", { exact: true }));
        await input.fill("abc123!!!!");
        await visible(strength.getByText("强度：强", { exact: true }));
        await input.fill("abc123");
        await visible(strength.getByText("强度：中", { exact: true }));
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Password 前缀图标几何 @${width}：锁图标在输入左侧并与框体重叠`,
      async (t) => {
        const page = await open(t, "/desktop/form/password");
        await page.setViewportSize({ width, height: 900 });
        const root = section(page, "prefix 前缀");
        await root.scrollIntoViewIfNeeded();
        const input = page.locator("#password-prefix");
        const icon = root.locator("svg").first();
        await visible(icon);
        const ib = await box(icon);
        const cb = await box(input);
        expect(ib.x).toBeLessThan(cb.x);
        expect(ib.x + ib.width).toBeLessThanOrEqual(cb.x + 2);
        expect(ib.y + ib.height).toBeGreaterThan(cb.y);
        expect(ib.y).toBeLessThan(cb.y + cb.height);
        expect(ib.width).toBeGreaterThanOrEqual(12);
        expect(ib.width).toBeLessThanOrEqual(22);
        await input.fill("prefix-geom");
        await value(input, "prefix-geom");
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Password 四尺寸几何 @${width}：xs/sm/md/lg 高度递增且仍为密码框`,
      async (t) => {
        const page = await open(t, "/desktop/form/password");
        await page.setViewportSize({ width, height: 900 });
        const root = section(page, "size（xs / sm / md / lg）");
        await root.scrollIntoViewIfNeeded();
        const heights: number[] = [];
        for (const size of ["xs", "sm", "md", "lg"]) {
          const pwd = page.getByPlaceholder(size, { exact: true });
          await pwd.fill("size-secret-" + size);
          await value(pwd, "size-secret-" + size);
          await attr(pwd, "type", "password");
          heights.push((await box(pwd)).height);
        }
        for (let i = 1; i < heights.length; i++) {
          expect(heights[i] > heights[i - 1]).toBe(true);
        }
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Textarea 四尺寸几何 @${width}：xs/sm/md/lg 高度递增且 rows 仍为 2`,
      async (t) => {
        const page = await open(t, "/desktop/form/textarea");
        await page.setViewportSize({ width, height: 900 });
        const root = section(page, "size（xs / sm / md / lg）");
        await root.scrollIntoViewIfNeeded();
        const heights: number[] = [];
        for (const size of ["xs", "sm", "md", "lg"]) {
          const area = page.getByPlaceholder(size, { exact: true });
          await area.fill(size + "\nsecond line");
          await value(area, size + "\nsecond line");
          expect(
            await area.evaluate((el) => (el as HTMLTextAreaElement).rows),
          ).toBe(2);
          heights.push((await box(area)).height);
        }
        for (let i = 1; i < heights.length; i++) {
          expect(heights[i] > heights[i - 1]).toBe(true);
        }
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
