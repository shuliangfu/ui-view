/** 路由: /feedback/progress */
import { Paragraph, Progress, Title } from "@dreamer/ui-view";

export default function FeedbackProgress() {
  return (
    <div class="space-y-6">
      <Title level={1}>Progress</Title>
      <Paragraph>
        进度条（线性/环形）；支持百分比、状态（正常/成功/异常/进行中）、是否显示文案、自定义颜色与
        format。
      </Paragraph>

      <div class="space-y-4">
        <Title level={2}>线性</Title>
        <div class="space-y-2 max-w-md">
          <Progress percent={30} />
          <Progress percent={70} status="success" />
          <Progress percent={100} status="exception" />
          <Progress percent={45} status="active" />
        </div>
      </div>

      <div class="space-y-4">
        <Title level={2}>不显示百分比</Title>
        <div class="max-w-md">
          <Progress percent={60} showInfo={false} />
        </div>
      </div>

      <div class="space-y-4">
        <Title level={2}>自定义 format</Title>
        <div class="max-w-md">
          <Progress
            percent={3}
            format={(_p) => `3/10 步`}
          />
        </div>
      </div>

      <div class="space-y-4">
        <Title level={2}>环形</Title>
        <div class="flex flex-wrap gap-8">
          <Progress type="circle" percent={75} />
          <Progress type="circle" percent={100} status="success" />
          <Progress
            type="circle"
            percent={30}
            size={80}
            strokeWidthCircle={4}
          />
        </div>
      </div>
    </div>
  );
}
