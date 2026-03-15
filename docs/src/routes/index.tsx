/**
 * 首页：@dreamer/ui-view 官方介绍与入口。
 * 使用库内组件：Hero、Container、Card、Grid、Link、Title、Paragraph、Text、IconBrandGithub、CodeBlock。
 * 路由: /
 */

import {
  Card,
  CodeBlock,
  Container,
  Grid,
  GridItem,
  Hero,
  IconBrandGithub,
  Link,
  Paragraph,
  Text,
  Title,
} from "@dreamer/ui-view";

/** Hero 区渐变背景节点（供 Hero 的 background 使用） */
function HeroBackground() {
  return (
    <div
      class="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(20,184,166,0.15),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(20,184,166,0.12),transparent)]"
      aria-hidden
    />
  );
}

const FEATURES = [
  {
    title: "桌面与移动分离",
    desc:
      "默认入口为桌面组件，/mobile 子路径导出移动端专用组件，API 与语义对齐，按端选用。",
    icon: "🖥️",
  },
  {
    title: "统一设计令牌",
    desc:
      "SizeVariant、ColorVariant、间距与圆角等 token 在 shared 中定义，多端视觉一致。",
    icon: "🎨",
  },
  {
    title: "Tailwind v4 + 深浅主题",
    desc:
      "基于 Tailwind CSS v4 工具类，亮色/暗色主题开箱即用，通过 .dark 或 ConfigProvider 切换。",
    icon: "🌓",
  },
  {
    title: "View 细粒度渲染",
    desc:
      "与 @dreamer/view 协同，支持细粒度更新，表单控件可配合 getter 避免整块重渲染与失焦。",
    icon: "⚡",
  },
  {
    title: "TypeScript 优先",
    desc:
      "完整类型定义与 JSR 发布，Deno / Bun 均可通过 jsr:@dreamer/ui-view 直接引用。",
    icon: "📦",
  },
  {
    title: "丰富组件分类",
    desc:
      "基础、表单、反馈、布局、导航、数据展示、图表等，与 ANALYSIS 规划一致，持续完善。",
    icon: "🧩",
  },
];

