/**
 * 表单 - Textarea（展示全部用法）
 * 路由: /form/textarea
 */

import { Form, FormItem, Paragraph, Textarea, Title } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

export default function FormTextarea() {
  const [valBase, setValBase] = createSignal("");
  const [valMaxLength, setValMaxLength] = createSignal("");
  const [valError, setValError] = createSignal("");
  const [readOnlyVal] = createSignal("只读多行内容");

  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Textarea</Title>
        <Paragraph>
          多行输入：value、onInput、onChange、rows、maxLength、readOnly、required、error、disabled、name、id。
        </Paragraph>
      </div>

      <Form layout="vertical" class="max-w-md space-y-6">
        <section class="space-y-4">
          <Title level={2}>基础</Title>
          <FormItem label="多行">
            <Textarea
              value={valBase}
              onInput={(e) =>
                setValBase((e.target as HTMLTextAreaElement).value)}
              placeholder="多行输入"
              rows={3}
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>maxLength（展示已用/总数）</Title>
          <FormItem label="最多 200 字">
            <Textarea
              value={valMaxLength}
              onInput={(e) =>
                setValMaxLength((e.target as HTMLTextAreaElement).value)}
              placeholder="输入会显示字数"
              maxLength={200}
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>required / error</Title>
          <FormItem label="必填" required error="内容不能为空">
            <Textarea
              value={valError}
              onInput={(e) =>
                setValError((e.target as HTMLTextAreaElement).value)}
              placeholder="错误态红框"
              error
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>readOnly</Title>
          <FormItem label="只读">
            <Textarea value={readOnlyVal} readOnly rows={2} />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>disabled / rows</Title>
          <FormItem label="禁用，rows=5">
            <Textarea placeholder="禁用" disabled value="" rows={5} />
          </FormItem>
        </section>
      </Form>
    </div>
  );
}
