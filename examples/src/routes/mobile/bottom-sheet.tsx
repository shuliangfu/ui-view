/** 路由: /mobile/bottom-sheet */
import { createSignal } from "@dreamer/view";
import { BottomSheet, Button, Paragraph, Title } from "@dreamer/ui-view";

export default function MobileBottomSheet() {
  const [open, setOpen] = createSignal(false);
  const [openHalf, setOpenHalf] = createSignal(false);
  const [openFull, setOpenFull] = createSignal(false);

  return (
    <div class="space-y-6">
      <Title level={1}>BottomSheet</Title>
      <Paragraph>底部抽屉/半屏，与 Modal 语义对齐；支持标题、高度模式、footer、关闭。</Paragraph>

      <div class="flex flex-wrap gap-3">
        <Button type="button" onClick={() => setOpen(true)}>
          打开（auto 高度）
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpenHalf(true)}>
          半屏
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpenFull(true)}>
          全屏
        </Button>
      </div>

      <BottomSheet
        open={open()}
        onClose={() => setOpen(false)}
        title="标题"
        height="auto"
        footer={
          <div class="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="button" onClick={() => setOpen(false)}>
              确定
            </Button>
          </div>
        }
      >
        <p class="text-sm text-slate-600 dark:text-slate-400">
          内容区域。可滚动。支持 footer 底部按钮组。
        </p>
      </BottomSheet>

      <BottomSheet
        open={openHalf()}
        onClose={() => setOpenHalf(false)}
        title="半屏"
        height="half"
      >
        <p class="text-sm">高度为视口一半。</p>
      </BottomSheet>

      <BottomSheet
        open={openFull()}
        onClose={() => setOpenFull(false)}
        title="全屏"
        height="full"
      >
        <p class="text-sm">高度接近全屏。</p>
      </BottomSheet>
    </div>
  );
}
