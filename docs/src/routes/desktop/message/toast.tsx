/**
 * 消息与通知 - Toast 轻提示
 * 路由: /message/toast
 */

import { Button, Paragraph, Title, toast } from "@dreamer/ui-view";

export default function MessageToast() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Toast</Title>
        <Paragraph>
          轻提示：无标题或仅图标+一句话，可设置 duration 自动关闭，支持多种
          placement（top-center、bottom-right 等）。
        </Paragraph>
      </div>

      <section class="space-y-4">
        <Title level={2}>类型</Title>
        <div class="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="success"
            onClick={() => toast.success("操作成功")}
          >
            success
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => toast.error("操作失败")}
          >
            error
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => toast.info("这是一条信息")}
          >
            info
          </Button>
          <Button
            type="button"
            variant="warning"
            onClick={() => toast.warning("请注意")}
          >
            warning
          </Button>
        </div>
      </section>

      <section class="space-y-4">
        <Title level={2}>placement</Title>
        <Paragraph>不同位置：右下角、5 秒后关闭。</Paragraph>
        <div class="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              toast.show("info", "右下角 5 秒", 5000, "bottom-right")}
          >
            右下角 5s
          </Button>
        </div>
      </section>
    </div>
  );
}
