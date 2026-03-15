/** 路由: /other/config-provider */
import { createSignal } from "@dreamer/view";
import {
  Button,
  ConfigProvider,
  getConfig,
  Paragraph,
  Title,
} from "@dreamer/ui-view";

export default function OtherConfigProvider() {
  const [theme, setTheme] = createSignal<"light" | "dark">("light");

  return (
    <div class="space-y-6">
      <Title level={1}>ConfigProvider</Title>
      <Paragraph>
        全局配置：theme（light/dark/system）、locale、componentSize、prefixCls、children、class；子树内通过 getConfig() 读取 theme、locale、componentSize、prefixCls。
      </Paragraph>

      <div class="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
        >
          切换 theme（当前: {theme()}）
        </Button>
      </div>

      <Title level={2}>theme / locale / componentSize</Title>
      <ConfigProvider theme={theme()} locale="zh-CN" componentSize="md">
        <div class="rounded-lg border border-slate-200 dark:border-slate-600 p-4 space-y-3">
          <p class="text-sm font-medium">子树内（受 ConfigProvider 包裹）</p>
          <p class="text-sm text-slate-500">
            当前 theme={theme()}、locale=zh-CN、componentSize=md；子树内组件可
            getConfig() 读取。
          </p>
          <Button type="button" size="sm">
            小按钮
          </Button>
        </div>
      </ConfigProvider>

      <Title level={2}>getConfig()</Title>
      <div class="rounded-lg border border-slate-200 dark:border-slate-600 p-4">
        <p class="text-sm text-slate-500">
          子树外 getConfig(): theme={getConfig().theme ?? "-"}, locale=
          {getConfig().locale ?? "-"},
          componentSize={getConfig().componentSize ?? "-"}
        </p>
      </div>
    </div>
  );
}
