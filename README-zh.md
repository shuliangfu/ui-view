# 📦 @dreamer/ui-view

基于 View 与 Tailwind CSS 的 UI
组件库，支持浅色/深色主题，桌面端与移动端兼备，适用于企业级应用、管理平台等场景。

**English:** [README.md](./README.md)

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)

---

## ⬇️ 安装

```bash
# Deno
deno add jsr:@dreamer/ui-view

# Bun
bunx jsr add @dreamer/ui-view
```

---

## 📂 入口

| 入口                      | 说明                                                     |
| ------------------------- | -------------------------------------------------------- |
| `@dreamer/ui-view`        | 桌面端组件（默认）                                       |
| `@dreamer/ui-view/mobile` | 移动端组件                                               |
| `@dreamer/ui-view/shared` | 共享组件与类型（主入口与 mobile 已包含，可按需单独引用） |

桌面端入口已包含所有 shared 组件 + 桌面专用组件；移动端入口为 shared +
移动专用组件。

---

## 与 Tailwind 配合使用

本库组件使用 Tailwind 工具类书写样式。发布为 JSR 包后，用户项目中的 Tailwind
默认不会扫描依赖包内的 class，若不配置，这些 class 不会被包含进最终
CSS，组件样式会缺失。

同时有一个**体积问题**：若把本库**整包源码**加入 Tailwind
的扫描范围，构建时会保留**所有组件**用到的 class，即使用户只用了其中一个
Button，最终 CSS 也会很大。

**推荐使用本库提供的插件**自动收集用到的组件 class 并生成 @source
文件，体积最小。

### 🔌 使用插件处理样式

在项目里**注册本库提供的插件**，应用初始化（onInit）时自动扫描对
`@dreamer/ui-view` 的引用，把用到的组件的源码路径写入一个 CSS 文件；主 Tailwind
入口里 `@import` 该文件即可。一次构建、**单份 CSS**、无 theme 重复，体积最小。

**1. 在应用入口中先注册插件（务必在 tailwindPlugin 之前）：**

```ts
import { App } from "@dreamer/dweb";
import { uiViewTailwindContentPlugin } from "@dreamer/ui-view/plugin";
import { tailwindPlugin } from "@dreamer/plugins/tailwindcss";

const app = new App();

app.registerPlugin(uiViewTailwindContentPlugin({
  outputPath: "src/assets/ui-view-sources.css", // 生成的文件路径
  scanPath: "src", // 要扫描的源码目录
  // packageRoot 可选，不传则用插件所在包根（如 node_modules/@dreamer/ui-view）
}));

app.registerPlugin(tailwindPlugin({
  output: "dist/client/assets",
  cssEntry: "src/assets/tailwind.css",
  assetsPath: "/assets",
}));

app.start();
```

**2. 在主 Tailwind 入口 CSS 中引用生成的文件：**

```css
@import "./ui-view-sources.css"; /* 由插件生成，仅含 @source "path";，路径需相对当前 CSS 文件 */
@source "./src/**/*.{ts,tsx}"; /* 你项目自己的源码，路径按项目调整 */

@import "tailwindcss";
```

若 Tailwind 入口文件或项目源码目录与示例不同，请相应调整 `@import` 与 `@source`
的路径。

插件在 onInit 时扫描 `scanPath` 下所有 `.ts`/`.tsx` 中从 `@dreamer/ui-view`（或
`jsr:@dreamer/ui-view`）的命名导入，收集组件名，生成只含 `@source "path";` 的
CSS；Tailwind 编译时只会扫描这些路径，最终 CSS 只包含用到的 class，且 theme
只出现一次。

---

## dweb + View：让依赖包里的 `.tsx` 走 `compileSource`

默认情况下，**dweb** 只对应用 **`src/`** 下的 `.tsx` 跑 `@dreamer/view` 的
**`compileSource`（jsx-compiler）**。从 **JSR / workspace** 引入的
`@dreamer/ui-view` 等往往在 **`src` 之外**，esbuild 拉到的仍是 **jsx-runtime →
VNode** 路径（与原生 `checked={getter}`
等限制一致，除非写成布尔值或为这些目录打开编译）。

在支持该能力的 **@dreamer/dweb** 中，于配置里设置 **`render.compiler`**：
写入要让 **jsx-compiler 参与处理**的依赖包**源码根目录**（例如
`@dreamer/ui-view` 的 `src`，路径可为相对 **cwd()** 的字符串或绝对路径）。

