/**
 * ui-view Tailwind 按需 content 插件
 *
 * 注册后，onInit 时自动扫描项目中对 @dreamer/ui-view 的引用，收集用到的组件，
 * 生成一个只含 @source "path"; 的 CSS 文件；在 tailwind.css 里 @import 该文件，
 * Tailwind 会扫描这些路径收集 class，一次构建、单份 CSS、无 theme 重复。
 * `@source` 使用相对「生成文件所在目录」的路径，避免写入本机绝对路径导致换机/CI 构建失败。
 *
 * 使用：先注册本插件再注册 tailwindPlugin，并在 tailwind.css 中 @import 生成的 CSS。
 */

import type { Plugin } from "@dreamer/plugin";
import type { ServiceContainer } from "@dreamer/service";
import {
  cwd,
  dirname,
  existsSync,
  fromFileUrl,
  join,
  mkdir,
  readdir,
  readTextFile,
  relative,
  writeTextFile,
} from "@dreamer/runtime-adapter";

/** 用于判定「是否为 @dreamer/ui-view 包根」的标记文件（相对包根） */
const PACKAGE_ROOT_MARKER = "src/mod.ts";

/**
 * dweb `deno task build` 会把应用打进 `dist/server.js`，插件代码里的 `import.meta.url` 会落在 `…/dist/`，
 * 不再是 `ui-view/plugin.ts`。若仍用 `dirname(import.meta.url)` 作为包根，会得到 `docs/dist`，
 * 只会扫到构建产物里零散的 `dist/src/**`，`mergeIntrinsicIconSources` 也扫不全 icons，最终 @source 仅百余行。
 * 从进程 cwd 逐级向上查找同时存在 `plugin.ts` 与 `src/mod.ts` 的目录，即可在 dev 与 build 下都得到真实包根。
 *
 * @returns 包根绝对路径；未找到时返回 null
 */
