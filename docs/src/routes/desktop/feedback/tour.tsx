/**
 * Tour 文档页。路由: /desktop/feedback/tour
 */

import { createSignal } from "@dreamer/view";
import { Button, Paragraph, Title } from "@dreamer/ui-view/basic";
import { CodeBlock } from "@dreamer/ui-view/data-display";
import { Tour } from "@dreamer/ui-view/feedback";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MESSAGES_TOUR } from "../../../data/component-messages-rows.ts";
import { DOCS_DEMO_CODE_MAX_HEIGHT } from "../../../components/DocsDemo.tsx";

const API: DocsApiTableRow[] = [
  {
    name: "open",
    type: "ControlledOpenInput",
    default: "-",
    description: "是否打开（传 Signal）",
  },
  {
    name: "steps",
    type: "TourStep[]",
    default: "-",
    description:
      "步骤（title／description／target／placement）。placement 含 auto：优选下方，边挡住则朝相反方向展开。",
  },
  {
    name: "current",
    type: "MaybeSignal<number>",
    default: "-",
    description: "受控当前步；不传则内部步进",
  },
  {
    name: "onCurrentChange",
    type: "(index) => void",
    default: "-",
    description: "步变化",
  },
  {
    name: "onClose",
    type: "() => void",
    default: "-",
    description: "关闭／跳过",
  },
  { name: "onFinish", type: "() => void", default: "-", description: "完成" },
  {
    name: "showSkip",
    type: "boolean",
    default: "true",
    description: "显示跳过",
  },
  {
    name: "keyboard",
    type: "boolean",
    default: "true",
    description: "Esc 关闭",
  },
  {
    name: "messages",
    type: "Partial<TourMessages>",
    default: "-",
    description: "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
  },
];

const importCode = `import { createSignal } from "@dreamer/view";
const open = createSignal(false);

<Tour
  open={open}
  steps={[
    { title: "欢迎", description: "高亮左侧目标", target: "#tour-demo-a", placement: "bottom" },
    { title: "继续", description: "高亮右侧目标", target: "#tour-demo-b", placement: "bottom" },
  ]}
  onClose={() => (open.value = false)}
  onFinish={() => (open.value = false)}
/>`;

const stepsBasic = [
  {
    title: "欢迎",
    description: "这是第一步：高亮左侧目标。",
    target: "#tour-demo-a",
    placement: "bottom" as const,
  },
  {
    title: "继续",
    description: "第二步：高亮右侧目标。",
    target: "#tour-demo-b",
    placement: "bottom" as const,
  },
];

const stepsPlace = [
  {
    title: "上方",
    description: "placement=top",
    target: "#tour-place-target",
    placement: "top" as const,
  },
  {
    title: "右侧",
    description: "placement=right",
    target: "#tour-place-target",
    placement: "right" as const,
  },
];

const exampleBasic = `const open = createSignal(false);

<Button type="button" onClick={() => (open.value = true)}>开始引导</Button>
<Tour
  open={open}
  steps={[
    { title: "欢迎", description: "第一步", target: "#tour-demo-a", placement: "bottom" },
    { title: "继续", description: "第二步", target: "#tour-demo-b", placement: "bottom" },
  ]}
  onClose={() => (open.value = false)}
  onFinish={() => (open.value = false)}
/>`;

const exampleCtrl = `const openControlled = createSignal(false);
const current = createSignal(0);

<Button type="button" size="sm" onClick={() => { current.value = 0; openControlled.value = true; }}>
  打开受控引导
</Button>
<Tour
  open={openControlled}
  current={current}
  onCurrentChange={(i) => (current.value = i)}
  steps={[
    { title: "受控 1", description: "current 由外部 signal", target: "#tour-ctrl-a", placement: "bottom" },
    { title: "受控 2", description: "下一步会写回 current", target: "#tour-ctrl-b", placement: "bottom" },
  ]}
  onClose={() => (openControlled.value = false)}
  onFinish={() => (openControlled.value = false)}
/>`;

const exampleNoSkip = `const openNoSkip = createSignal(false);

<Tour
  open={openNoSkip}
  showSkip={false}
  steps={[{ title: "唯一", description: "无跳过按钮", target: "#tour-noskip", placement: "bottom" }]}
  onClose={() => (openNoSkip.value = false)}
  onFinish={() => (openNoSkip.value = false)}
/>`;

const examplePlace = `const openPlace = createSignal(false);

<Tour open={openPlace} steps={stepsPlace} onClose={() => (openPlace.value = false)} onFinish={() => (openPlace.value = false)} />
{/* stepsPlace 含 top / bottom / left / right 等 placement */}`;

const exampleAuto = `<div class="flex justify-end">
  <div id="tour-auto-right" class="rounded-lg border border-dashed px-4 py-3">靠右目标</div>
</div>
<Button onClick={() => (openAuto.value = true)}>开始贴边引导</Button>
<Tour
  open={openAuto}
  steps={[
    {
      title: "贴边翻转",
      description: "目标在视口最右侧，placement=auto，右边被挡时气泡向左展开。",
      target: "#tour-auto-right",
      placement: "auto",
    },
  ]}
  onClose={() => (openAuto.value = false)}
  onFinish={() => (openAuto.value = false)}
/>`;

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
export const metadata = {
  title: "Tour · ui-view",
};

