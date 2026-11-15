/**
 * ingestDenoInfoJsonModules：一次 deno info --json 即可灌进查找表。
 */
import { join, makeTempDir, writeTextFile } from "@dreamer/runtime-adapter";
import {
  clearUiViewDenoInfoCachesForTests,
  ingestDenoInfoJsonModules,
} from "../plugin.ts";
import { describe, expect, it } from "@dreamer/test";

describe("ingestDenoInfoJsonModules", () => {
  it("maps ui-view jsr specifier to an existing local path and ignores others", async () => {
    clearUiViewDenoInfoCachesForTests();
    const dir = await makeTempDir({ prefix: "ui-view-info-json-" });
    const local = join(dir, "Button.tsx");
    await writeTextFile(local, "export const Button = () => null;\n");
    const missing = join(dir, "missing.tsx");
    const json = JSON.stringify({
      modules: [
        {
          specifier: "file:///tmp/app/main.ts",
          local: "/tmp/app/main.ts",
        },
        {
          specifier:
            "https://jsr.io/@dreamer/ui-view/1.3.12/src/desktop/basic/Button.tsx",
          local,
        },
        {
          specifier:
            "https://jsr.io/@dreamer/ui-view/1.3.12/src/desktop/basic/Missing.tsx",
          local: missing,
        },
      ],
    });
    const result = ingestDenoInfoJsonModules(json);
    expect(result.version).toBe("1.3.12");
    expect(result.count).toBe(1);
  });

  it("returns empty result for invalid json", () => {
    clearUiViewDenoInfoCachesForTests();
    expect(ingestDenoInfoJsonModules("not-json")).toEqual({
      version: null,
      count: 0,
    });
  });
});
