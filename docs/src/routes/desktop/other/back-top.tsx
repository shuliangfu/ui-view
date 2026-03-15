/** 路由: /other/back-top */
import { createSignal } from "@dreamer/view";
import { BackTop, Paragraph, Title } from "@dreamer/ui-view";

export default function OtherBackTop() {
  const [visible, setVisible] = createSignal(false);

  return (
    <div class="space-y-6">
      <Title level={1}>BackTop</Title>
      <Paragraph>
        回到顶部：visibilityHeight、target、visible、onVisibilityChange、onClick、right、bottom、children（自定义按钮）、class。
      </Paragraph>

      <Title level={2}>默认用法</Title>
      <div class="h-[200vh] space-y-4">
        <p class="text-sm text-slate-500">
          向下滚动后，右下角会出现回到顶部按钮（visibilityHeight=200、right/bottom=24）。
        </p>
        <div class="h-48 rounded-lg bg-slate-100 dark:bg-slate-700 p-4">
          占位内容 1
        </div>
        <div class="h-48 rounded-lg bg-slate-100 dark:bg-slate-700 p-4">
          占位内容 2
        </div>
        <div class="h-48 rounded-lg bg-slate-100 dark:bg-slate-700 p-4">
          占位内容 3
        </div>
      </div>

      <BackTop
        visibilityHeight={200}
        visible={visible()}
        onVisibilityChange={setVisible}
        right={24}
        bottom={24}
      />
      <Title level={2}>自定义 children</Title>
      <Paragraph>下方区域滚动后会出现自定义文案的回到顶部按钮。</Paragraph>
      <div class="h-[150vh] flex items-start pt-4">
        <p class="text-sm text-slate-500">占位滚动区</p>
      </div>
      <BackTop
        visibilityHeight={150}
        right={24}
        bottom={80}
      >
        <span class="text-xs font-medium">回到顶部</span>
      </BackTop>
    </div>
  );
}
