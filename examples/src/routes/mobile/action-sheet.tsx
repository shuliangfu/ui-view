/** 路由: /mobile/action-sheet */
import { createSignal } from "@dreamer/view";
import {
  ActionSheet,
  Button,
  IconTrash,
  Paragraph,
  Title,
} from "@dreamer/ui-view";

export default function MobileActionSheet() {
  const [open, setOpen] = createSignal(false);
  const [openWithIcon, setOpenWithIcon] = createSignal(false);

  return (
    <div class="space-y-6">
      <Title level={1}>ActionSheet</Title>
      <Paragraph>底部动作列表，选择或操作；支持标题、危险项、禁用项、图标。</Paragraph>

      <div class="flex flex-wrap gap-3">
        <Button type="button" onClick={() => setOpen(true)}>
          打开动作列表
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpenWithIcon(true)}>
          带图标
        </Button>
      </div>

      <ActionSheet
        open={open()}
        onClose={() => setOpen(false)}
        title="请选择操作"
        actions={[
          { label: "选项一", onClick: () => console.log("一") },
          { label: "选项二", description: "副标题说明", onClick: () => console.log("二") },
          { label: "禁用项", disabled: true },
          { label: "危险操作", danger: true, onClick: () => console.log("危险") },
        ]}
        cancelText="取消"
      />

      <ActionSheet
        open={openWithIcon()}
        onClose={() => setOpenWithIcon(false)}
        title="带图标的动作"
        actions={[
          { label: "删除", icon: <IconTrash class="w-5 h-5" />, danger: true, onClick: () => setOpenWithIcon(false) },
          { label: "分享", onClick: () => setOpenWithIcon(false) },
        ]}
        cancelText="取消"
      />
    </div>
  );
}
