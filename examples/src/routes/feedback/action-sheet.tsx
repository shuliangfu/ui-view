/** 路由: /feedback/action-sheet */
import { createSignal } from "@dreamer/view";
import { ActionSheet, Button, Paragraph, Title } from "@dreamer/ui-view";

export default function FeedbackActionSheet() {
  const [open, setOpen] = createSignal(false);
  const [openWithTitle, setOpenWithTitle] = createSignal(false);

  const actions = [
    { label: "选项一", onClick: () => {} },
    { label: "选项二", onClick: () => {} },
    { label: "禁用项", disabled: true },
    { label: "危险操作", danger: true, onClick: () => {} },
  ];

  return (
    <div class="space-y-6">
      <Title level={1}>ActionSheet</Title>
      <Paragraph>
        底部动作列表：移动端选择/操作；支持标题、危险项、禁用项、取消按钮。
      </Paragraph>

      <div class="flex gap-2">
        <Button variant="primary" onClick={() => setOpen(true)}>
          打开 ActionSheet
        </Button>
        <Button variant="default" onClick={() => setOpenWithTitle(true)}>
          带标题
        </Button>
      </div>

      <ActionSheet
        open={open()}
        onClose={() => setOpen(false)}
        actions={actions}
        cancelText="取消"
      />

      <ActionSheet
        open={openWithTitle()}
        onClose={() => setOpenWithTitle(false)}
        title="请选择操作"
        actions={[
          { label: "拍照", onClick: () => {} },
          { label: "从相册选择", onClick: () => {} },
        ]}
        cancelText="取消"
      />
    </div>
  );
}
