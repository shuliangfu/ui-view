/**
 * Button 组件示例
 * 路由: /basic/button
 */

import { Button, Paragraph, Title } from "@dreamer/ui-view";

export default function BasicButton() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Button 按钮 222</Title>
        <Paragraph>支持 variant、size、disabled，与 type 等属性。</Paragraph>
      </div>

      <section class="space-y-4">
        <Title level={2}>variant 变体</Title>
        <div class="flex flex-wrap gap-3">
          <Button variant="default">default</Button>
          <Button variant="primary">primary</Button>
          <Button variant="secondary">secondary</Button>
          <Button variant="success">success</Button>
          <Button variant="warning">warning</Button>
          <Button variant="danger">danger</Button>
          <Button variant="ghost">ghost</Button>
        </div>
      </section>

      <section class="space-y-4">
        <Title level={2}>size 尺寸</Title>
        <div class="flex flex-wrap items-center gap-3">
          <Button size="xs">xs</Button>
          <Button size="sm">sm</Button>
          <Button size="md">md</Button>
          <Button size="lg">lg</Button>
        </div>
      </section>

      <section class="space-y-4">
        <Title level={2}>disabled</Title>
        <p class="text-sm text-slate-600 dark:text-slate-400">
          各变体禁用态：opacity + grayscale，不可点击。
        </p>
        <div class="flex flex-wrap gap-3">
          <Button variant="default" disabled>default</Button>
          <Button variant="primary" disabled>primary</Button>
          <Button variant="secondary" disabled>secondary</Button>
          <Button variant="success" disabled>success</Button>
          <Button variant="warning" disabled>warning</Button>
          <Button variant="danger" disabled>danger</Button>
          <Button variant="ghost" disabled>ghost</Button>
        </div>
      </section>

      <section class="space-y-4">
        <Title level={2}>type</Title>
        <div class="flex flex-wrap gap-3">
          <Button type="button" variant="primary">button</Button>
          <Button type="submit" variant="secondary">submit</Button>
          <Button type="reset" variant="ghost">reset</Button>
        </div>
      </section>
    </div>
  );
}
