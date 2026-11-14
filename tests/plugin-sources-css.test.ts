/**
 * uiViewTailwindPlugin 只在 dev/build 写入 ui-view-sources.css；
 * RUNTIME_ENV=start（生产启动）不得把清单写回源码树。
 */
import {
  cwd,
  deleteEnv,
  dirname,
  existsSync,
  fromFileUrl,
  getEnv,
  join,
  makeTempDir,
  mkdir,
  readTextFile,
  relative,
  remove,
  setEnv,
  writeTextFile,
} from "@dreamer/runtime-adapter";
import { describe, expect, it } from "@dreamer/test";
import {
  shouldWriteUiViewSourcesCss,
  uiViewTailwindPlugin,
} from "../plugin.ts";

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

async function makeFixture(): Promise<{
  scanDir: string;
  outputPath: string;
  cleanup: () => Promise<void>;
}> {
  const root = await makeTempDir({ prefix: "ui-view-sources-" });
  const scanDir = join(root, "app");
  await mkdir(scanDir, { recursive: true });
  await writeTextFile(
    join(scanDir, "page.tsx"),
    `import { Button } from "@dreamer/ui-view/basic";\nexport const Page = () => <Button>ok</Button>;\n`,
  );
  // scanPath 按约定相对 cwd；runtime-adapter 1.x 的 join 不会把第二个绝对路径当作根
  return {
    scanDir: relative(cwd(), scanDir),
    outputPath: join(root, "assets", "ui-view-sources.css"),
    cleanup: async () => {
      await remove(root, { recursive: true });
    },
  };
}

describe("shouldWriteUiViewSourcesCss", () => {
  it("dev 与 build 以及未设置时允许写入，start 不允许", () => {
    expect(shouldWriteUiViewSourcesCss("dev")).toBe(true);
    expect(shouldWriteUiViewSourcesCss("build")).toBe(true);
    expect(shouldWriteUiViewSourcesCss(undefined)).toBe(true);
    expect(shouldWriteUiViewSourcesCss("start")).toBe(false);
  });

  it("默认读取进程 RUNTIME_ENV", async () => {
    await withRuntimeEnv("start", () => {
      expect(shouldWriteUiViewSourcesCss()).toBe(false);
    });
    await withRuntimeEnv("dev", () => {
      expect(shouldWriteUiViewSourcesCss()).toBe(true);
    });
  });
});

describe("uiViewTailwindPlugin onInit 写入时机", () => {
  it("RUNTIME_ENV=start 不创建也不改写 ui-view-sources.css", async () => {
    const fx = await makeFixture();
    try {
      await mkdir(dirname(fx.outputPath), { recursive: true });
      await writeTextFile(fx.outputPath, "SENTINEL\n");
      const plugin = uiViewTailwindPlugin({
        outputPath: fx.outputPath,
        scanPath: fx.scanDir,
        packageRoot: UI_VIEW_ROOT,
      });
      await withRuntimeEnv("start", async () => {
        await plugin.onInit?.(stubContainer() as never);
      });
      expect(await readTextFile(fx.outputPath)).toBe("SENTINEL\n");
    } finally {
      await fx.cleanup();
    }
  });

  it("RUNTIME_ENV=start 且目标文件不存在时不会新建", async () => {
    const fx = await makeFixture();
    try {
      const plugin = uiViewTailwindPlugin({
        outputPath: fx.outputPath,
        scanPath: fx.scanDir,
        packageRoot: UI_VIEW_ROOT,
      });
      await withRuntimeEnv("start", async () => {
        await plugin.onInit?.(stubContainer() as never);
      });
      expect(existsSync(fx.outputPath)).toBe(false);
    } finally {
      await fx.cleanup();
    }
  });

  it("RUNTIME_ENV=dev 仍写入 @source 清单", async () => {
    const fx = await makeFixture();
    try {
      const plugin = uiViewTailwindPlugin({
        outputPath: fx.outputPath,
        scanPath: fx.scanDir,
        packageRoot: UI_VIEW_ROOT,
      });
      await withRuntimeEnv("dev", async () => {
        await plugin.onInit?.(stubContainer() as never);
      });
      expect(existsSync(fx.outputPath)).toBe(true);
      const css = await readTextFile(fx.outputPath);
      expect(css.includes("@source")).toBe(true);
      expect(css.includes("Button.tsx")).toBe(true);
    } finally {
      await fx.cleanup();
    }
  });

  it("RUNTIME_ENV=build 仍写入 @source 清单", async () => {
    const fx = await makeFixture();
    try {
      const plugin = uiViewTailwindPlugin({
        outputPath: fx.outputPath,
        scanPath: fx.scanDir,
        packageRoot: UI_VIEW_ROOT,
      });
      await withRuntimeEnv("build", async () => {
        await plugin.onInit?.(stubContainer() as never);
      });
      expect(existsSync(fx.outputPath)).toBe(true);
      const css = await readTextFile(fx.outputPath);
      expect(css.includes("@source")).toBe(true);
      expect(css.includes("Button.tsx")).toBe(true);
    } finally {
      await fx.cleanup();
    }
  });
});

describe("uiViewTailwindPlugin 跟随内部相对导入", () => {
  it("引用 DataPanel 时会连带扫到 DatePicker 与 Calendar", async () => {
    const fx = await makeFixture();
    try {
      await writeTextFile(
        join(cwd(), fx.scanDir, "page.tsx"),
        `import { DataPanel } from "@dreamer/ui-view";\nexport const Page = () => <DataPanel title="t" columns={[]} />;\n`,
      );
      const plugin = uiViewTailwindPlugin({
        outputPath: fx.outputPath,
        scanPath: fx.scanDir,
        packageRoot: UI_VIEW_ROOT,
      });
      await withRuntimeEnv("dev", async () => {
        await plugin.onInit?.(stubContainer() as never);
      });
      const css = await readTextFile(fx.outputPath);
      expect(css.includes("DatePicker.tsx")).toBe(true);
      expect(css.includes("Calendar.tsx")).toBe(true);
      expect(css.includes("data-display/Calendar.tsx")).toBe(true);
    } finally {
      await fx.cleanup();
    }
  });
});
