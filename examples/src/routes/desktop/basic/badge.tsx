/**
 * Badge 组件示例
 * 路由: /basic/badge
 */

import { Badge, Paragraph, Title } from "@dreamer/ui-view";

export default function BasicBadge() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Badge 角标 / 徽章</Title>
        <Paragraph>
          数字徽章、count + max、dot 圆点模式，variant / size。
        </Paragraph>
      </div>

      <section class="space-y-4">
        <Title level={2}>variant 变体</Title>
        <div class="flex flex-wrap gap-3">
          <Badge variant="default" count={1} />
          <Badge variant="primary" count={2} />
          <Badge variant="secondary" count={3} />
          <Badge variant="success" count={5} />
          <Badge variant="warning" count={9} />
          <Badge variant="danger" count={99} />
          <Badge variant="ghost" count={0} />
        </div>
      </section>

      <section class="space-y-4">
        <Title level={2}>count 与 max</Title>
        <div class="flex flex-wrap items-center gap-4">
          <Badge variant="primary" count={10} max={9} />
          <Badge variant="danger" count={100} max={99} />
        </div>
      </section>

      <section class="space-y-4">
        <Title level={2}>dot 圆点</Title>
        <div class="flex flex-wrap gap-4">
          <Badge variant="primary" dot />
          <Badge variant="danger" dot />
        </div>
      </section>

      <section class="space-y-4">
        <Title level={2}>size 尺寸</Title>
        <div class="flex flex-wrap items-center gap-4">
          <Badge variant="primary" size="xs" count={1} />
          <Badge variant="primary" size="sm" count={2} />
          <Badge variant="primary" size="md" count={3} />
          <Badge variant="primary" size="lg" count={4} />
        </div>
      </section>
    </div>
  );
}
