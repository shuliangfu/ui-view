/** 路由: /mobile/nav-bar */
import { NavBar, Paragraph, Title } from "@dreamer/ui-view";

export default function MobileNavBar() {
  return (
    <div class="space-y-6">
      <Title level={1}>NavBar</Title>
      <Paragraph>顶栏：标题、返回、右侧操作；支持固定、安全区、占位。</Paragraph>

      <div class="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
        <NavBar
          title="标题"
          leftText="返回"
          leftArrow
          onClickLeft={() => (globalThis as unknown as { history?: { back?: () => void } }).history?.back?.()}
          rightText="按钮"
          onClickRight={() => alert("点击右侧")}
          border
        />
        <div class="p-4 text-sm text-slate-600 dark:text-slate-400">
          内容区域（非固定时）
        </div>
      </div>

      <div class="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
        <NavBar
          title="固定顶栏"
          leftText="返回"
          leftArrow
          onClickLeft={() => (globalThis as unknown as { history?: { back?: () => void } }).history?.back?.()}
          fixed
          placeholder
          safeAreaInsetTop
          border
        />
        <div class="p-4 text-sm text-slate-600 dark:text-slate-400">
          固定时使用 placeholder 避免内容被遮挡。
        </div>
      </div>
    </div>
  );
}
