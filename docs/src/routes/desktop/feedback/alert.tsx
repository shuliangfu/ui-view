/** 路由: /feedback/alert */
import { Alert, Button, Paragraph, Title } from "@dreamer/ui-view";

export default function FeedbackAlert() {
  return (
    <div class="space-y-6">
      <Title level={1}>Alert</Title>
      <Paragraph>
        静态提示条：成功/信息/警告/错误；支持标题、描述、可关闭、自定义操作、横幅样式。
      </Paragraph>

      <div class="space-y-3">
        <Alert type="success" message="操作成功" />
        <Alert type="info" message="这是一条信息提示" />
        <Alert type="warning" message="请注意当前操作可能影响数据" />
        <Alert type="error" message="操作失败，请重试" />
      </div>

      <div class="space-y-3">
        <Title level={2}>带描述</Title>
        <Alert
          type="info"
          message="提示标题"
          description="这里是补充描述，可多行说明当前状态或后续操作建议。"
        />
      </div>

      <div class="space-y-3">
        <Title level={2}>可关闭</Title>
        <Alert
          type="warning"
          message="可关闭的提示"
          closable
          onClose={() => {}}
        />
      </div>

      <div class="space-y-3">
        <Title level={2}>自定义操作</Title>
        <Alert
          type="info"
          message="有新版本可用"
          description="当前为 v1.0，可升级至 v2.0。"
          action={
            <Button variant="primary" size="sm">
              立即升级
            </Button>
          }
        />
      </div>

      <div class="space-y-3">
        <Title level={2}>不显示图标（showIcon=false）</Title>
        <Alert
          type="info"
          message="仅文案，不显示左侧图标"
          showIcon={false}
        />
      </div>

      <div class="space-y-3">
        <Title level={2}>横幅样式（banner）</Title>
        <Alert
          type="warning"
          message="整行横幅提示，常用于页面顶部"
          banner
        />
      </div>
    </div>
  );
}
