/**
 * @module @dreamer/ui-view/plugin
 * @packageDocumentation
 *
 * @description
 * **JSR**：`import … from "@dreamer/ui-view/plugin"`。为 **Tailwind CSS v4** 提供按需 **content** 扫描：在 dweb `onInit` 中解析项目对 `@dreamer/ui-view` 的引用，生成仅含 `@source "相对路径";` 的 CSS 片段文件。
 *
 * ### 行为概要
 * - 输出文件路径由 **`outputPath`** 指定；业务在 `tailwind.css` 中 `@import` 该文件即可让 Tailwind 扫描实际用到的组件源路径。
 * - `@source` 路径相对于生成文件所在目录书写，避免把本机绝对路径写入仓库。
 * - 插件入口：**{@link uiViewTailwindPlugin}**（返回 `Plugin`，含 `onInit`）。
 *
 * ### 使用顺序
 * 先注册本插件，再注册 Tailwind 官方/封装插件；并在样式入口 `@import` 生成的 `@source` 文件。
 *
 * @see {@link uiViewTailwindPlugin} 工厂函数与选项说明
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
 * 本插件文件所在目录：仅当 `import.meta.url` 为 `file:` 时可转为本地路径。
 * 从 **JSR** 加载时 URL 为 `https:`，若调用 `fromFileUrl(import.meta.url)` 会抛出 `ERR_INVALID_URL_SCHEME`，故必须先判断协议。
 *
 * @returns `file:` 时为目录绝对路径，否则 `undefined`
 */
function dirnameOfThisPluginIfFileUrl(): string | undefined {
  try {
    const u = new URL(import.meta.url);
    if (u.protocol !== "file:") {
      return undefined;
    }
    return dirname(fromFileUrl(u));
  } catch {
    return undefined;
  }
}

/**
 * 从 JSR 安装时，Deno 在 `nodeModulesDir: "auto"` 下常把包放到 `node_modules/@jsr/dreamer__ui-view`，
 * 目录内为完整包布局（含 `src/mod.ts`），可供 `getContentPaths` 拼绝对路径。
 * （JSR 全局缓存里的 `local` 多为内容寻址单文件，**不是**包目录树，不能作 packageRoot。）
 *
 * @returns 包根绝对路径；未找到时 `null`
 */
