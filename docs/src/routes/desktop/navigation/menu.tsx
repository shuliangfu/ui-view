/** 路由: /navigation/menu */
import { createSignal } from "@dreamer/view";
import { Menu, Paragraph, Title } from "@dreamer/ui-view";

export default function NavigationMenu() {
  const [selected, setSelected] = createSignal("1");
  const [openKeys, setOpenKeys] = createSignal<string[]>(["sub1"]);
  const [focusedKey, setFocusedKey] = createSignal<string | undefined>("1");

  const items = [
    { key: "1", label: "选项一" },
    { key: "2", label: "选项二" },
    {
      key: "sub1",
      label: "子菜单",
      children: [
        { key: "3", label: "子项 3" },
        { key: "4", label: "子项 4" },
      ],
    },
  ];

  return (
    <div class="space-y-6">
      <Title level={1}>Menu</Title>
      <Paragraph>
        菜单：items、selectedKeys、onClick、mode、defaultOpenKeys、openKeys、onOpenChange、usePopoverSubmenu、focusedKey、onFocusChange、class。
      </Paragraph>

      <div class="flex flex-col gap-8">
        <div class="flex gap-8">
          <Menu
            items={items}
            selectedKeys={[selected()]}
            onClick={(k) => setSelected(k)}
            mode="vertical"
            openKeys={openKeys()}
            onOpenChange={setOpenKeys}
            focusedKey={focusedKey()}
            onFocusChange={setFocusedKey}
          />
          <Menu
            items={items}
            selectedKeys={[selected()]}
            onClick={(k) => setSelected(k)}
            mode="horizontal"
            openKeys={openKeys()}
            onOpenChange={setOpenKeys}
            usePopoverSubmenu
          />
        </div>
      </div>
    </div>
  );
}
