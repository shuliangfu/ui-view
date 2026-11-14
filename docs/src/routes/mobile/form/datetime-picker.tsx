/**
 * DateTimePicker（移动版）文档页（概述、引入、示例、API）。路由: /mobile/form/datetime-picker
 */

import { DateTimePicker } from "@dreamer/ui-view/mobile/form/datetime-picker";
import { Form } from "@dreamer/ui-view/mobile/form/form";
import { FormItem } from "@dreamer/ui-view/mobile/form/form-item";
import { Button, Link, Paragraph, Title } from "@dreamer/ui-view/mobile/basic";
import { CodeBlock } from "@dreamer/ui-view/mobile/data-display";
import { createForm } from "@dreamer/ui-view/form/create-form";
import { formRules } from "@dreamer/ui-view/form/form-rules";
import { message } from "@dreamer/ui-view/feedback";
import { createSignal } from "@dreamer/view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";
import {
  MESSAGES_DATETIME_PICKER,
  MESSAGES_PICKER_CALENDAR_NAV,
} from "../../../data/component-messages-rows.ts";
import { DOCS_DEMO_CODE_MAX_HEIGHT } from "../../../components/DocsDemo.tsx";


/** createForm 演示字段 */
type DateTimePickerCreateFormValues = { when: string };

/** 与 createForm 联用演示 store */
const dateTimePickerCreateForm = createForm<DateTimePickerCreateFormValues>({
  initialValues: { when: "" },
  fields: {
    when: { rules: [formRules.required("请选择日期时间")] },
  },
});

/**
 * 当前本地日期时间，默认 format 形态。
 *
 * @returns 形如 YYYY-MM-DD HH:mm
 */
