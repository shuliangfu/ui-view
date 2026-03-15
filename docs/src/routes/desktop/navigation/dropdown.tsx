/** 路由: /navigation/dropdown */
import { createSignal } from "@dreamer/view";
import { Button, Dropdown, Paragraph, Title } from "@dreamer/ui-view";

export default function NavigationDropdown() {
  const [open, setOpen] = createSignal(false);
  const [openHover, setOpenHover] = createSignal(false);

  const overlay = (
    <ul class="py-1 list-none m-0">
      <li>
        <a
          href="#"
          class="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          onClick={() => setOpen(false)}
        >
          操作一
        </a>
      </li>
      <li>
        <a
          href="#"
          class="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          onClick={() => setOpen(false)}
        >
          操作二
        </a>
      </li>
    </ul>
  );

  return (
    <div class="space-y-6">
      <Title level={1}>Dropdown</Title>
      <Paragraph>
        下拉菜单：children、overlay、open、defaultOpen、onOpenChange、trigger、hoverOpenDelay、hoverCloseDelay、placement、disabled、overlayClass、overlayId。
      </Paragraph>

      <Dropdown
        open={open()}
        onOpenChange={setOpen}
        overlay={overlay}
        trigger="click"
        placement="bottomLeft"
      >
        <Button variant="default">点击展开</Button>
      </Dropdown>

      <Dropdown
        open={openHover()}
        onOpenChange={setOpenHover}
        overlay={overlay}
        trigger="hover"
        placement="bottom"
      >
        <span class="inline-block px-4 py-2 border border-slate-300 rounded cursor-pointer">
          悬停展开
        </span>
      </Dropdown>

      <Title level={2}>disabled</Title>
      <Dropdown overlay={overlay} trigger="click" disabled>
        <Button variant="default" disabled>禁用下拉</Button>
      </Dropdown>
    </div>
  );
}