**这不是「把目录下所有 `.tsx` 全编译进产物」**：esbuild 仍按
**从客户端入口可达的 import 图**
拉取模块；只有**实际被引用到**（含传递依赖）的文件才会被加载，此时若路径落在上述根目录下，才会对该文件执行
`compileSource`。未出现在依赖图里的组件源码一般不会进
bundle，也就不会被编译。若使用**大包一层再全量 re-export** 的
barrel，可能把更多子模块拉进图里，与平常 tree-shaking 行为一致。

```ts
// config/main.ts（Deno）
import type { AppConfig } from "@dreamer/dweb/types";

export default {
  render: {
    engine: "view",
    mode: "hybrid",
    // ui-view（或其它依赖）的源码根，相对进程 cwd()；请改成你项目下的真实路径
    compiler: ["./to/path"],
  },
} satisfies AppConfig;
```

框架会把该配置用于 **客户端 bundle**、**生产构建的客户端插件**，以及 **SSR
单文件路由 bundle**（`loadViewRouteModuleViaSsrBundle`）。

**注意：** 相对路径以**启动应用时的 cwd()** 为基准；须指向依赖包真正的
`src`（或等价根目录），否则插件不会对其中 `.tsx` 做 `compileSource`。

---

## 📋 组件一览

### 🧱 基础

- **Button** 按钮
- **Link** 文字/图标链接
- **Icon** 图标容器
- **Typography** 排版：Title、Paragraph、Text
- **Badge** 角标、数字徽章
- **Avatar** 头像
- **Skeleton** 骨架屏
- **Spinner** 加载旋转
- **Icons** 图标集（如 ChevronDown、Close、Calendar 等）

### 📝 表单

- **Input** 单行输入
- **Search** 搜索框
- **Password** 密码输入
- **Textarea** 多行输入
- **InputNumber** 数字输入
- **AutoComplete** 自动完成
- **Checkbox / CheckboxGroup** 勾选 / 勾选组
- **Radio / RadioGroup** 单选 / 单选组
- **Switch** 开关
- **Slider** 滑块
- **Rate** 评分
- **TimePicker / TimeRangePicker** 时间 / 时间范围选择
- **Upload** 文件上传
- **ColorPicker** 颜色选择
- **Mentions** @ 提及
- **Form / FormItem / FormList** 表单容器与表单项
- **RichTextEditor** 富文本编辑器

**桌面专用：**
Select、MultiSelect、Cascader、TreeSelect、DatePicker、DateRangePicker、TimePicker

### 💬 消息与通知

- **Toast** 轻提示（ToastContainer + toast）
- **Message** 全局提示（message）
- **Notification** 消息通知框（NotificationContainer + notification.open /
  openNotification）

### 💡 反馈与浮层

- **Alert** 静态提示条
- **Drawer** 侧边抽屉
- **Progress** 进度条
- **Result** 结果页

**桌面专用：** Modal、Dialog、Tooltip、Popover、Popconfirm

**移动专用：** BottomSheet、ActionSheet、PullRefresh、SwipeCell

### 📐 布局与容器

- **Container** 最大宽度容器
- **Hero** 英雄区/首屏
- **Grid / GridItem** 栅格
- **Stack** 垂直/水平堆叠
- **Divider** 分割线
- **Tabs** 标签页
- **Accordion** 手风琴折叠

### 🧭 导航

- **NavBar** 顶栏
- **Sidebar** 侧栏折叠菜单
- **Pagination** 分页
- **Menu** 菜单列表
- **Steps** 步骤条
- **PageHeader** 页头
- **Affix** 固钉
- **Anchor** 锚点
- **BackTop** 回到顶部

**桌面专用：** Dropdown、Breadcrumb

**移动专用：** TabBar、NavBar

### 📊 数据展示

- **Tag** 标签
- **Empty** 空状态
- **Statistic** 统计数值
- **Segmented** 分段控制器
- **Descriptions** 描述列表
- **Card** 卡片
- **List** 列表
- **Image** 图片
- **ImageViewer** 图片查看器（多图切换、缩放、旋转、缩略图、键盘）
- **Timeline** 时间轴
- **Collapse** 折叠面板
- **Carousel** 轮播图
- **Tree** 树形
- **Transfer** 穿梭框
- **Calendar** 日历
- **Comment** 评论
- **CodeBlock** 代码块

**桌面专用：** Table

### 📈 图表

基于
Chart.js：ChartLine、ChartBar、ChartPie、ChartDoughnut、ChartRadar、ChartPolarArea、ChartBubble、ChartScatter

### ⚙️ 其它

- **ConfigProvider** 全局配置（主题、locale 等）

---

## 📄 License

Apache-2.0. See [LICENSE](./LICENSE).
