/**
 * Avatar 组件示例
 * 路由: /basic/avatar
 */

import { Avatar, Paragraph, Title } from "@dreamer/ui-view";

export default function BasicAvatar() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Avatar 头像</Title>
        <Paragraph>支持 src 图片或 children（如首字），size 尺寸。</Paragraph>
      </div>

      <section class="space-y-4">
        <Title level={2}>size 尺寸</Title>
        <div class="flex flex-wrap items-end gap-4">
          <Avatar size="xs">A</Avatar>
          <Avatar size="sm">B</Avatar>
          <Avatar size="md">C</Avatar>
          <Avatar size="lg">D</Avatar>
        </div>
      </section>

      <section class="space-y-4">
        <Title level={2}>首字（children）</Title>
        <div class="flex flex-wrap gap-3">
          <Avatar size="md">张</Avatar>
          <Avatar size="md">李</Avatar>
          <Avatar size="md">王</Avatar>
        </div>
      </section>

      <section class="space-y-4">
        <Title level={2}>图片 src</Title>
        <div class="flex flex-wrap gap-3">
          <Avatar
            size="lg"
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
            alt="Avatar"
          />
        </div>
      </section>
    </div>
  );
}
