/**
 * 消息与通知 - Notification 消息通知框
 * 路由: /message/notification
 */

import { Button, Paragraph, Title, notification, toast } from "@dreamer/ui-view";

export default function MessageNotification() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Notification</Title>
        <Paragraph>
          消息通知框：带标题、描述、类型图标，右上角堆叠，支持 key 去重、操作按钮、duration。
        </Paragraph>
      </div>

      <section class="space-y-4">
        <Title level={2}>类型</Title>
        <div class="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="primary"
            onClick={() =>
              notification.open({
                title: "任务完成",
                description: "您的文件已上传成功。",
                type: "success",
              })}
          >
            成功通知
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() =>
              notification.open({
                title: "请求失败",
                description: "请检查网络后重试。",
                type: "error",
              })}
          >
            错误通知
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              notification.open({
                title: "系统通知",
                description: "新版本已发布，建议尽快更新。",
                type: "info",
              })}
          >
            信息通知
          </Button>
        </div>
      </section>

      <section class="space-y-4">
        <Title level={2}>操作按钮</Title>
        <div class="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              notification.open({
                title: "系统通知",
                description: "新版本已发布，建议尽快更新。",
                type: "info",
                btnText: "查看详情",
                onBtnClick: () => toast.info("点击了「查看详情」"),
              })}
          >
            带操作按钮
          </Button>
        </div>
      </section>

      <section class="space-y-4">
        <Title level={2}>key 去重</Title>
        <Paragraph>相同 key 会替换旧通知。</Paragraph>
        <div class="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              notification.open({
                key: "unique-key",
                title: "同 key 会替换",
                description: "多次点击此按钮，只会保留一条（key 去重）。",
                type: "default",
              })}
          >
            同 key 去重
          </Button>
        </div>
      </section>
    </div>
  );
}
