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
          单行输入：size、placeholder、value、type、readOnly、required、error、disabled、prefix、suffix、allowClear、onInput、onChange、name、id。
        </Paragraph>
      </div>

      <Form layout="vertical" class="max-w-md space-y-6">
        {/* 传 value 为 getter（如 valPlaceholder），View applyProps 会对 value 为 getter 时 createEffect 只更新 .value，不替换节点，光标不丢 */}
        <section class="space-y-4">
          <Title level={2}>基础</Title>
          <FormItem label="placeholder" id="input-placeholder">
            <Input
              id="input-placeholder"
              value={valPlaceholder}
              onInput={(e) =>
                setValPlaceholder((e.target as HTMLInputElement).value)}
              placeholder="请输入"
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>required</Title>
          <FormItem label="必填" required id="input-required">
            <Input
              id="input-required"
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
          <FormItem label="错误状态" error="请输入有效内容" id="input-error">
            <Input
              id="input-error"
              value={valError}
              onInput={(e) => setValError((e.target as HTMLInputElement).value)}
              placeholder="错误时红框"
              error
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>readOnly</Title>
          <FormItem label="只读" id="input-readonly">
            <Input id="input-readonly" value={readOnlyVal} readOnly />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>disabled</Title>
          <FormItem label="禁用" id="input-disabled">
            <Input
              id="input-disabled"
              placeholder="禁用不可编辑"
              disabled
              value=""
            />
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
              <Title
                level={3}
                class="text-sm! font-medium! mb-3! text-slate-600 dark:text-slate-400"
              >
                左对齐
              </Title>
              <div class="space-y-0">
                <FormItem
                  label="姓名"
                  labelPosition="left"
                  labelAlign="left"
                  id="left-name"
                >
                  <Input
                    id="left-name"
                    value={valLeft1}
                    onInput={(e) =>
                      setValLeft1((e.target as HTMLInputElement).value)}
                    placeholder="请输入姓名"
                  />
                </FormItem>
                <FormItem
                  label="手机号"
                  labelPosition="left"
                  labelAlign="left"
                  id="left-phone"
                >
                  <Input
                    id="left-phone"
                    value={valLeft2}
                    onInput={(e) =>
                      setValLeft2((e.target as HTMLInputElement).value)}
                    placeholder="请输入手机号"
                  />
                </FormItem>
                <FormItem
                  label="邮箱"
                  required
                  labelPosition="left"
                  labelAlign="left"
                  id="left-email"
                >
                  <Input
                    id="left-email"
                    value={valLeft3}
                    onInput={(e) =>
                      setValLeft3((e.target as HTMLInputElement).value)}
                    placeholder="必填"
                  />
                </FormItem>
              </div>
            </div>
            <div class="pt-2 border-t border-slate-200 dark:border-slate-600">
              <Title
                level={3}
                class="text-sm! font-medium! mb-3! text-slate-600 dark:text-slate-400"
              >
                右对齐
              </Title>
              <div class="space-y-0">
                <FormItem
                  label="姓名"
                  labelPosition="left"
                  labelAlign="right"
                  id="right-name"
                >
                  <Input
                    id="right-name"
                    value={valRight1}
                    onInput={(e) =>
                      setValRight1((e.target as HTMLInputElement).value)}
                    placeholder="请输入姓名"
                  />
                </FormItem>
                <FormItem
                  label="手机号"
                  labelPosition="left"
                  labelAlign="right"
                  id="right-phone"
                >
                  <Input
                    id="right-phone"
                    value={valRight2}
                    onInput={(e) =>
                      setValRight2((e.target as HTMLInputElement).value)}
                    placeholder="请输入手机号"
                  />
                </FormItem>
                <FormItem
                  label="邮箱"
                  required
                  labelPosition="left"
                  labelAlign="right"
                  id="right-email"
                >
                  <Input
                    id="right-email"
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
          <Title level={2}>type / prefix / suffix</Title>
          <FormItem label="type=email" id="input-email">
            <Input
              id="input-email"
              type="email"
              placeholder="user@example.com"
              value=""
            />
          </FormItem>
          <FormItem label="前缀 prefix" id="input-prefix">
            <Input
              id="input-prefix"
              prefix={<span class="text-slate-500 dark:text-slate-400">https://</span>}
              placeholder="域名"
              value=""
            />
          </FormItem>
          <FormItem label="后缀 suffix" id="input-suffix">
            <Input
              id="input-suffix"
              suffix={<span class="text-slate-500 dark:text-slate-400">.com</span>}
              placeholder="名称"
              value=""
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>size</Title>
          <FormItem label="xs" id="size-xs">
            <Input id="size-xs" size="xs" placeholder="xs" value="" />
          </FormItem>
          <FormItem label="sm" id="size-sm">
            <Input id="size-sm" size="sm" placeholder="sm" value="" />
          </FormItem>
          <FormItem label="md（默认）" id="size-md">
            <Input id="size-md" size="md" placeholder="md" value="" />
          </FormItem>
          <FormItem label="lg" id="size-lg">
            <Input id="size-lg" size="lg" placeholder="lg" value="" />
          </FormItem>
        </section>
      </Form>
    </div>
  );
}
