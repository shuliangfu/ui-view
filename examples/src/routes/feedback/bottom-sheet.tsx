/** 路由: /feedback/bottom-sheet */
import { createSignal } from "@dreamer/view";
import { BottomSheet, Button, Paragraph, Title } from "@dreamer/ui-view";

export default function FeedbackBottomSheet() {
  const [openAuto, setOpenAuto] = createSignal(false);
  const [openHalf, setOpenHalf] = createSignal(false);
  const [openFull, setOpenFull] = createSignal(false);

  return (
    <div class="space-y-6">
      <Title level={1}>BottomSheet</Title>
      <Paragraph>
        底部抽屉/半屏：移动端典型；支持标题、高度（自动/半屏/全屏）、关闭。
      </Paragraph>

      <div class="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => setOpenAuto(true)}>
          自动高度
        </Button>
        <Button variant="default" onClick={() => setOpenHalf(true)}>
          半屏
        </Button>
        <Button variant="default" onClick={() => setOpenFull(true)}>
          全屏
        </Button>
      </div>

      <BottomSheet
        open={openAuto()}
        onClose={() => setOpenAuto(false)}
        title="选择项"
        height="auto"
      >
        <ul class="divide-y divide-slate-200 dark:divide-slate-600">
          {["选项 A", "选项 B", "选项 C"].map((label) => (
            <li key={label}>
              <button
                type="button"
                class="w-full py-3 text-left text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => setOpenAuto(false)}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </BottomSheet>

      <BottomSheet
        open={openHalf()}
        onClose={() => setOpenHalf(false)}
        title="半屏面板"
        height="half"
      >
        <p class="text-sm text-slate-600 dark:text-slate-400">
          高度为视口一半的底部面板。
        </p>
      </BottomSheet>

      <BottomSheet
        open={openFull()}
        onClose={() => setOpenFull(false)}
        title="全屏面板"
        height="full"
      >
        <p class="text-sm text-slate-600 dark:text-slate-400">
          接近全屏的底部面板，适合长内容。
        </p>
      </BottomSheet>
    </div>
  );
}
