/**
 * Skeleton 组件示例
 * 路由: /basic/skeleton
 */

import { Paragraph, Skeleton, Title } from "@dreamer/ui-view";

export default function BasicSkeleton() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Skeleton 骨架屏</Title>
        <Paragraph>加载占位，支持 size 与自定义 class（宽高）。</Paragraph>
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

      <section class="space-y-4">
        <Title level={2}>模拟卡片骨架</Title>
        <div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div class="flex gap-4">
            <Skeleton class="w-16 h-16 rounded-full shrink-0" />
            <div class="flex-1 space-y-2">
              <Skeleton class="h-5 w-32" />
              <Skeleton class="h-4 w-full" />
              <Skeleton class="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
