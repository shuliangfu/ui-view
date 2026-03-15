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
        <Paragraph>支持 size、src、alt、class；无 src 时用 children（如首字）显示。</Paragraph>
      </div>

      <section class="space-y-4">
        <Title level={2}>size 尺寸</Title>
        <Paragraph class="text-slate-500 dark:text-slate-400">
          共 6 种：xs(32px) / sm(40px) / md(48px) / lg(64px) / xl(80px) /
          2xl(96px)。
        </Paragraph>
        <div class="flex flex-wrap items-end gap-4">
          <Avatar size="xs">xs</Avatar>
          <Avatar size="sm">sm</Avatar>
          <Avatar size="md">md</Avatar>
          <Avatar size="lg">lg</Avatar>
          <Avatar size="xl">xl</Avatar>
          <Avatar size="2xl">2xl</Avatar>
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
        <Title level={2}>图片 src 与 alt</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          src 为图片地址，alt 为图片加载失败时的替代文本（无障碍）。
        </Paragraph>
        <div class="flex flex-wrap gap-3">
          <Avatar
            size="lg"
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
            alt="Avatar"
          />
        </div>
      </section>

      <section class="space-y-4">
        <Title level={2}>class 自定义样式</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          通过 class 可加边框、阴影等。
        </Paragraph>
        <div class="flex flex-wrap gap-3">
          <Avatar size="md" class="ring-2 ring-blue-500">A</Avatar>
          <Avatar size="md" class="ring-2 ring-amber-400 ring-offset-2">B</Avatar>
        </div>
      </section>
    </div>
  );
}