function findUiViewPackageRootFromCwd(): string | null {
  let dir = cwd();
  const visited = new Set<string>();
  for (let i = 0; i < 20; i++) {
    if (visited.has(dir)) break;
    visited.add(dir);
    const pluginFile = join(dir, "plugin.ts");
    const marker = join(dir, PACKAGE_ROOT_MARKER);
    if (existsSync(pluginFile) && existsSync(marker)) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/**
 * 解析到的目录是否像真实的 ui-view 源码根（含完整 `src/shared`），而非误选的 `dist`。
 *
 * @param dir - 待检测的绝对路径
 */
function looksLikeUiViewSourceRoot(dir: string): boolean {
  /** `dist/` 下通常没有 `plugin.ts`，可区分「打包产物目录」与真实包根 */
  return existsSync(join(dir, "plugin.ts")) &&
    existsSync(join(dir, PACKAGE_ROOT_MARKER)) &&
    existsSync(join(dir, "src/shared/basic/Icon.tsx"));
}

/** 插件配置 */
export interface UiViewTailwindContentPluginOptions {
  /** 生成的 @source 文件路径（相对 cwd 或绝对），用户需在 tailwind.css 中 @import */
  outputPath: string;
  /** 扫描项目源码的目录（相对 cwd，默认 "src"） */
  scanPath?: string;
  /** @dreamer/ui-view 包根目录（可选；不传则用插件所在包根） */
  packageRoot?: string;
}

/**
 * 组件名 → 相对包根的源码路径列表（新增组件时需在本对象中补全对应路径）。
 *
 * 注意：
 * - 导出组件名与「文件导出名」不一致时须多键指向同一文件（如 Title 与 Typography、Toast 与 ToastContainer）。
 * - `Icon*` 单品过多：任意 `Icon` 前缀导入会触发 mergeIntrinsicIconSources 递归扫描 `icons/`。
 * - 纯函数 / store（message、toast、getConfig 等）不含 Tailwind class，无需映射。
 */
const COMPONENT_PATHS: Record<string, string[]> = {
  "Table": [
    "src/desktop/data-display/Table.tsx",
  ],
  "Dialog": [
    "src/desktop/feedback/Dialog.tsx",
  ],
  "Modal": [
    "src/desktop/feedback/Modal.tsx",
  ],
  "Popconfirm": [
    "src/desktop/feedback/Popconfirm.tsx",
  ],
  "Popover": [
    "src/desktop/feedback/Popover.tsx",
  ],
  "Tooltip": [
    "src/desktop/feedback/Tooltip.tsx",
  ],
  "Cascader": [
    "src/desktop/form/Cascader.tsx",
    "src/mobile/form/Cascader.tsx",
  ],
  "DatePicker": [
    "src/desktop/form/DatePicker.tsx",
    "src/mobile/form/DatePicker.tsx",
  ],
  "DateRangePicker": [
    "src/desktop/form/DateRangePicker.tsx",
    "src/mobile/form/DateRangePicker.tsx",
  ],
  "MultiSelect": [
    "src/desktop/form/MultiSelect.tsx",
    "src/mobile/form/MultiSelect.tsx",
  ],
  "Select": [
    "src/desktop/form/Select.tsx",
    "src/mobile/form/Select.tsx",
  ],
  "Transfer": [
    "src/desktop/form/Transfer.tsx",
    "src/shared/form/Transfer.tsx",
    "src/mobile/form/Transfer.tsx",
  ],
  "TreeSelect": [
    "src/desktop/form/TreeSelect.tsx",
  ],
  "Breadcrumb": [
    "src/desktop/navigation/Breadcrumb.tsx",
  ],
  "Dropdown": [
    "src/desktop/navigation/Dropdown.tsx",
  ],
  "ActionSheet": [
    "src/mobile/feedback/ActionSheet.tsx",
  ],
  "BottomSheet": [
    "src/mobile/feedback/BottomSheet.tsx",
  ],
  "PullRefresh": [
    "src/mobile/feedback/PullRefresh.tsx",
  ],
  "SwipeCell": [
    "src/mobile/feedback/SwipeCell.tsx",
  ],
  /** D/M 均有 NavBar 实现，按需扫描两处源码 */
  "NavBar": [
    "src/desktop/navigation/NavBar.tsx",
    "src/mobile/navigation/NavBar.tsx",
  ],
  "TabBar": [
    "src/mobile/navigation/TabBar.tsx",
  ],
  "Avatar": [
    "src/shared/basic/Avatar.tsx",
  ],
  "Badge": [
    "src/shared/basic/Badge.tsx",
  ],
  "Button": [
    "src/shared/basic/Button.tsx",
  ],
  /** 与 Button 同文件导出，仅映射 Button 时按需会漏扫 ButtonGroup 内的 class */
  "ButtonGroup": [
    "src/shared/basic/Button.tsx",
  ],
  "Icon": [
    "src/shared/basic/Icon.tsx",
  ],
  "Link": [
    "src/shared/basic/Link.tsx",
  ],
  "Skeleton": [
    "src/shared/basic/Skeleton.tsx",
  ],
  "Spinner": [
    "src/shared/basic/Spinner.tsx",
  ],
  /**
   * 实际导出名为 Title / Paragraph / Text；若只映射 Typography，按需 @source 会漏扫，
   * 导致如 dark:text-gray-200 等仅写在 Typography.tsx 内的工具类不会进入最终 CSS。
   */
  "Title": [
    "src/shared/basic/Typography.tsx",
  ],
  "Paragraph": [
    "src/shared/basic/Typography.tsx",
  ],
  "Text": [
    "src/shared/basic/Typography.tsx",
  ],
  "Typography": [
    "src/shared/basic/Typography.tsx",
  ],
  "ChartBar": [
    "src/shared/charts/ChartBar.tsx",
  ],
  "ChartBase": [
    "src/shared/charts/ChartBase.tsx",
  ],
  "ChartBubble": [
    "src/shared/charts/ChartBubble.tsx",
  ],
  "ChartDoughnut": [
    "src/shared/charts/ChartDoughnut.tsx",
  ],
  "ChartLine": [
    "src/shared/charts/ChartLine.tsx",
  ],
  "ChartPie": [
    "src/shared/charts/ChartPie.tsx",
  ],
  "ChartPolarArea": [
    "src/shared/charts/ChartPolarArea.tsx",
  ],
  "ChartRadar": [
    "src/shared/charts/ChartRadar.tsx",
  ],
  "ChartScatter": [
    "src/shared/charts/ChartScatter.tsx",
  ],
  "ConfigProvider": [
    "src/shared/config-provider/ConfigProvider.tsx",
  ],
  "Calendar": [
    "src/shared/data-display/Calendar.tsx",
  ],
  "Card": [
    "src/shared/data-display/Card.tsx",
  ],
  "Carousel": [
    "src/shared/data-display/Carousel.tsx",
  ],
  "CodeBlock": [
    "src/shared/data-display/CodeBlock.tsx",
  ],
  "Collapse": [
    "src/shared/data-display/Collapse.tsx",
  ],
  "Comment": [
    "src/shared/data-display/Comment.tsx",
  ],
  "Descriptions": [
    "src/shared/data-display/Descriptions.tsx",
  ],
  "Empty": [
    "src/shared/data-display/Empty.tsx",
  ],
  "Image": [
    "src/shared/data-display/Image.tsx",
  ],
  "ImageViewer": [
    "src/shared/data-display/ImageViewer.tsx",
  ],
  "List": [
    "src/shared/data-display/List.tsx",
  ],
  "Segmented": [
    "src/shared/data-display/Segmented.tsx",
  ],
  "Statistic": [
    "src/shared/data-display/Statistic.tsx",
  ],
  "Tag": [
    "src/shared/data-display/Tag.tsx",
  ],
  "Timeline": [
    "src/shared/data-display/Timeline.tsx",
  ],
  "Tree": [
    "src/shared/data-display/Tree.tsx",
  ],
  "Alert": [
    "src/shared/feedback/Alert.tsx",
  ],
  "Drawer": [
    "src/shared/feedback/Drawer.tsx",
  ],
  "Notification": [
    "src/shared/feedback/Notification.tsx",
  ],
  "Progress": [
    "src/shared/feedback/Progress.tsx",
  ],
  "Result": [
    "src/shared/feedback/Result.tsx",
  ],
  "Toast": [
    "src/shared/feedback/Toast.tsx",
  ],
  /** 包内 JSX 导出名为 *Container，须单独映射否则只用 Toast 时不会扫 Toast.tsx */
  "ToastContainer": [
    "src/shared/feedback/Toast.tsx",
  ],
  "MessageContainer": [
    "src/shared/feedback/Message.tsx",
  ],
  "NotificationContainer": [
    "src/shared/feedback/Notification.tsx",
  ],
  "AutoComplete": [
    "src/shared/form/AutoComplete.tsx",
  ],
  "Checkbox": [
    "src/shared/form/Checkbox.tsx",
  ],
  "CheckboxGroup": [
    "src/shared/form/CheckboxGroup.tsx",
  ],
  "ColorPicker": [
    "src/shared/form/ColorPicker.tsx",
  ],
  "Form": [
    "src/shared/form/Form.tsx",
  ],
  "FormItem": [
    "src/shared/form/FormItem.tsx",
  ],
  "FormList": [
    "src/shared/form/FormList.tsx",
  ],
  "Input": [
    "src/shared/form/Input.tsx",
  ],
  "InputNumber": [
    "src/shared/form/InputNumber.tsx",
  ],
  "Mentions": [
    "src/shared/form/Mentions.tsx",
  ],
  "Password": [
    "src/shared/form/Password.tsx",
  ],
  "Radio": [
    "src/shared/form/Radio.tsx",
  ],
  "RadioGroup": [
    "src/shared/form/RadioGroup.tsx",
  ],
  "Rate": [
    "src/shared/form/Rate.tsx",
  ],
  "RichTextEditor": [
    "src/shared/form/RichTextEditor.tsx",
  ],
  "Search": [
    "src/shared/form/Search.tsx",
  ],
  "Slider": [
    "src/shared/form/Slider.tsx",
  ],
  "Switch": [
    "src/shared/form/Switch.tsx",
  ],
  "Textarea": [
    "src/shared/form/Textarea.tsx",
  ],
  "TimePicker": [
    "src/shared/form/TimePicker.tsx",
  ],
  "TimeRangePicker": [
    "src/shared/form/TimeRangePicker.tsx",
  ],
  "Upload": [
    "src/shared/form/Upload.tsx",
  ],
  "Accordion": [
    "src/shared/layout/Accordion.tsx",
  ],
  "Container": [
    "src/shared/layout/Container.tsx",
  ],
  "Divider": [
    "src/shared/layout/Divider.tsx",
  ],
  "Grid": [
    "src/shared/layout/Grid.tsx",
  ],
  "Hero": [
    "src/shared/layout/Hero.tsx",
  ],
  "Stack": [
    "src/shared/layout/Stack.tsx",
  ],
  "Tabs": [
    "src/shared/layout/Tabs.tsx",
  ],
  "Affix": [
    "src/shared/navigation/Affix.tsx",
  ],
  "Anchor": [
    "src/shared/navigation/Anchor.tsx",
  ],
  "BackTop": [
    "src/shared/navigation/BackTop.tsx",
  ],
  "Menu": [
    "src/shared/navigation/Menu.tsx",
  ],
  "PageHeader": [
    "src/shared/navigation/PageHeader.tsx",
  ],
  "Pagination": [
    "src/shared/navigation/Pagination.tsx",
  ],
  "Sidebar": [
    "src/shared/navigation/Sidebar.tsx",
  ],
  "Steps": [
    "src/shared/navigation/Steps.tsx",
  ],
};

/**
 * 匹配具名导入：主包、子路径（如 @dreamer/ui-view/mobile、/form）、jsr: spec。
 * 注意：仅 `@dreamer/ui-view` 不含后续路径时，`/mobile` 会留在引号内导致整段匹配失败，故必须允许 `/…`。
 */
const RE_NAMED_IMPORT =
  /import\s*(?:type\s*)?\{\s*([^}]+)\}\s*from\s*["'](?:@dreamer\/ui-view(?:\/[^"']*)?|jsr:[^"']*ui-view[^"']*)["']/g;

function parseNamedImportSpecifiers(specifiers: string): string[] {
  return specifiers
    .split(",")
    .map((s) => s.trim().split(/\s+as\s+/i)[0].trim())
    .filter(Boolean);
}

async function collectTsTsx(
  dir: string,
  baseDir: string,
  out: string[],
): Promise<void> {
  const entries = await readdir(dir);
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      await collectTsTsx(full, baseDir, out);
    } else if (
      entry.isFile &&
      (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))
    ) {
      out.push(full);
    }
  }
}

