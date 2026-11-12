/**
 * Client/server helpers that wire Upload and editors to uiViewUploadPlugin.
 */
import { describe, expect, it } from "@dreamer/test";
import {
  DEFAULT_UI_VIEW_UPLOAD_BASE_PATH,
  getConfiguredUiViewUploadBasePath,
  injectUiViewUploadBasePathHtml,
  resolveUiViewUploadAction,
  resolveUiViewUploadPluginBase,
  setConfiguredUiViewUploadBasePath,
} from "../src/shared/form/upload-base-path.ts";

describe("ui-view upload base path", () => {
  it("set/get configured base path, then clear", () => {
    setConfiguredUiViewUploadBasePath("/custom-upload");
    expect(getConfiguredUiViewUploadBasePath()).toBe("/custom-upload");
    setConfiguredUiViewUploadBasePath(undefined);
    expect(getConfiguredUiViewUploadBasePath()).toBe(undefined);
  });

  it("rejects unsafe configured base path", () => {
    setConfiguredUiViewUploadBasePath("javascript:alert(1)");
    expect(getConfiguredUiViewUploadBasePath()).toBe(undefined);
    setConfiguredUiViewUploadBasePath("/ok/path");
    setConfiguredUiViewUploadBasePath("/foo/../etc");
    expect(getConfiguredUiViewUploadBasePath()).toBe("/ok/path");
    setConfiguredUiViewUploadBasePath(undefined);
  });

  it("resolveUiViewUploadAction prefers explicit action", () => {
    setConfiguredUiViewUploadBasePath("/ui-view-upload");
    expect(resolveUiViewUploadAction("/api/upload")).toBe("/api/upload");
    expect(resolveUiViewUploadAction(undefined)).toBe("/ui-view-upload");
    setConfiguredUiViewUploadBasePath(undefined);
    expect(resolveUiViewUploadAction(undefined)).toBe(undefined);
  });

  it("resolveUiViewUploadPluginBase only for the plugin prefix", () => {
    setConfiguredUiViewUploadBasePath("/ui-view-upload");
    expect(resolveUiViewUploadPluginBase(undefined)).toBe(
      DEFAULT_UI_VIEW_UPLOAD_BASE_PATH,
    );
    expect(resolveUiViewUploadPluginBase("/ui-view-upload")).toBe(
      DEFAULT_UI_VIEW_UPLOAD_BASE_PATH,
    );
    expect(resolveUiViewUploadPluginBase("/api/upload")).toBe(undefined);
    setConfiguredUiViewUploadBasePath("/my-upload");
    expect(resolveUiViewUploadPluginBase(undefined)).toBe("/my-upload");
    expect(resolveUiViewUploadPluginBase("/my-upload/")).toBe("/my-upload");
    expect(
      resolveUiViewUploadPluginBase(DEFAULT_UI_VIEW_UPLOAD_BASE_PATH),
    ).toBe(undefined);
    setConfiguredUiViewUploadBasePath(undefined);
    expect(resolveUiViewUploadPluginBase(undefined)).toBe(undefined);
    expect(
      resolveUiViewUploadPluginBase(DEFAULT_UI_VIEW_UPLOAD_BASE_PATH),
    ).toBe(DEFAULT_UI_VIEW_UPLOAD_BASE_PATH);
  });

  it("injectUiViewUploadBasePathHtml inserts before </head>", () => {
    const html = "<html><head><title>x</title></head><body>ok</body></html>";
    const out = injectUiViewUploadBasePathHtml(html, "/ui-view-upload");
    expect(out.includes('name="ui-view-upload-base-path"')).toBe(true);
    expect(
      out.includes('window.__UI_VIEW_UPLOAD_BASE_PATH__="/ui-view-upload"'),
    )
      .toBe(true);
    expect(out.includes("</head>")).toBe(true);
    expect(injectUiViewUploadBasePathHtml(out, "/ui-view-upload")).toBe(out);
  });

  it("inject ignores unsafe base path", () => {
    const html = "<html><head></head><body></body></html>";
    expect(injectUiViewUploadBasePathHtml(html, '"><script>alert(1)</script>'))
      .toBe(html);
  });
});
