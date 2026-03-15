/**
 * 表单 - Search（展示全部用法）
 * 路由: /form/search
 */

import { Form, FormItem, Paragraph, Search, Title } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

export default function FormSearch() {
  const [val, setVal] = createSignal("");
  const [val2, setVal2] = createSignal("");

  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Search</Title>
        <Paragraph>
          搜索框：value、onInput、onChange、onSearch、placeholder、size、disabled、name、id；传 onSearch 时显示搜索与清除按钮。
        </Paragraph>
      </div>

      <Form layout="vertical" class="max-w-md space-y-6">
        <section class="space-y-4">
          <Title level={2}>基础（带 onSearch 时显示搜索与清除）</Title>
          <FormItem label="搜索">
            <Search
              value={val}
              onInput={(e) => setVal((e.target as HTMLInputElement).value)}
              onChange={(e) => setVal((e.target as HTMLInputElement).value)}
              onSearch={(v) => {
                setVal(v);
                console.log("搜索:", v);
              }}
              placeholder="搜索…"
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>仅输入（无 onSearch，无搜索/清除按钮）</Title>
          <FormItem label="仅输入">
            <Search
              value={val2}
              onInput={(e) => setVal2((e.target as HTMLInputElement).value)}
              onChange={(e) => setVal2((e.target as HTMLInputElement).value)}
              placeholder="无搜索按钮"
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>disabled</Title>
          <FormItem label="禁用">
            <Search placeholder="禁用" disabled value="" />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>size</Title>
          <FormItem label="xs">
            <Search size="xs" placeholder="xs" value="" />
          </FormItem>
          <FormItem label="sm">
            <Search size="sm" placeholder="sm" value="" />
          </FormItem>
          <FormItem label="md">
            <Search size="md" placeholder="md" value="" />
          </FormItem>
          <FormItem label="lg">
            <Search size="lg" placeholder="lg" value="" />
          </FormItem>
        </section>
      </Form>
    </div>
  );
}
