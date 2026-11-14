/**
 * @fileoverview 文档站在开发模式应保留 VIEW_DEV 与 DevTools overlay。
 * 泄漏已在 @dreamer/view 根源修复，禁止再靠关掉 DevTools 来规避。
 */
import {
  dirname,
  fromFileUrl,
  join,
  readTextFile,
} from "@dreamer/runtime-adapter";
import { describe, expect, it } from "@dreamer/test";

const CLIENT = join(
  dirname(fromFileUrl(import.meta.url)),
  "..",
  "..",
  "docs/src/_client.tsx",
);

describe("文档站保留 View DevTools", () => {
  it("_client.tsx 不再强制关掉 VIEW_DEV / DevTools overlay", async () => {
    const src = await readTextFile(CLIENT);
    expect(src.includes("disableDocsViewDevtools")).toBe(false);
    expect(src.includes("unmountDevtoolsOverlay")).toBe(false);
    expect(src.includes("VIEW_DEV = false")).toBe(false);
    expect(src.includes("VIEW_DEV=false")).toBe(false);
    expect(/VIEW_DEV\s*=\s*false/.test(src)).toBe(false);
  });
});