function extractUsedNames(content: string): string[] {
  const names = new Set<string>();
  let m: RegExpExecArray | null;
  RE_NAMED_IMPORT.lastIndex = 0;
  while ((m = RE_NAMED_IMPORT.exec(content)) !== null) {
    for (const name of parseNamedImportSpecifiers(m[1])) {
      names.add(name);
    }
  }
  return Array.from(names);
}

/** 根据用到的组件名和包根，得到应加入 @source 的绝对路径列表（去重排序） */
function getContentPaths(usedNames: string[], packageRoot: string): string[] {
  const root = packageRoot.replace(/\/+$/, "");
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of usedNames) {
    const paths = COMPONENT_PATHS[name];
    if (!paths) continue;
    for (const rel of paths) {
      const full = `${root}/${rel}`.replace(/\/+/g, "/");
      if (seen.has(full)) continue;
      seen.add(full);
      out.push(full);
    }
  }
  return out.sort();
}

/**
 * 内置图标以 `IconXxx` 单独导出、文件分散在 icons/ 子目录；不可能在 COMPONENT_PATHS 中逐一手写。
 * 若扫描结果中出现任意 `Icon` 前缀组件名，则递归加入 `src/shared/basic/icons` 下全部 `.tsx` 供 Tailwind 收集 class。
 *
 * @param usedNames - 从项目源码提取的具名导入符号
 * @param packageRoot - ui-view 包根绝对路径
 * @param paths - getContentPaths 结果，本函数会原地追加并重新排序
 */
