/** 路由: /feedback/dialog */
import { createSignal } from "@dreamer/view";
import { Button, Dialog, Paragraph, Title } from "@dreamer/ui-view";

export default function FeedbackDialog() {
  const [open, setOpen] = createSignal(false);
  const [openDanger, setOpenDanger] = createSignal(false);

  return (
    <div class="space-y-6">
      <Title level={1}>Dialog</Title>
      <Paragraph>
        确认/取消对话框：标题、内容、确定/取消；支持危险样式、确定 loading。
      </Paragraph>

      <div class="flex gap-2">
        <Button variant="primary" onClick={() => setOpen(true)}>
          打开 Dialog
        </Button>
        <Button variant="danger" onClick={() => setOpenDanger(true)}>
          危险操作
        </Button>
      </div>

      <Dialog
        open={open()}
        onClose={() => setOpen(false)}
        title="确认操作"
        content="确定要执行该操作吗？"
        confirmText="确定"
        cancelText="取消"
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />

      <Dialog
        open={openDanger()}
        onClose={() => setOpenDanger(false)}
        title="删除确认"
        content="删除后无法恢复，确定要删除吗？"
        confirmText="删除"
        cancelText="取消"
        danger
        onConfirm={() => setOpenDanger(false)}
        onCancel={() => setOpenDanger(false)}
      />
    </div>
  );
}
