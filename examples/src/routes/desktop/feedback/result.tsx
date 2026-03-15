/** 路由: /feedback/result */
import { Button, Paragraph, Result, Title } from "@dreamer/ui-view";

export default function FeedbackResult() {
  return (
    <div class="space-y-8">
      <Title level={1}>Result</Title>
      <Paragraph>
        结果页：成功/失败/信息/警告/403/404
        等结果态；支持标题、副标题、自定义图标、操作区。
      </Paragraph>

      <div class="space-y-6">
        <Title level={2}>成功</Title>
        <Result
          status="success"
          title="操作成功"
          subTitle="您的申请已提交，我们将在 1-3 个工作日内处理。"
          extra={<Button variant="primary">返回列表</Button>}
        />
      </div>

      <div class="space-y-6">
        <Title level={2}>失败</Title>
        <Result
          status="error"
          title="提交失败"
          subTitle="请检查网络后重试，或联系客服。"
          extra={
            <>
              <Button variant="default">返回</Button>
              <Button variant="primary">重试</Button>
            </>
          }
        />
      </div>

      <div class="space-y-6">
        <Title level={2}>403 / 404</Title>
        <Result
          status="403"
          title="无权限"
          subTitle="您没有权限访问该页面。"
          extra={<Button variant="primary">返回首页</Button>}
        />
        <Result
          status="404"
          title="页面不存在"
          subTitle="请检查链接或返回首页。"
          extra={<Button variant="primary">返回首页</Button>}
        />
      </div>
    </div>
  );
}
