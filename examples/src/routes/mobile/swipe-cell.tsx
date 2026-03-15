/** 路由: /mobile/swipe-cell */
import { Paragraph, SwipeCell, Title } from "@dreamer/ui-view";

export default function MobileSwipeCell() {
  return (
    <div class="space-y-6">
      <Title level={1}>SwipeCell</Title>
      <Paragraph>左滑/右滑露出操作按钮，常用于列表项删除、更多。</Paragraph>

      <div class="space-y-3">
        <SwipeCell
          rightActions={[
            { text: "删除", style: "danger", onClick: () => console.log("删除") },
            { text: "更多", style: "default", onClick: () => console.log("更多") },
          ]}
        >
          <div class="px-4 py-3 text-sm">右滑显示删除/更多</div>
        </SwipeCell>

        <SwipeCell
          leftActions={[
            { text: "置顶", style: "primary", onClick: () => console.log("置顶") },
          ]}
          rightActions={[
            { text: "删除", style: "danger", onClick: () => console.log("删") },
          ]}
        >
          <div class="px-4 py-3 text-sm">左滑置顶，右滑删除</div>
        </SwipeCell>
      </div>
    </div>
  );
}
