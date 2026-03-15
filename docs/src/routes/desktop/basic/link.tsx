/**
 * Link 组件示例
 * 路由: /basic/link
 */

import { Link, Paragraph, Title } from "@dreamer/ui-view";

export default function BasicLink() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Link 链接</Title>
        <Paragraph>
          基于 &lt;a&gt;，支持 href、target、rel、title、class、onClick 等。
        </Paragraph>
      </div>

      <section class="space-y-4">
        <Title level={2}>默认</Title>
        <p>
          <Link href="/basic">返回基础组件</Link>
        </p>
      </section>

      <section class="space-y-4">
        <Title level={2}>新窗口 target / rel</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          新窗口打开建议加 rel="noopener noreferrer"；title 为悬停提示。
        </Paragraph>
        <p>
          <Link
            href="https://jsr.io"
            target="_blank"
            rel="noopener noreferrer"
            title="打开 JSR 官网"
          >
            JSR 新窗口打开
          </Link>
        </p>
      </section>

      <section class="space-y-4">
        <Title level={2}>自定义 class</Title>
        <p>
          <Link href="/basic" class="text-green-600 font-semibold">
            绿色加粗链接
          </Link>
        </p>
      </section>
    </div>
  );
}
