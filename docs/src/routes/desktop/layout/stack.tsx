/** 路由: /layout/stack */
import { Paragraph, Stack, Title } from "@dreamer/ui-view";

export default function LayoutStack() {
  return (
    <div class="space-y-6">
      <Title level={1}>Stack</Title>
      <Paragraph>
        堆叠：direction、gap、align、justify、wrap、inline、class、children。
      </Paragraph>

      <Title level={2}>direction=column</Title>
      <Stack direction="column" gap={4} class="max-w-xs">
        <div class="rounded bg-slate-200 dark:bg-slate-600 p-2">1</div>
        <div class="rounded bg-slate-200 dark:bg-slate-600 p-2">2</div>
        <div class="rounded bg-slate-200 dark:bg-slate-600 p-2">3</div>
      </Stack>

      <Title level={2}>direction=row, align=center</Title>
      <Stack direction="row" gap={2} align="center">
        <div class="rounded bg-blue-200 dark:bg-blue-800 p-2">A</div>
        <div class="rounded bg-blue-200 dark:bg-blue-800 p-2">B</div>
        <div class="rounded bg-blue-200 dark:bg-blue-800 p-2">C</div>
      </Stack>
      <Title level={2}>justify=between</Title>
      <Stack direction="row" gap={4} justify="between" class="max-w-md">
        <span class="text-sm">左</span>
        <span class="text-sm">右</span>
      </Stack>
      <Title level={2}>wrap</Title>
      <Stack direction="row" gap={2} wrap class="max-w-48">
        <div class="rounded bg-slate-200 dark:bg-slate-600 p-2">1</div>
        <div class="rounded bg-slate-200 dark:bg-slate-600 p-2">2</div>
        <div class="rounded bg-slate-200 dark:bg-slate-600 p-2">3</div>
        <div class="rounded bg-slate-200 dark:bg-slate-600 p-2">4</div>
      </Stack>
    </div>
  );
}
