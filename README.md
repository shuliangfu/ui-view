# @dreamer/ui-view

基于 View 与 Tailwind CSS 的 UI
组件库，支持浅色/深色主题，桌面端与移动端兼备，适用于企业级应用、管理平台等场景。

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)

---

## 安装

```bash
# Deno
deno add jsr:@dreamer/ui-view

# Bun
bunx jsr add @dreamer/ui-view
```

---

## 入口

| 入口                      | 说明                                     |
| ------------------------- | ---------------------------------------- |
| `@dreamer/ui-view`        | 桌面端组件（默认）                       |
| `@dreamer/ui-view/mobile` | 移动端组件                               |
| `@dreamer/ui-view/shared` | 仅共享类型与设计 token（一般不单独引用） |

桌面端入口已包含所有 shared 组件 + 桌面专用组件；移动端入口为 shared +
移动专用组件。

---

## 与 Tailwind 配合使用

本库组件使用 Tailwind 工具类书写样式。发布到 JSR 后，用户项目的 Tailwind
默认不会扫描依赖包里的 class，若不配置，组件样式会被 purge 掉。

同时有一个**体积问题**：若把本库**整包源码**加入 Tailwind
的扫描范围，构建时会保留**所有组件**用到的 class，即使用户只用了其中一个
Button，最终 CSS 也会很大。

推荐三种方式，按需选择：

---

### 方案一：按需引入组件样式（CSS 小）

本库为部分组件提供**单独打包好的
CSS**，只引入你用到的组件样式，最终只包含该组件用到的 class。

```css
/* 你的主 CSS 入口，只引入用到的组件 */
@import "tailwindcss";
@source "./src/**/*.{ts,tsx}";

/* 只引入 Button 的样式，不会带上 Modal、Table 等未用组件的 class */
@import "@dreamer/ui-view/styles/button.css";
```

```ts
import { Button } from "@dreamer/ui-view";
```

可用样式入口见下方「按需样式入口」表。未列出的组件暂用方案二。

| 样式入口                                | 说明             |
| --------------------------------------- | ---------------- |
| `@dreamer/ui-view/styles/button.css`    | Button 按钮      |
| `@dreamer/ui-view/styles/link.css`      | Link 链接        |
| `@dreamer/ui-view/styles/input.css`     | Input 输入框     |
| `@dreamer/ui-view/styles/modal.css`     | Modal 模态框     |
| `@dreamer/ui-view/styles/card.css`      | Card 卡片        |
| `@dreamer/ui-view/styles/alert.css`     | Alert 提示条     |
| `@dreamer/ui-view/styles/tabs.css`      | Tabs 标签页      |
| `@dreamer/ui-view/styles/accordion.css` | Accordion 手风琴 |

---

### 方案二：扫描本库源码（简单，但 CSS 会偏大）

把本库整包源码加入 Tailwind 的扫描范围，适合**用了很多组件**、能接受较大 CSS
体积的项目。

**Tailwind v4**（主 CSS 里增加）：

```css
@import "tailwindcss";
@source "./src/**/*.{ts,tsx}";
@source "./node_modules/@dreamer/ui-view/src/**/*.{ts,tsx}";
```

**Tailwind v3**（`tailwind.config.js` 的 `content`）：

```js
content: [
  "./src/**/*.{ts,tsx}",
  "./node_modules/@dreamer/ui-view/src/**/*.{ts,tsx}",
],
```

若通过 Deno 安装且依赖不在 `node_modules`，请将上述路径改为你本地解析到的
`@dreamer/ui-view` 实际路径。

---

### 方案三：插件自动收集 class 并生成 @source 文件（推荐，体积最小）

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
  outputPath: "src/generated/ui-view-sources.css", // 生成的文件路径
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
@import "../generated/ui-view-sources.css"; /* 由插件生成，仅含 @source "path"; */
@source "./src/**/*.{ts,tsx}"; /* 你项目自己的源码 */

@import "tailwindcss";
```

插件在 onInit 时扫描 `scanPath` 下所有 `.ts`/`.tsx` 中从 `@dreamer/ui-view`（或
`jsr:@dreamer/ui-view`）的命名导入，收集组件名，生成只含 `@source "path";` 的
CSS；Tailwind 编译时只会扫描这些路径，最终 CSS 只包含用到的 class，且 theme
只出现一次。

---

## 组件一览

### 基础

- **Button** 按钮
- **Link** 文字/图标链接
- **Icon** 图标容器
- **Typography** 排版：Title、Paragraph、Text
- **Badge** 角标、数字徽章
- **Avatar** 头像
- **Skeleton** 骨架屏
- **Spinner** 加载旋转
- **Icons** 图标集（如 ChevronDown、Close、Calendar 等）

### 表单

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
Select、MultiSelect、Cascader、TreeSelect、DatePicker、DateRangePicker

### 消息与通知

- **Toast** 轻提示（ToastContainer + toast）
- **Message** 全局提示（message）
- **Notification** 消息通知框（NotificationContainer + openNotification 等）

### 反馈与浮层

- **Alert** 静态提示条
- **Drawer** 侧边抽屉
- **Progress** 进度条
- **Result** 结果页

**桌面专用：** Modal、Dialog、Tooltip、Popover、Popconfirm

**移动专用：** BottomSheet、ActionSheet、PullRefresh、SwipeCell

### 布局与容器

- **Container** 最大宽度容器
- **Hero** 英雄区/首屏
- **Grid / GridItem** 栅格
- **Stack** 垂直/水平堆叠
- **Divider** 分割线
- **Tabs** 标签页
- **Accordion** 手风琴折叠

### 导航

- **Navbar** 顶栏
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

### 数据展示

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

### 图表

基于
Chart.js：ChartLine、ChartBar、ChartPie、ChartDoughnut、ChartRadar、ChartPolarArea、ChartBubble、ChartScatter

### 其它

- **ConfigProvider** 全局配置（主题、locale 等）

---

## License

Apache-2.0. See [LICENSE](./LICENSE).
