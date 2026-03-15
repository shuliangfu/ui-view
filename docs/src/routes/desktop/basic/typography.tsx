/**
 * Typography 组件示例（Title / Text / Paragraph）
 * 路由: /basic/typography
 */

import { Paragraph, Text, Title } from "@dreamer/ui-view";

export default function BasicTypography() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Typography 排版</Title>
        <Paragraph>Title、Text、Paragraph，标题层级与正文。</Paragraph>
      </div>

      <section class="space-y-4">
        <Title level={2}>Title 标题层级</Title>
        <div class="space-y-2">
          <Title level={1}>标题 level 1</Title>
          <Title level={2}>标题 level 2</Title>
          <Title level={3}>标题 level 3</Title>
          <Title level={4}>标题 level 4</Title>
          <Title level={5}>标题 level 5</Title>
          <Title level={6}>标题 level 6</Title>
        </div>
      </section>

      <section class="space-y-4">
        <Title level={2}>Text 正文</Title>
        <p>
          <Text>这是一段正文（Text）。</Text>
        </p>
        <p>
          <Text truncate class="max-w-xs block">
            这是一段会被省略号截断的较长正文内容，用于演示 truncate 属性。
          </Text>
        </p>
      </section>

      <section class="space-y-4">
        <Title level={2}>Paragraph 段落</Title>
        <Paragraph>
          这是 Paragraph 组件，用于多行段落，行高与颜色已适配 light/dark。
        </Paragraph>
      </section>
    </div>
  );
}
