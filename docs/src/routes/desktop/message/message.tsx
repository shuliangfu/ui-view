/**
 * 消息与通知 - Message 全局提示
 * 路由: /message/message
 */

import { Button, message, Paragraph, Title } from "@dreamer/ui-view";

export default function MessageMessage() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Message</Title>
        <Paragraph>
          全局提示（固定顶部居中）：message.success(content, duration?)、message.error/info/warning 同上、message.destroy() 关闭全部。duration 默认 3000ms。
        </Paragraph>
      </div>

      <section class="space-y-4">
        <Title level={2}>类型</Title>
        <div class="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="success"
            onClick={() => message.success("保存成功")}
          >
            message.success
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => message.error("网络错误")}
          >
            message.error
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => message.info("已复制到剪贴板")}
          >
            message.info
          </Button>
          <Button
            type="button"
            variant="warning"
            onClick={() => message.warning("请先登录")}
          >
            message.warning
          </Button>
        </div>
        <Title level={2}>duration 与 destroy</Title>
        <div class="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => message.info("5 秒后关闭", 5000)}
          >
            5 秒后关闭
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => message.destroy()}
          >
            message.destroy()
          </Button>
        </div>
      </section>
    </div>
  );
}
