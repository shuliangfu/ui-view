/**
 * uiViewTailwindPlugin: skip rewriting unchanged CSS, and only include
 * used intrinsic icon sources.
 */
import {
  cwd,
  dirname,
  fromFileUrl,
  getEnv,
  deleteEnv,
  setEnv,
  join,
  makeTempDir,
  mkdir,
  readTextFile,
  relative,
  remove,
  writeTextFile,
} from "@dreamer/runtime-adapter";
import { describe, expect, it } from "@dreamer/test";
import { uiViewTailwindPlugin } from "../plugin.ts";
import { stat } from "node:fs/promises";

const UI_VIEW_ROOT = join(dirname(fromFileUrl(import.meta.url)), "..");

type StubContainer = {
  has: (id: string) => boolean;
  get: (id: string) => unknown;
  tryGet: (id: string) => unknown;
};

function stubContainer(): StubContainer {
  return {
    has: () => false,
    get: () => {
      throw new Error("unexpected container.get");
    },
    tryGet: () => undefined,
  };
}

async function withRuntimeEnv<T>(
  value: string | undefined,
  fn: () => Promise<T> | T,
): Promise<T> {
  const prev = getEnv("RUNTIME_ENV");
  try {
    if (value === undefined) {
      deleteEnv("RUNTIME_ENV");
    } else {
      setEnv("RUNTIME_ENV", value);
    }
    return await fn();
  } finally {
    if (prev === undefined) {
      deleteEnv("RUNTIME_ENV");
    } else {
      setEnv("RUNTIME_ENV", prev);
    }
  }
}

describe("uiViewTailwindPlugin scan optimizations", () => {
  it("does not rewrite ui-view-sources.css when content is unchanged", async () => {
    const root = await makeTempDir({ prefix: "ui-view-sources-opt-" });
    const scanDir = join(root, "app");
    await mkdir(scanDir, { recursive: true });
    await writeTextFile(
      join(scanDir, "page.tsx"),
      `import { Button } from "@dreamer/ui-view/basic";\nexport const Page = () => <Button>ok</Button>;\n`,
    );
    const outputPath = join(root, "assets", "ui-view-sources.css");
    const plugin = uiViewTailwindPlugin({
      outputPath,
      scanPath: relative(cwd(), scanDir),
      packageRoot: UI_VIEW_ROOT,
    });
    try {
      await withRuntimeEnv("dev", async () => {
        await plugin.onInit?.(stubContainer() as never);
        const first = await readTextFile(outputPath);
        expect(first.includes("Button.tsx")).toBe(true);
        const m1 = (await stat(outputPath)).mtimeMs;
        await new Promise((r) => setTimeout(r, 50));
        await plugin.onInit?.(stubContainer() as never);
        expect(await readTextFile(outputPath)).toBe(first);
        expect((await stat(outputPath)).mtimeMs).toBe(m1);
      });
    } finally {
      await remove(root, { recursive: true });
    }
  });

  it("adds only used Icon sources, not the whole icons directory", async () => {
    const root = await makeTempDir({ prefix: "ui-view-sources-icon-" });
    const scanDir = join(root, "app");
    await mkdir(scanDir, { recursive: true });
    await writeTextFile(
      join(scanDir, "page.tsx"),
      `import { Button, IconSearch } from "@dreamer/ui-view/basic";\nexport const Page = () => <Button><IconSearch /></Button>;\n`,
    );
    const outputPath = join(root, "assets", "ui-view-sources.css");
    const plugin = uiViewTailwindPlugin({
      outputPath,
      scanPath: relative(cwd(), scanDir),
      packageRoot: UI_VIEW_ROOT,
    });
    try {
      await withRuntimeEnv("dev", async () => {
        await plugin.onInit?.(stubContainer() as never);
        const css = await readTextFile(outputPath);
        expect(css.includes("Button.tsx")).toBe(true);
        expect(css.includes("Icon.tsx")).toBe(true);
        expect(css.includes("icons/Search.tsx")).toBe(true);
        expect(css.includes("icons/Angry.tsx")).toBe(false);
        expect(css.includes("icons/Zap.tsx")).toBe(false);
      });
    } finally {
      await remove(root, { recursive: true });
    }
  });
});