async function mergeIntrinsicIconSources(
  usedNames: Iterable<string>,
  packageRoot: string,
  paths: string[],
): Promise<void> {
  let anyIcon = false;
  for (const n of usedNames) {
    if (/^Icon[A-Z]/.test(n)) {
      anyIcon = true;
      break;
    }
  }
  if (!anyIcon) return;
  const iconRoot = join(packageRoot, "src/shared/basic/icons");
  const iconFiles: string[] = [];
  try {
    await collectTsTsx(iconRoot, iconRoot, iconFiles);
  } catch {
    return;
  }
  const seen = new Set(paths);
  for (const f of iconFiles) {
    if (seen.has(f)) continue;
    seen.add(f);
    paths.push(f);
  }
  paths.sort();
}

/**
 * 将组件源码绝对路径转为写入 `ui-view-sources.css` 的 `@source` 引用串。
 * Tailwind v4 按「当前 CSS 文件所在目录」解析相对路径；若写入本机绝对路径（如 `/Users/...`），
 * 在其它机器或 CI（路径不同）上 `deno task build` 会找不到文件或 Tailwind 报错。
 *
 * @param sourcesCssDir - 生成的 `ui-view-sources.css` 所在目录（绝对路径）
 * @param absFilePath - 待扫描的 `.ts`/`.tsx` 绝对路径
 * @returns 以 `./` 或 `../` 开头的相对路径（正斜杠）
 */
