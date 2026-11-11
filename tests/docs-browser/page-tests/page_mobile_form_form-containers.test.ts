/**
 * @fileoverview 文档路由 `/mobile/form/form-containers` 的浏览器测试。
 */

import { describe, expect, it } from "@dreamer/test";
import {
  assertStrictDocSection,
  DOCS_BROWSER_CONFIG,
  runKeywordAndShallowHere,
  sharedEnv,
} from "../helpers.ts";

const DOC_PATH = "/mobile/form/form-containers";

describe("文档页 E2E：/mobile/form/form-containers（Form 容器·移动）", () => {
  it("本页关键词命中且 main 内完成浅层交互探针", async (t) => {
    if (!t?.browser?.goto) return;
    await runKeywordAndShallowHere(t, DOC_PATH, [
      /Form|createForm|Passcode|表单/i,
    ]);
  }, DOCS_BROWSER_CONFIG);

  /**
   * 文档小节「与 createForm」：在 main 内定位对应 h3，于该示例区块内完成一次交互。
   */
  it("严格·与 createForm", async (t) => {
    if (!t?.browser?.goto) return;
    await assertStrictDocSection(t, DOC_PATH);
  }, DOCS_BROWSER_CONFIG);

  it("UI·示例区可见有尺寸", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    await sharedEnv.delay(120);
    const got = await t.browser.evaluate(() => {
      const main = document.querySelector("main") as HTMLElement | null;
      if (!main) return { ok: false };
      const r = main.getBoundingClientRect();
      const text = (main.innerText || "").trim();
      return {
        ok: r.width > 80 && r.height > 80 && text.length > 20,
      };
    }) as { ok: boolean };
    expect(got.ok).toBe(true);
  }, DOCS_BROWSER_CONFIG);
});
