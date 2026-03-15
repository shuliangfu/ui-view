/**
 * Spinner 组件示例
 * 路由: /basic/spinner
 */

import { Paragraph, Spinner, Title } from "@dreamer/ui-view";

export default function BasicSpinner() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Spinner 加载</Title>
        <Paragraph>加载旋转指示器，支持 size、class。</Paragraph>
      </div>

      <section class="space-y-4">
        <Title level={2}>size 尺寸</Title>
        <div class="flex flex-wrap items-center gap-6">
          <Spinner size="xs" />
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
        </div>
      </section>

      <section class="space-y-4">
        <Title level={2}>自定义 class</Title>
        <div class="flex flex-wrap items-center gap-6">
          <Spinner class="text-green-600" />
          <Spinner class="text-red-500" size="lg" />
        </div>
      </section>
    </div>
  );
}