function toAtSourceSpecifier(
  sourcesCssDir: string,
  absFilePath: string,
): string {
  let rel = relative(sourcesCssDir, absFilePath);
  if (rel === "" || rel === ".") {
    return ".";
  }
  rel = rel.replace(/\\/g, "/");
  /** Windows 跨盘符时 relative 可能返回 `D:/...` 绝对路径，勿再加 `./` 前缀 */
  if (/^[A-Za-z]:\//.test(rel) || rel.startsWith("/")) {
    return rel;
  }
  if (!rel.startsWith(".")) {
    return `./${rel}`;
  }
  return rel;
}

/**
 * 创建 ui-view Tailwind 按需 content 插件
 *
 * 参数：outputPath（生成文件路径）、scanPath（扫描目录）、packageRoot（可选）。
 * 在 onInit 时即扫描导入的 ui-view 组件，生成只含 @source 的 CSS，Tailwind 扫描该文件即可收集 class。
 */
export function uiViewTailwindPlugin(
  options: UiViewTailwindContentPluginOptions,
): Plugin {
  const {
    outputPath,
    scanPath = "src",
    packageRoot: optionPackageRoot,
  } = options;

  const resolvePackageRoot = (): string => {
    if (optionPackageRoot) {
      return optionPackageRoot.startsWith("/")
        ? optionPackageRoot
        : join(cwd(), optionPackageRoot);
    }
    const fromMeta = dirname(fromFileUrl(import.meta.url));
    if (looksLikeUiViewSourceRoot(fromMeta)) {
      return fromMeta;
    }
    const fromCwd = findUiViewPackageRootFromCwd();
    if (fromCwd != null) {
      return fromCwd;
    }
    return fromMeta;
  };

  return {
    name: "ui-view-tailwind-content",
    version: "0.1.0",

    async onInit(container: ServiceContainer): Promise<void> {
      const logger = container.tryGet<
        { info: (msg: string) => void; debug: (msg: string) => void }
      >(
        "logger",
      );
      const root = cwd();
      const scanDir = join(root, scanPath);

      const files: string[] = [];
      try {
        await collectTsTsx(scanDir, scanDir, files);
      } catch (e) {
        if (logger) {
          logger.info(`[ui-view-tailwind-content] 扫描目录跳过: ${e}`);
        }
        return;
      }

      const usedNames = new Set<string>();
      for (const filePath of files) {
        try {
          const content = await readTextFile(filePath);
          for (const name of extractUsedNames(content)) {
            usedNames.add(name);
          }
        } catch {
          // ignore
        }
      }

      const names = Array.from(usedNames);
      if (names.length === 0) {
        if (logger) {
          logger.info(
            "[ui-view-tailwind-content] 未发现 @dreamer/ui-view 引用，跳过生成",
          );
        }
        return;
      }

      const pkgRoot = resolvePackageRoot();
      const paths = getContentPaths(names, pkgRoot);
      await mergeIntrinsicIconSources(names, pkgRoot, paths);

      const outAbs = outputPath.startsWith("/")
        ? outputPath
        : join(root, outputPath);
      const sourcesCssDir = dirname(outAbs);
      const cssContent = paths
        .map((p) => `@source "${toAtSourceSpecifier(sourcesCssDir, p)}";`)
        .join("\n") + "\n";

      await mkdir(sourcesCssDir, { recursive: true });
      await writeTextFile(outAbs, cssContent);

      if (logger) {
        logger.debug(
          `[ui-view-tailwind-content] 已生成 ${paths.length} 个`,
        );
        logger.debug(
          `@source → ${outputPath}`,
        );
      }
    },
  };
}
