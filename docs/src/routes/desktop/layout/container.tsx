/** 路由: /layout/container */
import { Container, Paragraph, Title } from "@dreamer/ui-view";

export default function LayoutContainer() {
  return (
    <div class="space-y-6">
      <Title level={1}>Container</Title>
      <Paragraph>
        最大宽度容器，响应式 max-width；支持
        sm/md/lg/xl/2xl/full，居中与内边距可选。
      </Paragraph>

      <Container
        maxWidth="md"
        class="bg-slate-100 dark:bg-slate-800 rounded-lg py-4"
      >
        <p class="text-sm text-slate-600 dark:text-slate-400">
          maxWidth=md（768px）
        </p>
      </Container>
      <Container
        maxWidth="xl"
        class="bg-slate-100 dark:bg-slate-800 rounded-lg py-4"
      >
        <p class="text-sm text-slate-600 dark:text-slate-400">
          maxWidth=xl（1280px）
        </p>
      </Container>
    </div>
  );
}
