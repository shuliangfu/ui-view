/**
 * @fileoverview 侧栏 path 与 `collectDesktopDocsRoutes` 扫描结果对账（无浏览器、无 dev）
 */

import { dirname, join } from "@dreamer/runtime-adapter";
import { describe, expect, it } from "@dreamer/test";
import { collectDesktopDocsRoutes } from "./collect-desktop-routes.ts";
import {
  extractDesktopSidebarPathsFromLayout,
  sidebarComponentPathsOnly,
} from "./extract-layout-paths.ts";

/** 规整绝对路径 */
function normalizeAbsolutePath(p: string): string {
  const isAbsolute = p.startsWith("/") || /^[A-Za-z]:[\\/]/.test(p);
  const parts = p.replace(/\\/g, "/").split("/").filter(Boolean);
  const out: string[] = [];
  for (const part of parts) {
    if (part === "..") out.pop();
    else if (part !== ".") out.push(part);
  }
  const joined = out.join("/");
  if (!isAbsolute) return joined;
  if (out[0] && /^[A-Za-z]:$/.test(out[0])) return joined;
  return "/" + joined;
}

const _testDir = dirname(
  typeof import.meta.url !== "undefined" && import.meta.url.startsWith("file:")
    ? new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")
    : join(".", "tests", "docs-sidebar-reconcile.test.ts"),
);
const UI_VIEW_ROOT = normalizeAbsolutePath(join(_testDir, ".."));
const DOCS_ROOT = join(UI_VIEW_ROOT, "docs");

const DESKTOP_ROUTES_SCANNED = await collectDesktopDocsRoutes(DOCS_ROOT);
const SIDEBAR_COMPONENT_PATHS = sidebarComponentPathsOnly(
  await extractDesktopSidebarPathsFromLayout(DOCS_ROOT),
);
const MISSING_SIDEBAR_IN_SCAN = SIDEBAR_COMPONENT_PATHS.filter(
  (p) => !DESKTOP_ROUTES_SCANNED.includes(p),
);

describe("侧栏与文件路由对账（无浏览器）", () => {
  it("侧栏列出的每个组件页路径均在 collectDesktopDocsRoutes 结果中", () => {
    expect(MISSING_SIDEBAR_IN_SCAN).toEqual([]);
  });

  it("扫描到的桌面路由数量不少于侧栏组件页数量", () => {
    expect(DESKTOP_ROUTES_SCANNED.length).toBeGreaterThanOrEqual(
      SIDEBAR_COMPONENT_PATHS.length,
    );
  });
});