export default function Home() {
  return (
    <div class="relative overflow-hidden">
      {/* Hero：使用 Hero 组件，extra 为 CTA 链接区 */}
      <Hero
        class="relative py-20 sm:py-28 lg:py-36"
        title={
          <span class="rounded-lg bg-teal-500 px-3 py-1 text-white dark:bg-teal-600 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
            ui-view
          </span>
        }
        subtitle={
          <span class="text-sm font-medium uppercase tracking-widest text-teal-600 dark:text-teal-400">
            Dreamer 生态 · View 框架 UI
          </span>
        }
        description="基于 View 前端框架的 UI 组件库，桌面与移动双端、统一设计令牌，Tailwind v4 与深浅主题开箱即用。"
        contentClass="max-w-2xl mx-auto text-center"
        background={<HeroBackground />}
        extra={
          <div class="flex w-full flex-wrap items-center justify-center gap-4">
            <Link
              href="/desktop"
              className="inline-flex items-center justify-center rounded-xl bg-teal-500 px-6 py-3.5 text-base font-semibold text-white dark:text-white shadow-lg shadow-teal-500/25 hover:bg-teal-600 hover:text-white dark:bg-teal-600 dark:shadow-teal-600/20 dark:hover:bg-teal-500 dark:hover:text-white transition-all duration-200"
            >
              桌面版文档
            </Link>
            <Link
              href="/mobile"
              className="inline-flex items-center justify-center rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-6 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-200 hover:border-teal-400 hover:bg-slate-50 dark:hover:bg-slate-700 dark:hover:border-teal-500 transition-all duration-200"
            >
              移动版文档
            </Link>
            <Link
              href="https://github.com/shuliangfu/ui-view"
              target="_blank"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-5 py-3 text-base font-medium text-slate-600 dark:text-slate-400 hover:border-slate-400 hover:text-slate-900 dark:hover:border-slate-500 dark:hover:text-slate-100 transition-colors"
            >
              <IconBrandGithub class="w-5 h-5" />
              GitHub
            </Link>
          </div>
        }
      />

      {/* 特性：Container + Title + Grid + Card */}
      <section class="py-16 sm:py-20 border-t border-slate-200/80 dark:border-slate-700/80">
        <Container maxWidth="lg" class="max-w-5xl">
          <Title
            level={2}
            class="text-center mb-12 text-slate-900 dark:text-white"
          >
            为什么选择 ui-view
          </Title>
          <Grid cols={12} gap={6}>
            {FEATURES.map((item) => {
              return (
                <GridItem
                  key={item.title}
                  span={12}
                  class="sm:col-span-6 lg:col-span-4"
                >
                  {/* 外层包裹：强制深色模式下边框可见，避免与 Card 内部样式冲突 */}
                  <div class="rounded-2xl border-2 border-slate-200 dark:border-slate-500 bg-white dark:bg-slate-800 shadow-md hover:shadow-lg hover:border-teal-300 dark:hover:border-teal-500 transition-all duration-200 min-h-[180px]">
                    <Card
                      hoverable={false}
                      bordered={false}
                      class="rounded-2xl bg-transparent dark:bg-transparent shadow-none h-full"
                      bodyClass="p-6"
                    >
                      <span class="text-2xl mb-3 block" aria-hidden>
                        {item.icon}
                      </span>
                      <Title
                        level={4}
                        class="mb-2 text-slate-900 dark:text-white wrap-break-word"
                      >
                        {item.title}
                      </Title>
                      <Paragraph class="text-sm text-slate-600 dark:text-slate-400 wrap-break-word leading-relaxed">
                        {item.desc}
                      </Paragraph>
                    </Card>
                  </div>
                </GridItem>
              );
            })}
          </Grid>
        </Container>
      </section>

      {/* 快速开始：Container + Title + Paragraph + 代码块 */}
      <section class="py-16 sm:py-20 bg-slate-50 dark:bg-slate-800/40">
        <Container maxWidth="lg" class="max-w-3xl text-center">
          <Title level={2} class="mb-4 text-slate-900 dark:text-white">
            快速开始
          </Title>
          <Paragraph class="text-slate-600 dark:text-slate-300 mb-8">
            通过 JSR 安装，按需从主入口或 /mobile 子路径导入组件。
          </Paragraph>
          <CodeBlock
            // showWindowDots={false}
            title="安装与导入"
            code={`// Deno
deno add jsr:@dreamer/ui-view
// Bun
bunx jsr add @dreamer/ui-view

// 桌面组件（默认）
import { Button, Modal, Table } from "@dreamer/ui-view";

// 移动端组件
import { BottomSheet, TabBar } from "@dreamer/ui-view/mobile";

`}
            language="typescript"
            copyable
            class="rounded-xl text-left bg-slate-900 dark:bg-slate-950 border border-slate-700"
          />
          <Text class="mt-6 text-sm text-slate-500 dark:text-slate-400 block">
            本示例站使用 @dreamer/dweb 构建，左侧进入桌面版可浏览全部组件文档。
          </Text>
        </Container>
      </section>

      {/* 底部 CTA：Container + Title + Paragraph + Link */}
      <section class="py-16 sm:py-20 border-t border-slate-200/80 dark:border-slate-700/80">
        <Container maxWidth="md" class="max-w-2xl text-center">
          <Title level={3} class="mb-3 text-slate-900 dark:text-white">
            开始探索组件
          </Title>
          <Paragraph class="text-slate-600 dark:text-slate-400 mb-8">
            从基础组件、表单、反馈到数据展示与图表，覆盖常见中后台与 C 端场景。
          </Paragraph>
          <Link
            href="/desktop"
            className="inline-flex items-center rounded-xl bg-teal-500 px-8 py-3.5 text-base font-semibold text-white dark:text-white hover:bg-teal-600 hover:text-white dark:bg-teal-600 dark:hover:bg-teal-500 dark:hover:text-white transition-colors"
          >
            进入组件文档 →
          </Link>
        </Container>
      </section>
    </div>
  );
}
