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
          轻提示：toast.success/info/error/warning(content, duration?, placement?)、toast.show(type, content, duration?, placement?)、toast.dismiss(id)、toast.destroy()。placement：top/top-center/top-left/top-right、bottom/bottom-center/bottom-left/bottom-right。duration 默认 3000ms，0 表示不自动关闭。
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
        <Paragraph>不同位置示例。</Paragraph>
        <div class="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              toast.show("info", "右下角 5 秒", 5000, "bottom-right")}
          >
            bottom-right 5s
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              toast.info("左上角", 3000, "top-left")}
          >
            top-left
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              toast.show("info", "不自动关闭", 0, "bottom-center")}
          >
            duration=0 不自动关闭
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => toast.destroy()}
          >
            toast.destroy()
          </Button>
        </div>
      </section>
    </div>
  );
}
