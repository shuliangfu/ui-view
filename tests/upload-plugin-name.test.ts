/**
 * uiViewUploadPlugin registry names must be unique when mounting more than one.
 */
import { describe, expect, it } from "@dreamer/test";
import { uiViewUploadPlugin } from "../upload.ts";

describe("uiViewUploadPlugin name", () => {
  it("default upload plugin name is ui-view-upload", () => {
    const plugin = uiViewUploadPlugin({ localDir: "./tmp-upload-plugin-name" });
    expect(plugin.name).toBe("ui-view-upload");
  });

  it("custom name and standalone keep a second plugin distinct", () => {
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
    expect(avatars.name).toBe("ui-view-upload");
    expect(learn.name).toBe("ui-view-upload-learn");
    expect(avatars.name).not.toBe(learn.name);
  });
});