function localNowDateTime(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

const DATETIME_API: DocsApiTableRow[] = [
  {
    name: "mode",
    type: `"single" | "range" | "multiple"`,
    default: "single",
    description: "单点 / 区间 / 多点；时间与日期段组合规则见桌面文档",
  },
  {
    name: "value",
    type: "MaybeSignal<DateTimePickerValue>",
    default: "-",
    description: "受控值，串格式由 format 决定",
  },
  {
    name: "min",
    type: "string",
    default: "-",
    description: "日期下限 YYYY-MM-DD",
  },
  {
    name: "max",
    type: "string",
    default: "-",
    description: "日期上限 YYYY-MM-DD",
  },
  {
    name: "size",
    type: "SizeVariant",
    default: "md",
    description: "触发器尺寸",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "禁用",
  },
  {
    name: "hideFocusRing",
    type: "boolean",
    default: "false",
    description: "隐藏聚焦 ring",
  },
  {
    name: "placeholder",
    type: "string",
    default: `"请选择日期时间"`,
    description: "占位",
  },
  {
    name: "format",
    type: "string",
    default: "YYYY-MM-DD HH:mm",
    description: "日期段 + 时间段占位，见桌面 DateTimePicker 说明",
  },
  {
    name: "panelAttach",
    type: `"anchored" | "viewport"`,
    default: "anchored",
    description: "浮层锚定方式，同 DatePicker",
  },
  { name: "class", type: "string", default: "-", description: "根 class" },
  {
    name: "onChange",
    type: "(e: Event) => void",
    default: "-",
    description: "变更回调",
  },
  { name: "name", type: "string", default: "-", description: "隐藏域 name" },
  { name: "id", type: "string", default: "-", description: "根 id" },
  {
    name: "messages",
    type: "Partial<DateTimePickerMessages>",
    default: "-",
    description: "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
  },
];

const importCode =
  `import { DateTimePicker } from "@dreamer/ui-view/mobile/form/datetime-picker";
import { createSignal } from "@dreamer/view";

const val = createSignal(localNowDateTime());

<DateTimePicker value={val} class="w-full" />`;

/** 文档页受控值须模块级 */
const mobileDateTimePickerVal = createSignal(localNowDateTime());

const exampleNestedMessages = `<DateTimePicker
  messages={{
    calendarNav: { /* PickerCalendarNavMessages */ },
  }}
/>`;

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
export const metadata = {
  title: "DateTimePicker 日期时间（移动） · ui-view",
};

export default function MobileDateTimePickerDoc() {
  return (
    <div class="w-full max-w-3xl space-y-10">
      <section>
        <Title level={1}>DateTimePicker 日期时间（移动）</Title>
        <Paragraph class="mt-2">
          日历 + 时分（及 format 允许的秒等）组合选择，与桌面共用实现；移动端从
          {" "}
          <code class="text-sm">@dreamer/ui-view/mobile</code>{" "}
          导入即可与同页表单一致。与{" "}
          <Link
            href="/mobile/form/form-containers"
            className="text-teal-600 hover:underline dark:text-teal-400"
          >
            Form / createForm（移动）
          </Link>
          、
          <Link
            href="/desktop/form/form-containers"
            className="text-teal-600 hover:underline dark:text-teal-400"
          >
            桌面 Form 容器
          </Link>{" "}
          联用：展开{" "}
          <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">
            {"{...form.bind(name)}"}
          </code>
          。
        </Paragraph>
      </section>

      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock
          title="代码示例"
          code={importCode}
          language="tsx"
          showLineNumbers
          wrapLongLines
          maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
        />
      </section>

      <section class="space-y-8">
        <Title level={2}>示例</Title>

        <div class="space-y-4">
          <Title level={3}>与 createForm</Title>
          <MobileDocDemo>
            <Form
              form={dateTimePickerCreateForm}
              layout="vertical"
              class="w-full"
              onFinish={() => {
                message.success("已提交");
              }}
            >
              <FormItem name="when" label="日期时间">
                <DateTimePicker
                  {...dateTimePickerCreateForm.bind("when")}
                  class="w-full"
                />
              </FormItem>
              <Button type="submit" variant="primary" class="w-full">
                提交
              </Button>
            </Form>
          </MobileDocDemo>
          <CodeBlock
            title="代码示例"
            code={`import { createForm } from "@dreamer/ui-view/form/create-form";
import { formRules } from "@dreamer/ui-view/form/form-rules";
import { Form } from "@dreamer/ui-view/mobile/form/form";
import { FormItem } from "@dreamer/ui-view/mobile/form/form-item";
import { DateTimePicker } from "@dreamer/ui-view/mobile/form/datetime-picker";

const form = createForm({
  initialValues: { when: "" },
  fields: { when: { rules: [formRules.required()] } },
});

<Form form={form} onFinish={() => { message.success("已提交"); }}>
  <FormItem name="when" label="日期时间">
    <DateTimePicker {...form.bind("when")} />
  </FormItem>
</Form>`}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>基础</Title>
          <MobileDocDemo>
            <DateTimePicker value={mobileDateTimePickerVal} class="w-full" />
          </MobileDocDemo>
          <CodeBlock
            title="代码示例"
            code={importCode}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>
        <div class="space-y-4">
          <Title level={3}>size（xs / sm / md / lg）</Title>
          <MobileDocDemo>
            <div class="flex flex-col gap-3 p-2">
              <DateTimePicker size="xs" class="w-full" placeholder="xs" />
              <DateTimePicker size="sm" class="w-full" placeholder="sm" />
              <DateTimePicker size="md" class="w-full" placeholder="md" />
              <DateTimePicker size="lg" class="w-full" placeholder="lg" />
            </div>
          </MobileDocDemo>
          <CodeBlock
            title="代码示例"
            code={`<DateTimePicker size="xs" placeholder="xs" />
<DateTimePicker size="sm" placeholder="sm" />
<DateTimePicker size="md" placeholder="md" />
<DateTimePicker size="lg" placeholder="lg" />`}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>
      </section>

      <DocsMessagesSection
        interfaceName="DateTimePickerMessages"
        defaultExportName="defaultDateTimePickerMessages"
        rows={MESSAGES_DATETIME_PICKER}
      />

      <section class="space-y-3">
        <Title level={3}>嵌套：PickerCalendarNavMessages</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          通过{" "}
          <code class="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">
            messages.calendarNav
          </code>{" "}
          传入；与桌面 DateTimePicker 文档一致。
        </Paragraph>
        <DocsApiTable
          rows={MESSAGES_PICKER_CALENDAR_NAV}
          nameColumnHeader="字段"
        />
      </section>

      <section class="space-y-4">
        <CodeBlock
          title="代码示例"
          code={exampleNestedMessages}
          language="tsx"
          showLineNumbers
          copyable
          wrapLongLines
          maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
        />

        <Title level={2}>API</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          完整 mode/format 组合与桌面 DateTimePicker 文档一致。
        </Paragraph>
        <DocsApiTable rows={DATETIME_API} />
      </section>
    </div>
  );
}
