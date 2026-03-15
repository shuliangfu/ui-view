/** 路由: /feedback/modal */
import { createSignal } from "@dreamer/view";
import { Button, Modal, Paragraph, Title } from "@dreamer/ui-view";

export default function FeedbackModal() {
  const [open, setOpen] = createSignal(false);
  const [openNoFooter, setOpenNoFooter] = createSignal(false);

  return (
    <div class="space-y-6">
      <Title level={1}>Modal</Title>
      <Paragraph>
        模态弹窗：遮罩、标题、内容、底部；支持关闭、点击遮罩关闭、Esc、自定义宽度与
        footer。
      </Paragraph>

      <div class="flex gap-2">
        <Button variant="primary" onClick={() => setOpen(true)}>
          打开 Modal
        </Button>
        <Button variant="default" onClick={() => setOpenNoFooter(true)}>
          无 Footer Modal
        </Button>
      </div>

      <Modal
        open={open()}
        onClose={() => setOpen(false)}
        title="弹窗标题"
        footer={
          <>
            <Button variant="default" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={() => setOpen(false)}>
              确定
            </Button>
          </>
        }
      >
        <p class="text-sm text-slate-600 dark:text-slate-400">
          这里是弹层内容区域，可放置表单、说明或自定义节点。
        </p>
      </Modal>

      <Modal
        open={openNoFooter()}
        onClose={() => setOpenNoFooter(false)}
        title="仅标题与内容"
      >
        <p class="text-sm text-slate-600 dark:text-slate-400">
          不传 footer 时不显示底部按钮区。
        </p>
      </Modal>
    </div>
  );
}
