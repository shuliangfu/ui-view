/** 路由: /feedback/popconfirm */
import { createSignal } from "@dreamer/view";
import { Button, Paragraph, Popconfirm, Title } from "@dreamer/ui-view";

export default function FeedbackPopconfirm() {
  const [open, setOpen] = createSignal(false);
  const [openDanger, setOpenDanger] = createSignal(false);

  return (
    <div class="space-y-6">
      <Title level={1}>Popconfirm</Title>
      <Paragraph>
        气泡确认框：点击触发后显示带标题与「确定/取消」的面板；支持危险样式。需在触发元素上绑定
        onClick 调用 onOpenChange(true)。
      </Paragraph>

      <div class="flex gap-2">
        <Popconfirm
          open={open()}
          onOpenChange={setOpen}
          title="确定要执行该操作吗？"
          onConfirm={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        >
          <Button variant="default" onClick={() => setOpen(true)}>
            普通确认
          </Button>
        </Popconfirm>
        <Popconfirm
          open={openDanger()}
          onOpenChange={setOpenDanger}
          title="删除后无法恢复，确定删除吗？"
          danger
          okText="删除"
          onConfirm={() => setOpenDanger(false)}
          onCancel={() => setOpenDanger(false)}
        >
          <Button variant="danger" onClick={() => setOpenDanger(true)}>
            删除
          </Button>
        </Popconfirm>
      </div>
    </div>
  );
}
