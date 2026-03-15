/**
 * 表单 - Input（展示全部用法）
 * 路由: /form/input
 */

import { Form, FormItem, Input, Paragraph, Title } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

export default function FormInput() {
  // 三个可编辑输入各自独立 signal，避免共用导致同值且避免整块重建导致失焦
  const [valPlaceholder, setValPlaceholder] = createSignal("");
  const [valRequired, setValRequired] = createSignal("");
  const [valError, setValError] = createSignal("");
  const [readOnlyVal] = createSignal("只读内容");
  const [valLeft1, setValLeft1] = createSignal("");
  const [valLeft2, setValLeft2] = createSignal("");
  const [valLeft3, setValLeft3] = createSignal("");
  const [valRight1, setValRight1] = createSignal("");
  const [valRight2, setValRight2] = createSignal("");
  const [valRight3, setValRight3] = createSignal("");
  const [valClear, setValClear] = createSignal("");

  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Input</Title>
        <Paragraph>
          单行输入：placeholder、required、error、readOnly、disabled、size
          等全部用法展示。
        </Paragraph>
      </div>

      <Form layout="vertical" class="max-w-md space-y-6">
        {/* 传 value 为 getter（如 valPlaceholder），View applyProps 会对 value 为 getter 时 createEffect 只更新 .value，不替换节点，光标不丢 */}
        <section class="space-y-4">
          <Title level={2}>基础</Title>
          <FormItem label="placeholder">
            <Input
              value={valPlaceholder}
              onInput={(e) =>
                setValPlaceholder((e.target as HTMLInputElement).value)}
              placeholder="请输入"
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>required</Title>
          <FormItem label="必填" required>
            <Input
              value={valRequired}
              onInput={(e) =>
                setValRequired((e.target as HTMLInputElement).value)}
              placeholder="必填项"
              required
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>error</Title>
          <FormItem label="错误状态" error="请输入有效内容">
            <Input
              value={valError}
              onInput={(e) => setValError((e.target as HTMLInputElement).value)}
              placeholder="错误时红框"
              error
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>readOnly</Title>
          <FormItem label="只读">
            <Input value={readOnlyVal} readOnly />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>disabled</Title>
          <FormItem label="禁用">
            <Input placeholder="禁用不可编辑" disabled value="" />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>可清除</Title>
          <FormItem label="输入后右侧显示 X，点击可清空">
            <Input
              value={valClear}
              onInput={(e) => setValClear((e.target as HTMLInputElement).value)}
              placeholder="输入内容后出现清除按钮"
              allowClear
            />
          </FormItem>
        </section>

        <section class="space-y-6">
          <Title level={2}>标签在左侧</Title>
          <div class="rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/30 p-5 space-y-6">
            <div>
              <Title level={3} class="text-sm! font-medium! mb-3! text-slate-600 dark:text-slate-400">
                左对齐
              </Title>
              <div class="space-y-0">
                <FormItem label="姓名" labelPosition="left" labelAlign="left">
                  <Input
                    value={valLeft1}
                    onInput={(e) =>
                      setValLeft1((e.target as HTMLInputElement).value)}
                    placeholder="请输入姓名"
                  />
                </FormItem>
                <FormItem label="手机号" labelPosition="left" labelAlign="left">
                  <Input
                    value={valLeft2}
                    onInput={(e) =>
                      setValLeft2((e.target as HTMLInputElement).value)}
                    placeholder="请输入手机号"
                  />
                </FormItem>
                <FormItem label="邮箱" required labelPosition="left" labelAlign="left">
                  <Input
                    value={valLeft3}
                    onInput={(e) =>
                      setValLeft3((e.target as HTMLInputElement).value)}
                    placeholder="必填"
                  />
                </FormItem>
              </div>
            </div>
            <div class="pt-2 border-t border-slate-200 dark:border-slate-600">
              <Title level={3} class="text-sm! font-medium! mb-3! text-slate-600 dark:text-slate-400">
                右对齐
              </Title>
              <div class="space-y-0">
                <FormItem label="姓名" labelPosition="left" labelAlign="right">
                  <Input
                    value={valRight1}
                    onInput={(e) =>
                      setValRight1((e.target as HTMLInputElement).value)}
                    placeholder="请输入姓名"
                  />
                </FormItem>
                <FormItem label="手机号" labelPosition="left" labelAlign="right">
                  <Input
                    value={valRight2}
                    onInput={(e) =>
                      setValRight2((e.target as HTMLInputElement).value)}
                    placeholder="请输入手机号"
                  />
                </FormItem>
                <FormItem label="邮箱" required labelPosition="left" labelAlign="right">
                  <Input
                    value={valRight3}
                    onInput={(e) =>
                      setValRight3((e.target as HTMLInputElement).value)}
                    placeholder="必填"
                  />
                </FormItem>
              </div>
            </div>
          </div>
        </section>

        <section class="space-y-4">
          <Title level={2}>size</Title>
          <FormItem label="xs">
            <Input size="xs" placeholder="xs" value="" />
          </FormItem>
          <FormItem label="sm">
            <Input size="sm" placeholder="sm" value="" />
          </FormItem>
          <FormItem label="md（默认）">
            <Input size="md" placeholder="md" value="" />
          </FormItem>
          <FormItem label="lg">
            <Input size="lg" placeholder="lg" value="" />
          </FormItem>
        </section>
      </Form>
    </div>
  );
}
