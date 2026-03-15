/** 路由: /navigation/breadcrumb */
import { Breadcrumb, Paragraph, Title } from "@dreamer/ui-view";

export default function NavigationBreadcrumb() {
  const items = [
    { label: "首页", href: "#" },
    { label: "列表", href: "#" },
    { label: "详情" },
  ];

  const itemsWithClick = [
    { label: "首页", href: "#" },
    { label: "列表" },
    { label: "详情" },
  ];

  return (
    <div class="space-y-6">
      <Title level={1}>Breadcrumb</Title>
      <Paragraph>
        面包屑：层级路径，自定义分隔符，最后一项不链化；无 href 时可配合
        onItemClick 或 item.onClick。
      </Paragraph>

      <Breadcrumb items={items} />

      <Breadcrumb
        items={items}
        separator={<span class="mx-1.5 text-slate-400">/</span>}
      />

      <Breadcrumb
        items={itemsWithClick}
        onItemClick={(item, index) => {
          if (typeof globalThis.console !== "undefined") {
            globalThis.console.log("clicked", item.label, index);
          }
        }}
      />
    </div>
  );
}
