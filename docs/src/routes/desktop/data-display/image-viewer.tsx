/**
 * 路由: /data-display/image-viewer
 * 图片查看器：多图切换、缩放、旋转、缩略图、键盘。
 */

import { Button, ImageViewer, Paragraph, Title } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

/** 10 张测试图（Picsum Photos，稳定可访问） */
const DEMO_IMAGES = [
  "https://picsum.photos/id/1/800/600",
  "https://picsum.photos/id/10/800/600",
  "https://picsum.photos/id/100/800/600",
  "https://picsum.photos/id/1000/800/600",
  "https://picsum.photos/id/1001/800/600",
  "https://picsum.photos/id/1002/800/600",
  "https://picsum.photos/id/1003/800/600",
  "https://picsum.photos/id/1004/800/600",
  "https://picsum.photos/id/1005/800/600",
  "https://picsum.photos/id/1015/800/600",
];

export default function DataDisplayImageViewer() {
  const [open, setOpen] = createSignal(false);
  const [index, setIndex] = createSignal(0);

  return () => (
    <div class="space-y-6">
      <Title level={1}>ImageViewer</Title>
      <Paragraph>
        图片查看器：全屏遮罩内大图查看，支持多图切换、缩放、旋转、底部缩略图；Esc
        关闭，左右键切换图片。
      </Paragraph>

      <div class="flex flex-wrap gap-3">
        {DEMO_IMAGES.map((src, i) => (
          <button
            type="button"
            key={src}
            class="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 hover:ring-2 hover:ring-teal-500 transition-shadow"
            onClick={() => {
              setIndex(i);
              setOpen(true);
            }}
          >
            <img
              src={src}
              alt={`预览 ${i + 1}`}
              class="w-24 h-24 object-cover block"
            />
          </button>
        ))}
      </div>

      <Paragraph class="text-slate-500 dark:text-slate-400 text-sm">
        点击上方缩略图打开查看器，或点击按钮从第一张开始。
      </Paragraph>
      <Button
        onClick={() => {
          setIndex(0);
          setOpen(true);
        }}
      >
        打开查看器（10 张图）
      </Button>

      <ImageViewer
        open={open()}
        onClose={() => setOpen(false)}
        images={DEMO_IMAGES}
        currentIndex={index()}
        onIndexChange={setIndex}
        maskClosable
        keyboard
        showThumbnails
      />
    </div>
  );
}