export default function Page() {
  const open = createSignal(false);
  const openControlled = createSignal(false);
  const current = createSignal(0);
  const openNoSkip = createSignal(false);
  const openPlace = createSignal(false);
  const openAuto = createSignal(false);

  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Tour</Title>
        <Paragraph>
          分步漫游：spotlight 高亮 target。不传 current
          时内部步进（「下一步」可用）；也可受控
          current。开始后触发钮隐藏，避免叠穿气泡。步骤 placement 可传
          auto，贴边时自动翻转到有空间的一侧。
        </Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock
          code={importCode}
          language="tsx"
          maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
        />
      </section>
      <section class="space-y-6">
        <Title level={2}>示例</Title>

        <div class="space-y-2">
          <Title level={3}>基础（非受控步进）</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 space-y-4">
            <div class="flex gap-4">
              <div
                id="tour-demo-a"
                class="rounded-lg border border-dashed px-4 py-6 text-sm"
              >
                目标 A
              </div>
              <div
                id="tour-demo-b"
                class="rounded-lg border border-dashed px-4 py-6 text-sm"
              >
                目标 B
              </div>
            </div>
            {() =>
              !open.value
                ? (
                  <div data-tour-trigger="start">
                    <Button type="button" onClick={() => (open.value = true)}>
                      开始引导
                    </Button>
                  </div>
                )
                : (
                  <div
                    class="h-9"
                    aria-hidden="true"
                    data-tour-trigger="placeholder"
                  />
                )}
            <Tour
              open={open}
              steps={stepsBasic}
              onClose={() => (open.value = false)}
              onFinish={() => (open.value = false)}
            />
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleBasic}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>

        <div class="space-y-2">
          <Title level={3}>受控 current</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 space-y-3">
            <div class="flex gap-4">
              <div
                id="tour-ctrl-a"
                class="rounded-lg border border-dashed px-3 py-4 text-sm"
              >
                A
              </div>
              <div
                id="tour-ctrl-b"
                class="rounded-lg border border-dashed px-3 py-4 text-sm"
              >
                B
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                current.value = 0;
                openControlled.value = true;
              }}
            >
              打开受控引导
            </Button>
            {() => (
              <p class="text-xs text-slate-500">
                当前步 index：{current.value}
              </p>
            )}
            <Tour
              open={openControlled}
              current={current}
              onCurrentChange={(i) => (current.value = i)}
              steps={[
                {
                  title: "受控 1",
                  description: "current 由外部 signal",
                  target: "#tour-ctrl-a",
                  placement: "bottom",
                },
                {
                  title: "受控 2",
                  description: "下一步会写回 current",
                  target: "#tour-ctrl-b",
                  placement: "bottom",
                },
              ]}
              onClose={() => (openControlled.value = false)}
              onFinish={() => (openControlled.value = false)}
            />
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleCtrl}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>

        <div class="space-y-2">
          <Title level={3}>隐藏跳过 showSkip=false</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 space-y-3">
            <div
              id="tour-noskip"
              class="rounded-lg border border-dashed px-3 py-4 text-sm inline-block"
            >
              目标
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => (openNoSkip.value = true)}
            >
              无跳过引导
            </Button>
            <Tour
              open={openNoSkip}
              showSkip={false}
              steps={[
                {
                  title: "唯一",
                  description: "无跳过按钮",
                  target: "#tour-noskip",
                  placement: "bottom",
                },
              ]}
              onClose={() => (openNoSkip.value = false)}
              onFinish={() => (openNoSkip.value = false)}
            />
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleNoSkip}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>

        <div class="space-y-2">
          <Title level={3}>placement 方位</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 space-y-3">
            <div class="flex justify-center py-10">
              <div
                id="tour-place-target"
                class="rounded-lg border border-dashed px-4 py-6 text-sm"
              >
                中心目标
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => (openPlace.value = true)}
            >
              多方位引导
            </Button>
            <Tour
              open={openPlace}
              steps={stepsPlace}
              onClose={() => (openPlace.value = false)}
              onFinish={() => (openPlace.value = false)}
            />
          </div>
          <CodeBlock
            title="代码示例"
            code={examplePlace}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>
        <div class="space-y-2" data-demo="auto-flip-right">
          <Title level={3}>贴边自动翻转（placement=auto）</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            引导目标贴在视口最右侧。步骤使用{" "}
            <code class="text-xs">placement=&quot;auto&quot;</code>
            ，右边被挡时气泡向左展开。
          </Paragraph>
          <div class="-mr-3 sm:-mr-6 lg:-mr-10 pr-2">
            <div class="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/40 px-3 py-3 space-y-3">
              <div class="flex justify-end">
                <div
                  id="tour-auto-right"
                  data-demo-trigger="tour-auto-right"
                  class="rounded-lg border border-dashed border-slate-400 dark:border-slate-500 px-4 py-3 text-sm bg-white dark:bg-slate-900"
                >
                  靠右目标
                </div>
              </div>
              <div class="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  data-demo-trigger="tour-auto-start"
                  onClick={() => (openAuto.value = true)}
                >
                  开始贴边引导
                </Button>
              </div>
              <Tour
                open={openAuto}
                steps={[
                  {
                    title: "贴边翻转",
                    description:
                      "目标在视口最右侧，placement=auto，右边被挡时气泡向左展开。",
                    target: "#tour-auto-right",
                    placement: "auto",
                  },
                ]}
                onClose={() => (openAuto.value = false)}
                onFinish={() => (openAuto.value = false)}
              />
            </div>
          </div>
          <CodeBlock
            title="代码示例（靠右目标，auto 向左展开）"
            code={exampleAuto}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>
      </section>
      <DocsMessagesSection
        interfaceName="TourMessages"
        defaultExportName="defaultTourMessages"
        rows={MESSAGES_TOUR}
      />

      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