function tryResolveUiViewPackageRootFromNodeModules(): string | null {
  const root = cwd();
  const candidates = [
    join(root, "node_modules", "@jsr", "dreamer__ui-view"),
    join(root, "node_modules", "@dreamer", "ui-view"),
  ];
  for (const dir of candidates) {
    if (existsSync(join(dir, PACKAGE_ROOT_MARKER))) {
      return dir;
    }
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
 * - Button / ButtonGroup / Link 依赖 `button-variants.ts` 中的类名字符串，映射中须同时列出该文件。
 * - Input、Select、DatePicker 等依赖 `input-focus-ring.ts` 中的 `focus:ring-*`、`has-[input:focus]:*`、`pickerTriggerSurface` 等类名字符串，映射中须同时列出该文件（与 button-variants 同理）。
 * - DatePicker / DateTimePicker / TimePicker 依赖 `picker-portal-utils.ts` 中的 `pickerTimeListScrollClass`（含隐藏滚动条、列宽等任意类），须一并扫描，否则按需构建会丢样式。
 * - RichTextEditor 从同文件引用 `getFormPortalBodyHost`，若需该文件内其它类名亦须映射。
 * - MarkdownEditor 使用 `@dreamer/markdown` 的 `parse` 与桌面 `Tooltip`；须映射 `MarkdownEditor.tsx`、`Tooltip.tsx`、`input-focus-ring.ts`。
 * - 单文件图标（`icons/*.tsx`）、`Calendar.tsx`、`ChartBase.tsx` 等被组件 import 时须写入对应组件的路径列表；`getContentPaths` 会去重。
 * - 纯函数 / store（message、toast、getConfig 等）不含 Tailwind class，无需映射。
 * - `desktop/form`、`mobile/form` 下若仅为 `export * from ../../shared/form/...` 的薄再导出，只列 **shared 实现文件** 即可，不必重复写 D/M 路径。
 */

const COMPONENT_PATHS: Record<string, string[]> = {
  "Table": [
    "src/desktop/data-display/Table.tsx",
    "src/shared/form/DatePicker.tsx",
    "src/shared/form/TimePicker.tsx",
    "src/shared/form/picker-portal-utils.ts",
    "src/shared/form/picker-trigger-icon.ts",
    "src/shared/form/picker-calendar-nav.tsx",
    "src/shared/data-display/Calendar.tsx",
    "src/shared/data-display/calendar-utils.ts",
    "src/shared/basic/icons/Calendar.tsx",
    "src/shared/basic/icons/ChevronLeft.tsx",
    "src/shared/basic/icons/ChevronRight.tsx",
    "src/shared/basic/icons/Clock.tsx",
    "src/shared/form/input-focus-ring.ts",
    "src/shared/basic/icons/ChevronDown.tsx",
    "src/shared/basic/icons/ChevronUp.tsx",
  ],
  "Dialog": [
    "src/desktop/feedback/Dialog.tsx",
    "src/shared/basic/Button.tsx",
    "src/shared/basic/button-variants.ts",
    "src/desktop/feedback/Modal.tsx",
    "src/shared/basic/icons/Close.tsx",
    "src/shared/basic/icons/ExitFullscreen.tsx",
    "src/shared/basic/icons/Maximize2.tsx",
  ],
  "Modal": [
    "src/desktop/feedback/Modal.tsx",
    "src/shared/basic/icons/Close.tsx",
    "src/shared/basic/icons/ExitFullscreen.tsx",
    "src/shared/basic/icons/Maximize2.tsx",
  ],
  "Popconfirm": [
    "src/desktop/feedback/Popconfirm.tsx",
    "src/shared/basic/Button.tsx",
    "src/shared/basic/button-variants.ts",
    "src/shared/basic/icons/HelpCircle.tsx",
  ],
  "Popover": [
    "src/desktop/feedback/Popover.tsx",
  ],
  "Tooltip": [
    "src/desktop/feedback/Tooltip.tsx",
  ],
  "Cascader": [
    "src/shared/form/Cascader.tsx",
    "src/shared/basic/icons/ChevronDown.tsx",
    "src/shared/form/input-focus-ring.ts",
  ],
  "DatePicker": [
    "src/shared/form/DatePicker.tsx",
    "src/shared/form/picker-portal-utils.ts",
    "src/shared/form/picker-trigger-icon.ts",
    "src/shared/form/picker-calendar-nav.tsx",
    "src/shared/data-display/Calendar.tsx",
    "src/shared/data-display/calendar-utils.ts",
    "src/shared/basic/icons/Calendar.tsx",
    "src/shared/basic/icons/ChevronLeft.tsx",
    "src/shared/basic/icons/ChevronRight.tsx",
    "src/shared/form/input-focus-ring.ts",
  ],
  "DateTimePicker": [
    "src/shared/form/DateTimePicker.tsx",
    "src/shared/form/picker-portal-utils.ts",
    "src/shared/form/picker-trigger-icon.ts",
    "src/shared/form/picker-calendar-nav.tsx",
    "src/shared/data-display/Calendar.tsx",
    "src/shared/data-display/calendar-utils.ts",
    "src/shared/basic/icons/Calendar.tsx",
    "src/shared/basic/icons/ChevronLeft.tsx",
    "src/shared/basic/icons/ChevronRight.tsx",
    "src/shared/form/input-focus-ring.ts",
  ],
  "MultiSelect": [
    "src/shared/form/MultiSelect.tsx",
    "src/shared/basic/icons/ChevronDown.tsx",
    "src/shared/form/input-focus-ring.ts",
  ],
  "Select": [
    "src/shared/form/Select.tsx",
    "src/shared/basic/icons/ChevronDown.tsx",
    "src/shared/form/input-focus-ring.ts",
  ],
  "Transfer": [
    "src/shared/form/Transfer.tsx",
    "src/shared/form/input-focus-ring.ts",
  ],
  "TreeSelect": [
    "src/shared/form/TreeSelect.tsx",
    "src/shared/basic/icons/ChevronDown.tsx",
    "src/shared/form/input-focus-ring.ts",
  ],
  "Breadcrumb": [
    "src/desktop/navigation/Breadcrumb.tsx",
    "src/shared/basic/Link.tsx",
    "src/shared/basic/button-variants.ts",
    "src/shared/basic/icons/ChevronRight.tsx",
  ],
  "Dropdown": [
    "src/desktop/navigation/Dropdown.tsx",
  ],
  "ActionSheet": [
    "src/mobile/MobilePortalHostScope.tsx",
    "src/mobile/feedback/ActionSheet.tsx",
  ],
  "BottomSheet": [
    "src/mobile/MobilePortalHostScope.tsx",
    "src/mobile/feedback/BottomSheet.tsx",
    "src/shared/basic/icons/Close.tsx",
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
    "src/shared/layout/Container.tsx",
    "src/shared/basic/icons/ChevronLeft.tsx",
  ],
  "TabBar": [
    "src/mobile/navigation/TabBar.tsx",
  ],
  "MobilePortalHostScope": [
    "src/mobile/MobilePortalHostScope.tsx",
  ],
  "Avatar": [
    "src/shared/basic/Avatar.tsx",
  ],
  "Badge": [
    "src/shared/basic/Badge.tsx",
  ],
  /**
   * Button 与 {@link ButtonGroup} 共用源码；尺寸/变体类在 `button-variants.ts`，须一并扫描否则按需构建会丢类。
   */
  "Button": [
    "src/shared/basic/Button.tsx",
    "src/shared/basic/button-variants.ts",
  ],
  /** 与 Button 同文件导出，仅映射 Button 时按需会漏扫 ButtonGroup 内的 class */
  "ButtonGroup": [
    "src/shared/basic/Button.tsx",
    "src/shared/basic/button-variants.ts",
  ],
  "Icon": [
    "src/shared/basic/Icon.tsx",
  ],
  /**
   * 链接按钮模式与 Button 共用 `button-variants.ts` 中的 Tailwind 片段，须纳入 @source。
   */
  "Link": [
    "src/shared/basic/Link.tsx",
    "src/shared/basic/button-variants.ts",
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
    "src/shared/charts/ChartBase.tsx",
    "src/shared/charts/types.ts",
  ],
  "ChartBase": [
    "src/shared/charts/ChartBase.tsx",
    "src/shared/charts/types.ts",
  ],
  "ChartBubble": [
    "src/shared/charts/ChartBubble.tsx",
    "src/shared/charts/ChartBase.tsx",
    "src/shared/charts/types.ts",
  ],
  "ChartDoughnut": [
    "src/shared/charts/ChartDoughnut.tsx",
    "src/shared/charts/ChartBase.tsx",
    "src/shared/charts/types.ts",
  ],
  "ChartLine": [
    "src/shared/charts/ChartLine.tsx",
    "src/shared/charts/ChartBase.tsx",
    "src/shared/charts/types.ts",
  ],
  "ChartPie": [
    "src/shared/charts/ChartPie.tsx",
    "src/shared/charts/ChartBase.tsx",
    "src/shared/charts/types.ts",
  ],
  "ChartPolarArea": [
    "src/shared/charts/ChartPolarArea.tsx",
    "src/shared/charts/ChartBase.tsx",
    "src/shared/charts/types.ts",
  ],
  "ChartRadar": [
    "src/shared/charts/ChartRadar.tsx",
    "src/shared/charts/ChartBase.tsx",
    "src/shared/charts/types.ts",
  ],
  "ChartScatter": [
    "src/shared/charts/ChartScatter.tsx",
    "src/shared/charts/ChartBase.tsx",
    "src/shared/charts/types.ts",
  ],
  "ConfigProvider": [
    "src/shared/config-provider/ConfigProvider.tsx",
  ],
  "Calendar": [
    "src/shared/data-display/Calendar.tsx",
    "src/shared/data-display/calendar-utils.ts",
  ],
  "Card": [
    "src/shared/data-display/Card.tsx",
  ],
  "Carousel": [
    "src/shared/data-display/Carousel.tsx",
    "src/shared/data-display/Image.tsx",
    "src/shared/basic/icons/ChevronLeft.tsx",
    "src/shared/basic/icons/ChevronRight.tsx",
  ],
  "CodeBlock": [
    "src/shared/data-display/CodeBlock.tsx",
    "src/shared/basic/icons/Copy.tsx",
  ],
  "Collapse": [
    "src/shared/data-display/Collapse.tsx",
    "src/shared/basic/icons/ChevronDown.tsx",
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
    "src/shared/basic/icons/ChevronLeft.tsx",
    "src/shared/basic/icons/ChevronRight.tsx",
    "src/shared/basic/icons/Close.tsx",
    "src/shared/basic/icons/RotateCcw.tsx",
    "src/shared/basic/icons/RotateCw.tsx",
    "src/shared/basic/icons/ZoomIn.tsx",
    "src/shared/basic/icons/ZoomOut.tsx",
  ],
  "List": [
    "src/shared/data-display/List.tsx",
  ],
  "ScrollList": [
    "src/mobile/data-display/ScrollList.tsx",
    "src/mobile/feedback/PullRefresh.tsx",
    "src/shared/data-display/List.tsx",
    "src/shared/feedback/controlled-open.ts",
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
    "src/shared/basic/icons/ChevronRight.tsx",
  ],
  "Alert": [
    "src/shared/feedback/Alert.tsx",
    "src/shared/basic/icons/AlertCircle.tsx",
    "src/shared/basic/icons/CheckCircle.tsx",
    "src/shared/basic/icons/Info.tsx",
    "src/shared/basic/icons/XCircle.tsx",
  ],
  "Drawer": [
    "src/shared/feedback/Drawer.tsx",
    "src/shared/basic/icons/Close.tsx",
  ],
  "Notification": [
    "src/shared/feedback/Notification.tsx",
    "src/shared/basic/icons/AlertCircle.tsx",
    "src/shared/basic/icons/Bell.tsx",
    "src/shared/basic/icons/CheckCircle.tsx",
    "src/shared/basic/icons/Info.tsx",
    "src/shared/basic/icons/XCircle.tsx",
  ],
  "Progress": [
    "src/shared/feedback/Progress.tsx",
  ],
  "Result": [
    "src/shared/feedback/Result.tsx",
    "src/shared/basic/icons/AlertCircle.tsx",
    "src/shared/basic/icons/CheckCircle.tsx",
    "src/shared/basic/icons/HelpCircle.tsx",
    "src/shared/basic/icons/Info.tsx",
    "src/shared/basic/icons/ShieldAlert.tsx",
    "src/shared/basic/icons/XCircle.tsx",
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
    "src/shared/basic/icons/AlertCircle.tsx",
    "src/shared/basic/icons/CheckCircle.tsx",
    "src/shared/basic/icons/Info.tsx",
    "src/shared/basic/icons/XCircle.tsx",
  ],
  "NotificationContainer": [
    "src/shared/feedback/Notification.tsx",
    "src/shared/basic/icons/AlertCircle.tsx",
    "src/shared/basic/icons/Bell.tsx",
    "src/shared/basic/icons/CheckCircle.tsx",
    "src/shared/basic/icons/Info.tsx",
    "src/shared/basic/icons/XCircle.tsx",
  ],
  "AutoComplete": [
    "src/shared/form/AutoComplete.tsx",
  ],
  "Checkbox": [
    "src/shared/form/Checkbox.tsx",
    "src/shared/form/input-focus-ring.ts",
  ],
  "CheckboxGroup": [
    "src/shared/form/CheckboxGroup.tsx",
    "src/shared/form/Checkbox.tsx",
    "src/shared/form/input-focus-ring.ts",
  ],
  "ColorPicker": [
    "src/shared/form/ColorPicker.tsx",
    "src/shared/form/input-focus-ring.ts",
    "src/shared/basic/icons/Palette.tsx",
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
    "src/shared/form/input-focus-ring.ts",
  ],
  "InputNumber": [
    "src/shared/form/InputNumber.tsx",
    "src/shared/form/input-focus-ring.ts",
  ],
  "Mentions": [
    "src/shared/form/Mentions.tsx",
    "src/shared/form/input-focus-ring.ts",
  ],
  /** 工具栏与 RichTextEditor 同款样式类 + Tooltip；运行时依赖 `jsr:@dreamer/markdown` */
  "MarkdownEditor": [
    "src/shared/form/MarkdownEditor.tsx",
    "src/desktop/feedback/Tooltip.tsx",
    "src/shared/form/input-focus-ring.ts",
  ],
  "Password": [
    "src/shared/form/Password.tsx",
    "src/shared/form/input-focus-ring.ts",
  ],
  "Radio": [
    "src/shared/form/Radio.tsx",
    "src/shared/form/input-focus-ring.ts",
  ],
  "RadioGroup": [
    "src/shared/form/RadioGroup.tsx",
    "src/shared/form/Radio.tsx",
    "src/shared/form/input-focus-ring.ts",
  ],
  "Rate": [
    "src/shared/form/Rate.tsx",
  ],
  "RichTextEditor": [
    "src/shared/form/RichTextEditor.tsx",
    "src/shared/form/picker-portal-utils.ts",
    "src/shared/form/input-focus-ring.ts",
    "src/desktop/feedback/Modal.tsx",
    "src/shared/basic/icons/Close.tsx",
    "src/shared/basic/icons/ExitFullscreen.tsx",
    "src/shared/basic/icons/Maximize2.tsx",
    "src/shared/basic/Button.tsx",
    "src/shared/basic/button-variants.ts",
    "src/shared/basic/icons/Type.tsx",
    "src/shared/form/Input.tsx",
  ],
  "Search": [
    "src/shared/form/Search.tsx",
    "src/shared/form/input-focus-ring.ts",
    "src/shared/basic/icons/Search.tsx",
  ],
  "Slider": [
    "src/shared/form/Slider.tsx",
  ],
  "Switch": [
    "src/shared/form/Switch.tsx",
    "src/shared/form/input-focus-ring.ts",
  ],
  "Textarea": [
    "src/shared/form/Textarea.tsx",
    "src/shared/form/input-focus-ring.ts",
  ],
  "TimePicker": [
    "src/shared/form/TimePicker.tsx",
    "src/shared/form/picker-portal-utils.ts",
    "src/shared/form/picker-trigger-icon.ts",
    "src/shared/basic/icons/Clock.tsx",
    "src/shared/form/input-focus-ring.ts",
  ],
  "Upload": [
    "src/shared/form/Upload.tsx",
    "src/shared/form/chunked-upload.ts",
    "src/shared/form/upload-http.ts",
    "src/shared/basic/Icon.tsx",
    "src/shared/basic/icons/Upload.tsx",
  ],
  "Accordion": [
    "src/shared/layout/Accordion.tsx",
    "src/shared/basic/icons/ChevronDown.tsx",
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
    "src/shared/basic/icons/ChevronUp.tsx",
  ],
  "Menu": [
    "src/shared/navigation/Menu.tsx",
    "src/shared/basic/icons/ChevronRight.tsx",
  ],
  "PageHeader": [
    "src/shared/navigation/PageHeader.tsx",
    "src/shared/basic/icons/ArrowLeft.tsx",
  ],
  "Pagination": [
    "src/shared/navigation/Pagination.tsx",
    "src/shared/basic/icons/ChevronLeft.tsx",
    "src/shared/basic/icons/ChevronRight.tsx",
  ],
  "Sidebar": [
    "src/shared/navigation/Sidebar.tsx",
    "src/shared/basic/Link.tsx",
    "src/shared/basic/button-variants.ts",
    "src/shared/basic/icons/ChevronDown.tsx",
    "src/shared/basic/icons/ChevronRight.tsx",
  ],
  "Steps": [
    "src/shared/navigation/Steps.tsx",
    "src/shared/basic/icons/Check.tsx",
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
 * 将异常转为可读的纯文本，便于日志里出现「message + stack」，避免宿主只 `JSON.stringify(error)` 得到 `{}`。
 *
 * @param e - 任意 throw 值
 * @returns 多行字符串，含 `Error.message` 与 `stack`（若有）
 */
function formatPluginError(e: unknown): string {
  if (e instanceof Error) {
    return e.stack ?? `${e.name}: ${e.message}`;
  }
  if (e !== null && typeof e === "object") {
    try {
      return JSON.stringify(e);
    } catch {
      return Object.prototype.toString.call(e);
    }
  }
  return String(e);
}

/** 宿主注入的 logger 形态（可能含 error，用于与 dweb 对齐） */
type UiViewTailwindLogger = {
  info: (msg: string) => void;
  debug: (msg: string) => void;
  error?: (msg: string, ...args: unknown[]) => void;
};

/**
 * 统一本插件在 onInit 中的日志出口。
 * - **info**：同时写 `logger.info` 与 `console.info`，便于 JSR 发布后下游项目在 CI 中仍能看到关键路径（不依赖宿主是否转发 debug）。
 * - **debug**：优先 `logger.debug`；无 logger 时用 `console.debug`。
 *
 * @param logger - dweb 等服务容器中的 logger，可为 undefined
 * @returns 带 `info` / `debug` 的轻量对象
 */
function createUiViewTailwindPluginLog(
  logger: UiViewTailwindLogger | undefined,
): { info: (msg: string) => void; debug: (msg: string) => void } {
  const tag = "[ui-view-tailwind]";
  return {
    info(msg: string): void {
      const line = `${tag} ${msg}`;
      if (logger) logger.info(line);
      console.info(line);
    },
    debug(msg: string): void {
      const line = `${tag} ${msg}`;
      if (logger) logger.debug(line);
      else console.debug(line);
    },
  };
}

/**
 * 将字符串截断到最大长度，避免单条日志过长被宿主截断。
 *
 * @param s - 原文
 * @param max - 最大字符数（含省略号占位）
 * @returns 截断后的字符串
 */
function truncateForLog(s: string, max: number): string {
  if (s.length <= max) return s;
  if (max <= 3) return s.slice(0, max);
  return `${s.slice(0, max - 3)}...`;
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

  /**
   * 解析 @dreamer/ui-view 包根：本地 file → cwd 向上找仓库 → `node_modules/@jsr/dreamer__ui-view`（JSR 安装树）。
   *
   * @param trace - 每步决策的说明（供发布/CI 排障）
   */
  const resolvePackageRoot = (trace: (msg: string) => void): string => {
    const root = cwd();
    trace(
      `resolvePackageRoot: 开始，cwd=${root}，已配置 packageRoot=${
        optionPackageRoot ?? "(无)"
      }`,
    );
    trace(`resolvePackageRoot: import.meta.url=${import.meta.url}`);

    if (optionPackageRoot) {
      const resolved = optionPackageRoot.startsWith("/")
        ? optionPackageRoot
        : join(root, optionPackageRoot);
      trace(`resolvePackageRoot: 使用选项 packageRoot → ${resolved}`);
      return resolved;
    }
    /** 本地 file 映射 / 工作区：`import.meta.url` 为 file:// */
    const fromFileDir = dirnameOfThisPluginIfFileUrl();
    trace(
      `resolvePackageRoot: dirnameOfThisPluginIfFileUrl → ${
        fromFileDir ?? "(undefined，多为 JSR https 加载)"
      }`,
    );
    if (fromFileDir != null) {
      const like = looksLikeUiViewSourceRoot(fromFileDir);
      trace(
        `resolvePackageRoot: looksLikeUiViewSourceRoot(${fromFileDir})=${like}（需含 plugin.ts、${PACKAGE_ROOT_MARKER}、src/shared/basic/Icon.tsx）`,
      );
    }
    if (fromFileDir != null && looksLikeUiViewSourceRoot(fromFileDir)) {
      trace(
        `resolvePackageRoot: 采用 file URL 插件目录作为包根 → ${fromFileDir}`,
      );
      return fromFileDir;
    }
    /** 在 ui-view 仓库内跑 docs：cwd 向上能碰到 plugin.ts + src/mod.ts */
    const fromCwd = findUiViewPackageRootFromCwd();
    trace(
      `resolvePackageRoot: findUiViewPackageRootFromCwd → ${fromCwd ?? "null"}`,
    );
    if (fromCwd != null) {
      trace(`resolvePackageRoot: 采用 cwd 向上查找的包根 → ${fromCwd}`);
      return fromCwd;
    }
    /** 从 JSR 拉包且 `nodeModulesDir: auto`：完整源码树常在 node_modules/@jsr/dreamer__ui-view */
    const nmCandidates = [
      join(root, "node_modules", "@jsr", "dreamer__ui-view"),
      join(root, "node_modules", "@dreamer", "ui-view"),
    ];
    trace(
      `resolvePackageRoot: node_modules 候选存在性: ${
        nmCandidates.map((p) =>
          `${p}(${
            existsSync(join(p, PACKAGE_ROOT_MARKER)) ? "有标记" : "无标记"
          })`
        ).join(" | ")
      }`,
    );
    const fromNm = tryResolveUiViewPackageRootFromNodeModules();
    trace(
      `resolvePackageRoot: tryResolveUiViewPackageRootFromNodeModules → ${
        fromNm ?? "null"
      }`,
    );
    if (fromNm != null) {
      trace(`resolvePackageRoot: 采用 node_modules 包根 → ${fromNm}`);
      return fromNm;
    }
    if (fromFileDir != null) {
      trace(
        `resolvePackageRoot: 回退采用 fromFileDir（可能非完整源码树）→ ${fromFileDir}`,
      );
      return fromFileDir;
    }
    trace(
      `resolvePackageRoot: 失败汇总 — 无显式 packageRoot；file 目录不可用或不像包根；cwd 树未找到；node_modules 无 dreamer__ui-view/ui-view`,
    );
    throw new Error(
      `[ui-view-tailwind] 无法解析 @dreamer/ui-view 包根（cwd=${root}）。请设置 packageRoot，或对 imports 使用本地路径映射（如 "@dreamer/ui-view/plugin": "../ui-view/plugin.ts"），或确保已安装依赖使 node_modules/@jsr/dreamer__ui-view 存在。import.meta.url=${import.meta.url}`,
    );
  };

  return {
    name: "ui-view-tailwind",
    version: "0.1.0",

    async onInit(container: ServiceContainer): Promise<void> {
      const logger = container.tryGet<UiViewTailwindLogger>("logger");
      const log = createUiViewTailwindPluginLog(logger);

      /**
       * 输出本插件内的失败详情：优先 `logger.error`（若存在），否则 `info`，并始终 `console.error` 可读文本，避免只看到 `{}`。
       *
       * @param phase - 阶段说明
       * @param e - 异常对象
       * @param ctx - 额外上下文（cwd、路径等）
       */
      const logInitFailure = (
        phase: string,
        e: unknown,
        ctx?: Record<string, string>,
      ): void => {
        const ctxLines = ctx
          ? Object.entries(ctx).map(([k, v]) => `${k}=${v}`).join("\n")
          : "";
        const text = `[ui-view-tailwind] ${phase}${
          ctxLines ? `\n上下文:\n${ctxLines}` : ""
        }\n${formatPluginError(e)}`;
        if (logger?.error) {
          logger.error(text);
        } else if (logger) {
          logger.info(text);
        }
        console.error(text);
      };

      const root = cwd();
      const scanDirAbs = join(root, scanPath);

      try {
        log.info(
          `onInit 开始: cwd=${root}，scanPath=${scanPath}（绝对路径=${scanDirAbs}），outputPath=${outputPath}，显式 packageRoot=${
            optionPackageRoot ?? "(未传)"
          }，logger=${logger ? "已注入" : "无"}`,
        );
        log.debug(
          `onInit: import.meta.url=${import.meta.url}，插件 name=${"ui-view-tailwind"}`,
        );

        const files: string[] = [];
        try {
          await collectTsTsx(scanDirAbs, scanDirAbs, files);
        } catch (e) {
          log.info(
            `扫描目录失败，跳过生成（不会抛错）。scanDir=${scanDirAbs}\n${
              formatPluginError(e)
            }`,
          );
          return;
        }

        log.info(`扫描到 .ts/.tsx 文件数量: ${files.length}`);
        if (files.length > 0) {
          const sample = files.slice(0, 12).map((p) => relative(root, p)).join(
            ", ",
          );
          log.debug(
            `扫描文件示例（相对 cwd，最多 12 条）: ${sample}${
              files.length > 12 ? ", …" : ""
            }`,
          );
        }

        const usedNames = new Set<string>();
        let readFailCount = 0;
        for (const filePath of files) {
          try {
            const content = await readTextFile(filePath);
            for (const name of extractUsedNames(content)) {
              usedNames.add(name);
            }
          } catch (readErr) {
            readFailCount++;
            log.debug(
              `读取失败（已忽略）: ${relative(root, filePath)} → ${
                formatPluginError(readErr)
              }`,
            );
          }
        }
        if (readFailCount > 0) {
          log.info(
            `解析导入时共有 ${readFailCount} 个文件读取失败（已忽略），详见上方 debug`,
          );
        }

        const names = Array.from(usedNames).sort();
        if (names.length === 0) {
          log.info(
            `未发现从 @dreamer/ui-view 解析出的已映射组件名，跳过生成（请确认业务代码使用 import { X } from "@dreamer/ui-view/..." 且 X 在插件映射表中）`,
          );
          return;
        }

        const namesPreview = truncateForLog(names.join(", "), 400);
        log.info(
          `解析到可能来自 ui-view 的导出名 ${names.length} 个（排序后预览）: ${namesPreview}`,
        );

        const pkgRoot = resolvePackageRoot((m) => log.info(m));
        log.info(`最终 packageRoot（@source 绝对路径前缀）: ${pkgRoot}`);

        const paths = getContentPaths(names, pkgRoot);
        log.info(
          `getContentPaths 展开后路径条数（去重前）: ${paths.length}`,
        );
        await mergeIntrinsicIconSources(names, pkgRoot, paths);
        /** 与 getContentPaths / mergeIntrinsicIconSources 内去重双保险，保证写入的 @source 路径唯一 */
        const uniqueSortedPaths = Array.from(new Set(paths)).sort();
        log.info(
          `mergeIntrinsicIconSources 后唯一 @source 目标文件数: ${uniqueSortedPaths.length}`,
        );

        const outAbs = outputPath.startsWith("/")
          ? outputPath
          : join(root, outputPath);
        const sourcesCssDir = dirname(outAbs);
        const specifiers = uniqueSortedPaths.map((p) =>
          toAtSourceSpecifier(sourcesCssDir, p)
        );
        const previewLines = uniqueSortedPaths.slice(0, 8).map((abs, i) =>
          `@source "${specifiers[i]}"  /* ${relative(pkgRoot, abs)} */`
        );
        log.debug(
          `@source 写入预览（前 8 条，相对生成 CSS 目录）:\n${
            previewLines.join("\n")
          }`,
        );

        const cssContent = uniqueSortedPaths
          .map((p) => `@source "${toAtSourceSpecifier(sourcesCssDir, p)}";`)
          .join("\n") + "\n";

        log.info(
          `准备写入: outAbs=${outAbs}，sourcesCssDir=${sourcesCssDir}，CSS 约 ${cssContent.length} 字节`,
        );
        await mkdir(sourcesCssDir, { recursive: true });
        await writeTextFile(outAbs, cssContent);

        log.info(
          `onInit 成功: 已写入 ${outAbs}（业务 tailwind 入口应 @import 的相对路径建议: ${
            relative(root, outAbs)
          }）`,
        );
      } catch (e) {
        logInitFailure("onInit 失败", e, {
          cwd: root,
          scanDirAbs,
          outputPath,
          scanPath,
          packageRootOption: optionPackageRoot ?? "(未传)",
          importMetaUrl: import.meta.url,
        });
        throw e;
      }
    },
  };
}
