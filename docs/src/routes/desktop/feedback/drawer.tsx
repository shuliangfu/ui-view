/** 路由: /feedback/drawer */
import { createSignal } from "@dreamer/view";
import { Button, Drawer, Paragraph, Title } from "@dreamer/ui-view";

export default function FeedbackDrawer() {
  const [openRight, setOpenRight] = createSignal(false);
  const [openLeft, setOpenLeft] = createSignal(false);

  return (
    <div class="space-y-6">
      <Title level={1}>Drawer</Title>
      <Paragraph>
        侧边抽屉：左/右滑出；支持 placement、width、title、footer、closable、maskClosable、destroyOnClose、keyboard。
      </Paragraph>

      <div class="flex gap-2">
        <Button variant="primary" onClick={() => setOpenRight(true)}>
          右侧抽屉
        </Button>
        <Button variant="default" onClick={() => setOpenLeft(true)}>
          左侧抽屉
        </Button>
      </div>

      <Drawer
        open={openRight()}
        onClose={() => setOpenRight(false)}
        placement="right"
        title="右侧抽屉"
        footer={
          <Button variant="primary" onClick={() => setOpenRight(false)}>
            确定
          </Button>
        }
      >
        <p class="text-sm text-slate-600 dark:text-slate-400">
          抽屉内容区域，可放置表单或列表。
        </p>
      </Drawer>

      <Drawer
        open={openLeft()}
        onClose={() => setOpenLeft(false)}
        placement="left"
        width={320}
        title="左侧抽屉"
      >
        <p class="text-sm text-slate-600 dark:text-slate-400">
          从左侧滑出的面板，宽度 320px。
        </p>
      </Drawer>

      <Paragraph class="text-sm text-slate-500 dark:text-slate-400">
        其他用法：closable（默认 true 显示关闭按钮）、maskClosable（默认 true 点击遮罩关闭）、destroyOnClose（关闭后销毁内容）、keyboard（默认 true 支持 Esc 关闭）。
      </Paragraph>
    </div>
  );
}
