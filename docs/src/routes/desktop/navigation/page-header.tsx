/** 路由: /navigation/page-header */
import { Button, PageHeader, Paragraph, Title } from "@dreamer/ui-view";

export default function NavigationPageHeader() {
  return (
    <div class="space-y-6">
      <Title level={1}>PageHeader</Title>
      <Paragraph>
        页头：title、subTitle、onBack、breadcrumb、extra、footer。
      </Paragraph>

      <PageHeader
        title="页面标题"
        subTitle="副标题说明"
        onBack={() => globalThis.history?.back?.()}
        breadcrumb={{
          items: [
            { label: "首页", href: "#" },
            { label: "当前页" },
          ],
        }}
        extra={<Button variant="primary">操作</Button>}
        footer={<p class="text-sm text-slate-500">底部说明文字</p>}
      />
    </div>
  );
}
