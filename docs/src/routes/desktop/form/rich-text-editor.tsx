/**
 * 表单 - RichTextEditor 富文本（展示全部用法）
 * 路由: /form/rich-text-editor
 */

import {
  Form,
  FormItem,
  Paragraph,
  RichTextEditor,
  Title,
} from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

export default function FormRichTextEditor() {
  const [val, setVal] = createSignal("<p>初始内容</p>");
  const [valSimple, setValSimple] = createSignal("");
  const [valFull, setValFull] = createSignal("");

  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>RichTextEditor</Title>
        <Paragraph>
          富文本编辑器：toolbarPreset（simple/default/full）、placeholder、readOnly、disabled、minHeight、插入/上传/粘贴图片等全部用法。
        </Paragraph>
      </div>

      <Form layout="vertical" class="max-w-4xl space-y-6">
        <section class="space-y-4">
          <Title level={2}>toolbarPreset：default</Title>
          <FormItem label="默认工具栏">
            <RichTextEditor
              value={val}
              onChange={(html) => setVal(html)}
              toolbarPreset="default"
              placeholder="输入内容…"
              minHeight="200px"
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>toolbarPreset：simple</Title>
          <FormItem label="简单工具栏（撤销/重做/加粗/斜体/下划线/链接）">
            <RichTextEditor
              value={valSimple}
              onChange={(html) => setValSimple(html)}
              toolbarPreset="simple"
              placeholder="简单模式"
              minHeight="160px"
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>toolbarPreset：full</Title>
          <FormItem label="完整工具栏（含表格、代码块、图片等）">
            <RichTextEditor
              value={valFull}
              onChange={(html) => setValFull(html)}
              toolbarPreset="full"
              placeholder="完整模式"
              minHeight="240px"
              onInsertImage={() => {
                const url = globalThis.prompt?.("输入图片 URL");
                return url ?? "";
              }}
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>readOnly / disabled</Title>
          <FormItem label="只读">
            <RichTextEditor
              value="<p>只读内容，不可编辑</p>"
              readOnly
              toolbarPreset="simple"
              minHeight="120px"
            />
          </FormItem>
          <FormItem label="禁用">
            <RichTextEditor
              value="<p>禁用</p>"
              disabled
              toolbarPreset="simple"
              minHeight="120px"
            />
          </FormItem>
        </section>
      </Form>
    </div>
  );
}
