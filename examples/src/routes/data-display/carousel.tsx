/** 路由: /data-display/carousel */
import { createSignal } from "@dreamer/view";
import { Carousel, Paragraph, Title } from "@dreamer/ui-view";

export default function DataDisplayCarousel() {
  const [current, setCurrent] = createSignal(0);

  const slides = [
    <div class="h-48 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-lg">
      幻灯片 1
    </div>,
    <div class="h-48 flex items-center justify-center bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg">
      幻灯片 2
    </div>,
    <div class="h-48 flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-lg">
      幻灯片 3
    </div>,
  ];

  return (
    <div class="space-y-6">
      <Title level={1}>Carousel</Title>
      <Paragraph>轮播图：自动播放、指示点、箭头、一屏多图、循环。</Paragraph>
      <div class="max-w-xl">
        <Carousel
          current={current()}
          onChange={setCurrent}
          dots
          arrows
        >
          {slides}
        </Carousel>
      </div>
    </div>
  );
}
