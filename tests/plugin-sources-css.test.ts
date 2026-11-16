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
  collectFollowedModuleFiles,
  extractFollowedPackageSpecifiers,
  localFilesFromDenoInfoJson,
  shouldWriteUiViewSourcesCss,
  tryResolveViaImportMap,
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


describe("跟随 @dreamer/plugins 扫描", () => {
  it("从宿主源码抽出 plugins 说明符，忽略 ui-view", () => {
    const specs = extractFollowedPackageSpecifiers(`
      import { RoutesPage } from "@dreamer/plugins/rbac/pages";
      import { Button } from "@dreamer/ui-view";
      export { load } from "jsr:@dreamer/plugins@1.2.2/rbac/pages/load";
    `);
    expect(specs.includes("@dreamer/plugins/rbac/pages")).toBe(true);
    expect(specs.includes("jsr:@dreamer/plugins@1.2.2/rbac/pages/load")).toBe(
      true,
    );
    expect(specs.includes("@dreamer/ui-view")).toBe(false);
  });

  it("用 deno.json 映射和包 exports 解析子路径，不必跑 deno info", async () => {
    const root = await makeTempDir({ prefix: "follow-map-" });
    try {
      const pkg = join(root, "vendor", "plugins");
      await mkdir(join(pkg, "src", "rbac", "pages"), { recursive: true });
      await writeTextFile(
        join(pkg, "deno.json"),
        `${JSON.stringify({
          name: "@dreamer/plugins",
          exports: {
            ".": "./src/mod.ts",
            "./rbac/pages": "./src/rbac/pages/mod.ts",
          },
        }, null, 2)}\n`,
      );
      await writeTextFile(join(pkg, "src", "mod.ts"), "export {};\n");
      await writeTextFile(
        join(pkg, "src", "rbac", "pages", "mod.ts"),
        "export {};\n",
      );
      await writeTextFile(
        join(root, "deno.json"),
        `${JSON.stringify({
          imports: { "@dreamer/plugins": "./vendor/plugins/src/mod.ts" },
        }, null, 2)}\n`,
      );
      const hit = await tryResolveViaImportMap(
        root,
        "@dreamer/plugins/rbac/pages",
      );
      expect(hit).toBe(join(pkg, "src", "rbac", "pages", "mod.ts"));
    } finally {
      await remove(root, { recursive: true });
    }
  });

  it("deno info --json 只收下跟随包自己的文件，不收入 ui-view", async () => {
    const root = await makeTempDir({ prefix: "follow-info-" });
    try {
      const dir = join(root, "pages");
      await mkdir(dir, { recursive: true });
      const mod = join(dir, "mod.ts");
      const routes = join(dir, "routes.tsx");
      const uiView = join(root, "ui-view-mod.ts");
      await writeTextFile(mod, "export {};\n");
      await writeTextFile(routes, "export {};\n");
      await writeTextFile(uiView, "export {};\n");
      const json = JSON.stringify({
        roots: ["@dreamer/plugins/rbac/pages"],
        modules: [
          {
            specifier: "@dreamer/plugins/rbac/pages",
            local: mod,
            dependencies: [
              { specifier: "./routes.tsx" },
              { specifier: "@dreamer/ui-view" },
            ],
          },
          {
            specifier: `file://${routes}`,
            local: routes,
          },
          {
            specifier: "@dreamer/ui-view",
            local: uiView,
          },
        ],
      });
      const files = localFilesFromDenoInfoJson(json, ["@dreamer/plugins"]);
      expect(files.includes(mod)).toBe(true);
      expect(files.includes(routes)).toBe(true);
      expect(files.includes(uiView)).toBe(false);
    } finally {
      await remove(root, { recursive: true });
    }
  });

  it("本地源码树会跟随相对导入", async () => {
    const root = await makeTempDir({ prefix: "follow-pkg-" });
    try {
      const dir = join(root, "pages");
      await mkdir(dir, { recursive: true });
      await writeTextFile(
        join(dir, "mod.ts"),
        `export { RoutesPage } from "./routes.tsx";\n`,
      );
      await writeTextFile(
        join(dir, "routes.tsx"),
        `import { Transfer } from "@dreamer/ui-view";\nexport function RoutesPage() { return <Transfer dataSource={[]} />; }\n`,
      );
      const files = await collectFollowedModuleFiles(join(dir, "mod.ts"));
      expect(files.some((f) => f.endsWith("mod.ts"))).toBe(true);
      expect(files.some((f) => f.endsWith("routes.tsx"))).toBe(true);
    } finally {
      await remove(root, { recursive: true });
    }
  });

  it("宿主只 import 插件页时，清单仍包含 Transfer", async () => {
    const appRoot = await makeTempDir({ prefix: "follow-app-" });
    const prevCwd = Deno.cwd();
    try {
      const pluginDir = join(appRoot, "vendor", "plugins", "pages");
      await mkdir(pluginDir, { recursive: true });
      await mkdir(join(appRoot, "src"), { recursive: true });
      await writeTextFile(
        join(appRoot, "vendor", "plugins", "deno.json"),
        `${JSON.stringify({ name: "@dreamer/plugins", exports: {} }, null, 2)}\n`,
      );
      await writeTextFile(
        join(pluginDir, "mod.ts"),
        `export { RoutesPage } from "./routes.tsx";\n`,
      );
      await writeTextFile(
        join(pluginDir, "routes.tsx"),
        `import { Transfer } from "@dreamer/ui-view";\nexport function RoutesPage() { return <Transfer dataSource={[]} />; }\n`,
      );
      await writeTextFile(
        join(appRoot, "src", "page.tsx"),
        `import { RoutesPage } from "@dreamer/plugins/rbac/pages";\nexport const Page = () => <RoutesPage />;\n`,
      );
      await writeTextFile(
        join(appRoot, "deno.json"),
        `${JSON.stringify({
          imports: {
            "@dreamer/plugins/rbac/pages": "./vendor/plugins/pages/mod.ts",
            "@dreamer/ui-view": UI_VIEW_ROOT + "/src/mod.ts",
          },
        }, null, 2)}\n`,
      );
      Deno.chdir(appRoot);
      const outputPath = join(appRoot, "assets", "ui-view-sources.css");
      const plugin = uiViewTailwindPlugin({
        outputPath,
        scanPath: "src",
        packageRoot: UI_VIEW_ROOT,
      });
      await withRuntimeEnv("dev", async () => {
        await plugin.onInit?.(stubContainer() as never);
      });
      expect(existsSync(outputPath)).toBe(true);
      const css = await readTextFile(outputPath);
      expect(css.includes("Transfer.tsx")).toBe(true);
      expect(css.includes("routes.tsx")).toBe(true);
    } finally {
      Deno.chdir(prevCwd);
      await remove(appRoot, { recursive: true });
    }
  });

  it("followPackages 为空时不跟随插件页", async () => {
    const appRoot = await makeTempDir({ prefix: "follow-off-" });
    const prevCwd = Deno.cwd();
    try {
      const pluginDir = join(appRoot, "vendor", "plugins", "pages");
      await mkdir(pluginDir, { recursive: true });
      await mkdir(join(appRoot, "src"), { recursive: true });
      await writeTextFile(
        join(pluginDir, "mod.ts"),
        `export { RoutesPage } from "./routes.tsx";\n`,
      );
      await writeTextFile(
        join(pluginDir, "routes.tsx"),
        `import { Transfer } from "@dreamer/ui-view";\nexport function RoutesPage() { return <Transfer dataSource={[]} />; }\n`,
      );
      await writeTextFile(
        join(appRoot, "src", "page.tsx"),
        `import { RoutesPage } from "@dreamer/plugins/rbac/pages";\nexport const Page = () => <RoutesPage />;\n`,
      );
      await writeTextFile(
        join(appRoot, "deno.json"),
        `${JSON.stringify({
          imports: {
            "@dreamer/plugins/rbac/pages": "./vendor/plugins/pages/mod.ts",
          },
        }, null, 2)}\n`,
      );
      Deno.chdir(appRoot);
      const outputPath = join(appRoot, "assets", "ui-view-sources.css");
      const plugin = uiViewTailwindPlugin({
        outputPath,
        scanPath: "src",
        packageRoot: UI_VIEW_ROOT,
        followPackages: [],
      });
      await withRuntimeEnv("dev", async () => {
        await plugin.onInit?.(stubContainer() as never);
      });
      expect(existsSync(outputPath)).toBe(false);
    } finally {
      Deno.chdir(prevCwd);
      await remove(appRoot, { recursive: true });
    }
  });
});
