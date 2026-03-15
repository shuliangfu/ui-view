# @dreamer/ui-view

基于 View 与 Tailwind CSS 的 UI 组件库，支持浅色/深色主题，桌面端与移动端兼备，适用于企业级应用、管理平台等场景。

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

| 入口 | 说明 |
|------|------|
| `@dreamer/ui-view` | 桌面端组件（默认） |
| `@dreamer/ui-view/mobile` | 移动端组件 |
| `@dreamer/ui-view/shared` | 仅共享类型与设计 token（一般不单独引用） |

桌面端入口已包含所有 shared 组件 + 桌面专用组件；移动端入口为 shared + 移动专用组件。

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

**桌面专用：** Select、MultiSelect、Cascader、TreeSelect、DatePicker、DateRangePicker

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

基于 Chart.js：ChartLine、ChartBar、ChartPie、ChartDoughnut、ChartRadar、ChartPolarArea、ChartBubble、ChartScatter

### 其它

- **ConfigProvider** 全局配置（主题、locale 等）

---

## License

Apache-2.0. See [LICENSE](./LICENSE).
