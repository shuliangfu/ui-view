/** 路由: /layout/hero */
import { Button, Hero, Paragraph, Title } from "@dreamer/ui-view";

export default function LayoutHero() {
  return (
    <div class="space-y-8">
      <Title level={1}>Hero</Title>
      <Paragraph>
        英雄区：title、subtitle、description、extra、media、layout（center/left/right）、fullScreen、background、class、contentClass、children。
      </Paragraph>

      <Title level={2}>layout=center</Title>
      <div class="rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden">
        <Hero
          layout="center"
          title="欢迎使用产品"
          subtitle="副标题文案"
          description="这里是描述段落，可多行说明产品价值或引导操作。"
          extra={
            <>
              <Button variant="primary">立即开始</Button>
              <Button variant="default">了解更多</Button>
            </>
          }
        />
      </div>

      <Title level={2}>layout=left</Title>
      <div class="rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden">
        <Hero
          layout="left"
          title="左文右图"
          description="左侧文案、右侧可放插画或图片。"
          extra={<Button variant="primary">主操作</Button>}
          media={
            <div class="h-48 rounded-lg bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-500">
              插画/图片区
            </div>
          }
        />
      </div>
      <Title level={2}>layout=right</Title>
      <div class="rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden">
        <Hero
          layout="right"
          title="右文左图"
          description="右侧文案、左侧可放媒体。"
          extra={<Button variant="primary">主操作</Button>}
          media={
            <div class="h-48 rounded-lg bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-500">
              媒体区
            </div>
          }
        />
      </div>
    </div>
  );
}
