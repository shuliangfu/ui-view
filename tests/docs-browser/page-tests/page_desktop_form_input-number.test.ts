/**
 * @fileoverview 文档路由 `/desktop/form/input-number` 的浏览器测试。
 * InputNumber 数字 — **本文件仅服务该路由**：后续请按文档示例块继续补全分步交互与断言，勿用仓库脚本覆盖正文。
 * Button 全量交互见同目录上级 `interactive-button-full.test.ts`（本包不为 /desktop/basic/button 另建页测文件）。
 */

import { describe, expect, it } from "@dreamer/test";
import {
  DOCS_BROWSER_CONFIG,
  runKeywordAndShallowHere,
  sharedEnv,
} from "../helpers.ts";

/** 固定为本文档 path，便于复制到其他页时改为对应路由 */
const DOC_PATH = "/desktop/form/input-number";

describe("文档页 E2E：/desktop/form/input-number（InputNumber 数字）", () => {
  it("本页关键词命中且 main 内完成浅层交互探针", async (t) => {
    if (!t?.browser?.goto) return;
    await runKeywordAndShallowHere(t, DOC_PATH, [
      /InputNumber|数字/i,
    ]);
  }, DOCS_BROWSER_CONFIG);


  /**
   * UI·示例区主内容可见且有尺寸。
   */
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
      return { ok: r.width > 80 && r.height > 80 && text.length > 20 };
    }) as { ok: boolean };
    expect(got.ok).toBe(true);
  }, DOCS_BROWSER_CONFIG);

});
