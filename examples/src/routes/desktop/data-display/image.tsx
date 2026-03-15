/** 路由: /data-display/image */
import { Image, Paragraph, Title } from "@dreamer/ui-view";

export default function DataDisplayImage() {
  return (
    <div class="space-y-6">
      <Title level={1}>Image</Title>
      <Paragraph>图片：懒加载、占位、预览、object-fit、fallback。</Paragraph>
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
      </div>
    </div>
  );
}
