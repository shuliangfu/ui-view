/**
 * 消息与通知 - Notification 消息通知框
 * 路由: /message/notification
 */

import {
  Button,
  notification,
  Paragraph,
  Title,
  toast,
} from "@dreamer/ui-view";

export default function MessageNotification() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Notification</Title>
        <Paragraph>
          消息通知框：notification.open(options)、notification.close(id)、notification.destroy()。options：key、type、title、description、icon、duration、btnText、onBtnClick、onClose、placement（top-right/top-center/top-left/bottom-right/bottom-center/bottom-left）。
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
      <section class="space-y-4">
        <Title level={2}>placement 弹出位置</Title>
        <Paragraph>右上、右下、下中、上中、左上、左下。</Paragraph>
        <div class="flex flex-wrap gap-2">
          {(["top-right", "top-center", "top-left", "bottom-right", "bottom-center", "bottom-left"] as const).map((p) => (
            <Button
              key={p}
              type="button"
              variant="secondary"
              onClick={() =>
                notification.open({
                  title: p,
                  description: `placement="${p}"`,
                  type: "info",
                  placement: p,
                })}
            >
              {p}
            </Button>
          ))}
        </div>
      </section>
      <section class="space-y-4">
        <Title level={2}>duration 与 onClose</Title>
        <div class="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              notification.open({
                title: "2 秒后关闭",
                description: "duration=2000，关闭时触发 onClose。",
                type: "info",
                duration: 2000,
                onClose: () => toast.info("通知已关闭"),
              })}
          >
            自定义 duration + onClose
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => notification.destroy()}
          >
            notification.destroy()
          </Button>
        </div>
      </section>
    </div>
  );
}
