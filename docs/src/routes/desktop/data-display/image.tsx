/** 路由: /data-display/image */
import { Image, Paragraph, Title } from "@dreamer/ui-view";

export default function DataDisplayImage() {
  return (
    <div class="space-y-6">
      <Title level={1}>Image</Title>
      <Paragraph>
        图片：src、alt、width、height、fit、placeholder、fallback、lazy、preview、previewDisabled、rounded。
      </Paragraph>
      <div class="flex gap-4 flex-wrap">
        <Image
          src="https://picsum.photos/200/150"
          alt="示例图"
          width={200}
          height={150}
          fit="cover"
          rounded
          preview
        />
        <Image
          src="https://invalid-url-404"
          alt="失败"
          width={120}
          height={120}
          fallback="加载失败"
        />
        <Image
          src="https://picsum.photos/100/100"
          alt="lazy"
          width={100}
          height={100}
          lazy
          rounded="lg"
        />
      </div>
    </div>
  );
}
