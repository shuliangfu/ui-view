/**
 * uiViewUploadPlugin registry names must be unique when mounting more than one.
 */
import { assertEquals, assertNotEquals } from "@std/assert";
import { uiViewUploadPlugin } from "../upload.ts";

Deno.test("default upload plugin name is ui-view-upload", () => {
  const plugin = uiViewUploadPlugin({ localDir: "./tmp-upload-plugin-name" });
  assertEquals(plugin.name, "ui-view-upload");
});

Deno.test("custom name and standalone keep a second plugin distinct", () => {
  const avatars = uiViewUploadPlugin({
    localDir: "./tmp-upload-plugin-name",
    pathPrefix: "avatars",
  });
  const learn = uiViewUploadPlugin({
    name: "ui-view-upload-learn",
    standalone: true,
    localDir: "./tmp-upload-plugin-name",
    basePath: "/ui-view-upload-learn",
    pathPrefix: "learn",
  });
  assertEquals(avatars.name, "ui-view-upload");
  assertEquals(learn.name, "ui-view-upload-learn");
  assertNotEquals(avatars.name, learn.name);
});
