/**
 * Skeleton 组件示例
 * 路由: /basic/skeleton
 */

import { Paragraph, Skeleton, Title } from "@dreamer/ui-view";

export default function BasicSkeleton() {
  return (
    <div class="space-y-10">
      <div>
        <Title level={1}>Skeleton 骨架屏</Title>
        <Paragraph>
          加载占位，支持 size 与自定义
          class（宽高）。下方为模拟整页排版的骨架示例。
        </Paragraph>
      </div>

      <section class="space-y-4">
        <Title level={2}>size 尺寸</Title>
        <div class="space-y-3">
          <Skeleton size="xs" />
          <Skeleton size="sm" />
          <Skeleton size="md" />
          <Skeleton size="lg" />
        </div>
      </section>

      <section class="space-y-4">
        <Title level={2}>自定义宽高</Title>
        <div class="space-y-3">
          <Skeleton class="w-full h-4" />
          <Skeleton class="w-3/4 h-4" />
          <Skeleton class="w-1/2 h-8" />
        </div>
      </section>

      {/* 模拟整页排版：顶栏 + 侧栏 + 主内容 + 底栏 */}
      <section class="space-y-4">
        <Title level={2}>模拟整页排版</Title>
        <Paragraph class="text-slate-500 dark:text-slate-400">
          顶栏、左侧边栏、主内容区、底栏的完整页面骨架，用于整页加载占位。
        </Paragraph>
        <div class="rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden bg-white dark:bg-slate-900">
          <header class="flex h-14 items-center gap-4 border-b border-slate-200 dark:border-slate-700 px-4">
            <Skeleton class="h-8 w-24 rounded-md shrink-0" />
            <nav class="flex gap-2">
              <Skeleton class="h-8 w-16 rounded-md" />
              <Skeleton class="h-8 w-16 rounded-md" />
              <Skeleton class="h-8 w-20 rounded-md" />
            </nav>
            <div class="ml-auto flex items-center gap-2">
              <Skeleton class="h-8 w-8 rounded-full" />
              <Skeleton class="h-8 w-8 rounded-full" />
            </div>
          </header>
          <div class="flex min-h-[320px]">
            <aside class="w-52 shrink-0 border-r border-slate-200 dark:border-slate-700 p-4 space-y-2">
              <Skeleton class="h-4 w-20" />
              <Skeleton class="h-8 w-full rounded-md" />
              <Skeleton class="h-8 w-full rounded-md" />
              <Skeleton class="h-8 w-4/5 rounded-md" />
              <Skeleton class="h-8 w-full rounded-md" />
              <Skeleton class="h-8 w-3/4 rounded-md" />
            </aside>
            <main class="flex-1 min-w-0 p-6 space-y-6">
              <div>
                <Skeleton class="h-8 w-64 mb-2" />
                <Skeleton class="h-4 w-full max-w-xl" />
                <Skeleton class="h-4 w-full max-w-lg mt-2" />
              </div>
              <div class="grid grid-cols-3 gap-4">
                <Skeleton class="h-24 w-full rounded-lg" />
                <Skeleton class="h-24 w-full rounded-lg" />
                <Skeleton class="h-24 w-full rounded-lg" />
              </div>
              <div class="space-y-2">
                <Skeleton class="h-4 w-full" />
                <Skeleton class="h-4 w-full" />
                <Skeleton class="h-4 w-5/6" />
                <Skeleton class="h-4 w-4/5" />
              </div>
            </main>
          </div>
          <footer class="flex h-12 items-center justify-center border-t border-slate-200 dark:border-slate-700">
            <Skeleton class="h-4 w-48" />
          </footer>
        </div>
      </section>
    </div>
  );
}
