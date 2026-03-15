/** 路由: /data-display/comment */
import { Avatar, Comment, Paragraph, Title } from "@dreamer/ui-view";

export default function DataDisplayComment() {
  return (
    <div class="space-y-6">
      <Title level={1}>Comment</Title>
      <Paragraph>评论：作者、头像、时间、内容、操作、嵌套回复。</Paragraph>
      <Comment
        author="用户 A"
        avatar={<Avatar size="sm">A</Avatar>}
        datetime="2024-01-15 10:00"
        actions={[<span key="reply">回复</span>, <span key="like">点赞</span>]}
      >
        <p>这是一条评论内容。</p>
      </Comment>
      <Comment
        author="用户 B"
        datetime="2024-01-15 11:00"
        replies={
          <Comment author="用户 A" datetime="2024-01-15 12:00">
            <p>回复内容。</p>
          </Comment>
        }
      >
        <p>带回复的评论。</p>
      </Comment>
    </div>
  );
}
