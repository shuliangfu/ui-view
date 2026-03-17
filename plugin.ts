/**
 * ui-view Tailwind 按需 content 插件
 *
 * 注册后，onInit 时自动扫描项目中对 @dreamer/ui-view 的引用，收集用到的组件，
 * 生成一个只含 @source "path"; 的 CSS 文件；在 tailwind.css 里 @import 该文件，
 * Tailwind 会扫描这些路径收集 class，一次构建、单份 CSS、无 theme 重复。
 *
 * 使用：先注册本插件再注册 tailwindPlugin，并在 tailwind.css 中 @import 生成的 CSS。
 */

import type { Plugin } from "@dreamer/plugin";
import type { ServiceContainer } from "@dreamer/service";
import {
  cwd,
  dirname,
  fromFileUrl,
  join,
  mkdir,
  readdir,
  readTextFile,
  writeTextFile,
} from "@dreamer/runtime-adapter";

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
 * 组件名 → 相对包根的源码路径列表（新增组件时需在本对象中补全对应路径）
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
    "src/shared/data-display/Transfer.tsx",
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
  "NavBar": [
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
  "Navbar": [
    "src/shared/navigation/Navbar.tsx",
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

/** 匹配 import { A, B } from "@dreamer/ui-view" 或 from "jsr:@dreamer/ui-view..." */
const RE_NAMED_IMPORT =
  /import\s*(?:type\s*)?\{\s*([^}]+)\}\s*from\s*["'](?:@dreamer\/ui-view|jsr:[^"']*ui-view[^"']*)["']/g;

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
 * 创建 ui-view Tailwind 按需 content 插件
 *
 * 参数：outputPath（生成文件路径）、scanPath（扫描目录）、packageRoot（可选）。
 * 在 onInit 时即扫描导入的 ui-view 组件，生成只含 @source 的 CSS，Tailwind 扫描该文件即可收集 class。
 */
export function uiViewTailwindContentPlugin(
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
    return dirname(fromFileUrl(import.meta.url));
  };

  return {
    name: "ui-view-tailwind-content",
    version: "0.1.0",

    async onInit(container: ServiceContainer): Promise<void> {
      const logger = container.tryGet<{ info: (msg: string) => void }>(
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
      const cssContent = paths.map((p) => `@source "${p}";`).join("\n") + "\n";

      const outAbs = outputPath.startsWith("/")
        ? outputPath
        : join(root, outputPath);
      await mkdir(dirname(outAbs), { recursive: true });
      await writeTextFile(outAbs, cssContent);

      if (logger) {
        logger.info(
          `[ui-view-tailwind-content] 已生成 ${paths.length} 个 @source → ${outputPath}`,
        );
      }
    },
  };
}
