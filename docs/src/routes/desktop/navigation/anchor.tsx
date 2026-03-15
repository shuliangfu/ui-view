/** 路由: /navigation/anchor */
import { createSignal } from "@dreamer/view";
import { Anchor, Paragraph, Title } from "@dreamer/ui-view";

export default function NavigationAnchor() {
  const [activeKey, setActiveKey] = createSignal("section1");

  const links = [
    { key: "section1", href: "#section1", title: "第一节" },
    { key: "section2", href: "#section2", title: "第二节" },
    { key: "section3", href: "#section3", title: "第三节" },
  ];

  return (
    <div class="flex gap-8">
      <aside class="w-40 shrink-0">
        <Title level={2} class="text-base mb-2">Anchor</Title>
        <Paragraph class="text-xs mb-4">
          锚点导航，点击平滑滚动；可配合 initAnchorSpy 做滚动高亮。
        </Paragraph>
        <Anchor
          links={links}
          activeKey={activeKey()}
          onChange={setActiveKey}
        />
      </aside>
      <div class="flex-1 space-y-12">
        <section id="section1" class="pt-4">
          <h3 class="text-lg font-medium">第一节</h3>
          <p class="text-sm text-slate-600 dark:text-slate-400 mt-2">
            内容区域一。锚点链接会滚动到此。
          </p>
        </section>
        <section id="section2" class="pt-4">
          <h3 class="text-lg font-medium">第二节</h3>
          <p class="text-sm text-slate-600 dark:text-slate-400 mt-2">
            内容区域二。
          </p>
        </section>
        <section id="section3" class="pt-4">
          <h3 class="text-lg font-medium">第三节</h3>
          <p class="text-sm text-slate-600 dark:text-slate-400 mt-2">
            内容区域三。
          </p>
        </section>
      </div>
    </div>
  );
}
