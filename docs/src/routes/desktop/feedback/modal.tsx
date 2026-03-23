/**
 * Modal 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/feedback/modal
 * 组件返回 thunk () => VNode，使 open 等 signal 的订阅发生在子 effect 内，避免根 effect 重跑导致整棵 #app 重渲染、全屏闪烁。
 */
import { createSignal } from "@dreamer/view";
import { Button, CodeBlock, Modal, Paragraph, Title } from "@dreamer/ui-view";

/** API 属性行类型 */
interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

const MODAL_API: ApiRow[] = [
  {
    name: "open",
    type: "boolean",
    default: "-",
    description: "是否打开（受控）",
  },
  {
    name: "onClose",
    type: "() => void",
    default: "-",
    description: "关闭回调",
  },
  {
    name: "title",
    type: "string | null",
    default: "-",
    description: "标题；null 不显示标题栏",
  },
  { name: "children", type: "unknown", default: "-", description: "弹层内容" },
  {
    name: "footer",
    type: "unknown",
    default: "-",
    description: "底部区域；不传则无 footer",
  },
  {
    name: "closable",
    type: "boolean",
    default: "true",
    description: "是否显示右上角关闭按钮",
  },
  {
    name: "maskClosable",
    type: "boolean",
    default: "true",
    description: "点击遮罩是否关闭",
  },
  {
    name: "width",
    type: '"xs" | "sm" | "md" | "lg" | "xl" | string | number',
    default: "sm",
    description:
      "弹层宽度：预设 xs(400px)/sm(520px)/md(640px)/lg(800px)/xl(960px)，或 CSS 字符串（如 80%）、数字（px）",
  },
  {
    name: "centered",
    type: "boolean",
    default: "true",
    description: "是否垂直居中",
  },
  {
    name: "destroyOnClose",
    type: "boolean",
    default: "false",
    description: "关闭后是否销毁子节点",
  },
  {
    name: "keyboard",
    type: "boolean",
    default: "false",
    description: "传 true 时支持按 Esc 关闭；不传则不支持 Esc",
  },
  {
    name: "draggable",
    type: "boolean",
    default: "false",
    description: "默认不拖动；传 true 时标题栏可拖动",
  },
  {
    name: "fullscreenable",
    type: "boolean",
    default: "false",
    description: "传 true 时显示全屏切换按钮；不传则不显示",
  },
  {
    name: "maskClass",
    type: "string",
    default: "-",
    description: "遮罩 class",
  },
  {
    name: "wrapClass",
    type: "string",
    default: "-",
    description: "弹层容器 class",
  },
  {
    name: "bodyClass",
    type: "string",
    default: "-",
    description: "内容区 class",
  },
  {
    name: "class",
    type: "string",
    default: "-",
    description: "弹层盒子 class",
  },
];

const importCode = `import { createSignal } from "@dreamer/view";
import { Button, Modal } from "@dreamer/ui-view";

const open = createSignal(false);

<Button variant="primary" onClick={() => open.value = true}>打开</Button>
<Modal
  open={open.value}
  onClose={() => open.value = false}
  title="弹窗标题"
  footer={<><Button onClick={() => open.value = false}>取消</Button><Button variant="primary" onClick={() => open.value = false}>确定</Button></>}
>
  <p>弹层内容</p>
</Modal>`;

export default function FeedbackModal() {
  const open = createSignal(false);
  const openNoFooter = createSignal(false);
  const openNoTitle = createSignal(false);
  const openNoClosable = createSignal(false);
  const openNoMaskClose = createSignal(false);
  const openWidth = createSignal(false);
  const openWidthPreset = createSignal(false);
  const widthPreset = createSignal<
    "xs" | "sm" | "md" | "lg" | "xl"
  >("md");
  const openNotCentered = createSignal(false);
  const openDestroy = createSignal(false);
  const openNoKeyboard = createSignal(false);
  // 用于「可移动」示例，在下方 return 的 thunk 内使用
  const openDraggable = createSignal(false);
  const openFullscreen = createSignal(false);
  const openKeyboard = createSignal(false);
  const openCustomClass = createSignal(false);

  return () => (
    <div class="space-y-10">
      <section>
        <Title level={1}>Modal 模态弹窗</Title>
        <Paragraph class="mt-2">
          模态弹窗：遮罩、标题、内容、底部；支持关闭按钮、点击遮罩关闭；传
          keyboard 可启用 Esc 关闭；自定义宽度与
          footer、居中/顶部对齐、关闭后销毁、自定义样式。使用 Tailwind v4，支持
          light/dark 主题。
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
        />
      </section>

      <section class="space-y-8">
        <Title level={2}>示例</Title>

        <div class="space-y-4">
          <Title level={3}>基础用法</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            open / onClose / title / children / footer
          </Paragraph>
          <div class="flex gap-2">
            <Button
              type="button"
              variant="primary"
              onClick={() => open.value = true}
            >
              打开 Modal
            </Button>
          </div>
          <Modal
            open={open.value}
            onClose={() => open.value = false}
            title="弹窗标题"
            footer={
              <>
                <Button
                  type="button"
                  variant="default"
                  onClick={() => open.value = false}
                >
                  取消
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => open.value = false}
                >
                  确定
                </Button>
              </>
            }
          >
            <p class="text-sm text-slate-600 dark:text-slate-400">
              这里是弹层内容区域，可放置表单、说明或自定义节点。
            </p>
          </Modal>
          <CodeBlock
            title="代码示例"
            code={`<Modal
  open={open.value}
  onClose={() => open.value = false}
  title="弹窗标题"
  footer={<>...</>}
>
  <p>弹层内容</p>
</Modal>`}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>无 Footer</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            不传 footer 或 footer=null 时不显示底部区域。
          </Paragraph>
          <div class="flex gap-2">
            <Button
              type="button"
              variant="default"
              onClick={() => openNoFooter.value = true}
            >
              无 Footer Modal
            </Button>
          </div>
          <Modal
            open={openNoFooter.value}
            onClose={() => openNoFooter.value = false}
            title="仅标题与内容"
          >
            <p class="text-sm text-slate-600 dark:text-slate-400">
              不传 footer 时不显示底部按钮区。
            </p>
          </Modal>
          <CodeBlock
            title="代码示例"
            code={`<Modal
  open={open.value}
  onClose={...}
  title="仅标题与内容"
>
  <p>内容</p>
</Modal>`}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>无标题</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            title 传 null 或空字符串时不显示标题栏，closable
            时关闭按钮在右上角。
          </Paragraph>
          <div class="flex gap-2">
            <Button
              type="button"
              variant="default"
              onClick={() => openNoTitle.value = true}
            >
              无标题 Modal
            </Button>
          </div>
          <Modal
            open={openNoTitle.value}
            onClose={() => openNoTitle.value = false}
            title={null}
          >
            <p class="text-sm text-slate-600 dark:text-slate-400">
              无标题栏，仅内容与关闭按钮。
            </p>
          </Modal>
          <CodeBlock
            title="代码示例"
            code={`<Modal
  open={open.value}
  onClose={...}
  title={null}
>
  <p>内容</p>
</Modal>`}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        {/* 4. closable={false} */}
        <section class="space-y-2">
          <Title level={2}>无关闭按钮</Title>
          <Paragraph>
            closable=false 时不显示右上角关闭按钮，需通过遮罩关闭。
          </Paragraph>
          <div class="flex gap-2">
            <Button
              variant="default"
              onClick={() => openNoClosable.value = true}
            >
              无关闭按钮
            </Button>
          </div>
          <Modal
            open={openNoClosable.value}
            onClose={() => openNoClosable.value = false}
            title="只能点遮罩关闭"
            closable={false}
          >
            <p class="text-sm text-slate-600 dark:text-slate-400">
              未显示关闭按钮，请点击遮罩关闭。
            </p>
          </Modal>
        </section>

        <div class="space-y-4">
          <Title level={3}>点击遮罩不关闭</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            maskClosable=false 时点击遮罩不会触发 onClose。
          </Paragraph>
          <div class="flex gap-2">
            <Button
              type="button"
              variant="default"
              onClick={() => openNoMaskClose.value = true}
            >
              遮罩不可关闭
            </Button>
          </div>
          <Modal
            open={openNoMaskClose.value}
            onClose={() => openNoMaskClose.value = false}
            title="点击遮罩不关闭"
            maskClosable={false}
          >
            <p class="text-sm text-slate-600 dark:text-slate-400">
              只能通过关闭按钮关闭。
            </p>
          </Modal>
          <CodeBlock
            title="代码示例"
            code={`<Modal
  ...
  maskClosable={false}
>
  ...
</Modal>`}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>自定义宽度</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            width 支持预设 xs/sm/md/lg/xl（400/520/640/800/960px）、字符串（如
            "80%"、"400px"）或数字（视为 px）。
          </Paragraph>
          <div class="flex flex-wrap gap-2">
            <span class="text-sm text-slate-600 dark:text-slate-400 self-center mr-1">
              预设：
            </span>
            {(["xs", "sm", "md", "lg", "xl"] as const).map((w) => (
              <span key={w} class="contents">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    widthPreset.value = w;
                    openWidthPreset.value = true;
                  }}
                >
                  {w}
                </Button>
              </span>
            ))}
            <Button
              type="button"
              variant="default"
              onClick={() => openWidth.value = true}
            >
              80%
            </Button>
          </div>
          <Modal
            open={openWidthPreset.value}
            onClose={() => openWidthPreset.value = false}
            title={`宽度 ${widthPreset.value}`}
            width={widthPreset.value}
          >
            <p class="text-sm text-slate-600 dark:text-slate-400">
              width="{widthPreset.value}"：xs 400px / sm 520px / md 640px / lg
              800px / xl 960px。
            </p>
          </Modal>
          <Modal
            open={openWidth.value}
            onClose={() => openWidth.value = false}
            title="宽度 80%"
            width="80%"
          >
            <p class="text-sm text-slate-600 dark:text-slate-400">
              width="80%" 时弹层占视口宽度 80%。
            </p>
          </Modal>
          <CodeBlock
            title="代码示例（预设）"
            code={`<Modal
  open={open.value}
  onClose={...}
  title="标题"
  width="md"
>
  <p>width="md" 为 640px</p>
</Modal>`}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
          <CodeBlock
            title="代码示例（百分比）"
            code={`<Modal
  ...
  width="80%"
>
  ...
</Modal>`}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>不垂直居中</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            centered=false 时弹层靠上对齐（默认 pt-16）。
          </Paragraph>
          <div class="flex gap-2">
            <Button
              type="button"
              variant="default"
              onClick={() => openNotCentered.value = true}
            >
              顶部对齐
            </Button>
          </div>
          <Modal
            open={openNotCentered.value}
            onClose={() => openNotCentered.value = false}
            title="顶部对齐"
            centered={false}
          >
            <p class="text-sm text-slate-600 dark:text-slate-400">
              弹层在视口上方，非垂直居中。
            </p>
          </Modal>
          <CodeBlock
            title="代码示例"
            code={`<Modal
  ...
  centered={false}
>
  ...
</Modal>`}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        {/* 8. destroyOnClose={true} */}
        <section class="space-y-2">
          <Title level={2}>关闭后销毁</Title>
          <Paragraph>
            destroyOnClose=true 时关闭后子节点不挂载，再次打开为全新挂载。
          </Paragraph>
          <div class="flex gap-2">
            <Button variant="default" onClick={() => openDestroy.value = true}>
              关闭后销毁
            </Button>
          </div>
          <Modal
            open={openDestroy.value}
            onClose={() => openDestroy.value = false}
            title="关闭后销毁内容"
            destroyOnClose
          >
            <p class="text-sm text-slate-600 dark:text-slate-400">
              关闭后此内容会被销毁，再次打开会重新挂载。
            </p>
          </Modal>
        </section>

        <div class="space-y-4">
          <Title level={3}>禁用 Esc 关闭</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            默认不支持 Esc；不传 keyboard 或 keyboard=false 时按 Esc 不触发
            onClose。
          </Paragraph>
          <div class="flex gap-2">
            <Button
              type="button"
              variant="default"
              onClick={() => openNoKeyboard.value = true}
            >
              不支持 Esc
            </Button>
          </div>
          <Modal
            open={openNoKeyboard.value}
            onClose={() => openNoKeyboard.value = false}
            title="按 Esc 无效"
            keyboard={false}
          >
            <p class="text-sm text-slate-600 dark:text-slate-400">
              请使用关闭按钮或点击遮罩关闭。
            </p>
          </Modal>
          <CodeBlock
            title="代码示例"
            code={`<Modal
  ...
  keyboard={false}
>
  ...
</Modal>`}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>可移动</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            draggable=true 时可通过拖拽标题栏移动弹层位置。
          </Paragraph>
          <div class="flex gap-2">
            <Button
              type="button"
              variant="default"
              onClick={() => openDraggable.value = true}
            >
              可移动弹窗
            </Button>
          </div>
          <Modal
            open={openDraggable.value}
            onClose={() => openDraggable.value = false}
            title="可拖拽标题栏移动"
            draggable
          >
            <p class="text-sm text-slate-600 dark:text-slate-400">
              拖拽上方标题栏可移动弹层位置。
            </p>
          </Modal>
          <CodeBlock
            title="代码示例"
            code={`<Modal
  open={open.value}
  onClose={...}
  title="可拖拽标题栏移动"
  draggable
>
  <p>拖拽上方标题栏可移动弹层位置。</p>
</Modal>`}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>按 Esc 键可关闭</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            keyboard=true 时支持按 Esc 键关闭弹窗。
          </Paragraph>
          <div class="flex gap-2">
            <Button
              type="button"
              variant="default"
              onClick={() => openKeyboard.value = true}
            >
              按 Esc 关闭
            </Button>
          </div>
          <Modal
            open={openKeyboard.value}
            onClose={() => openKeyboard.value = false}
            title="按 Esc 可关闭"
            keyboard
          >
            <p class="text-sm text-slate-600 dark:text-slate-400">
              打开后按键盘 Esc 可关闭此弹窗。
            </p>
          </Modal>
          <CodeBlock
            title="代码示例"
            code={`<Modal
  open={open.value}
  onClose={...}
  title="按 Esc 可关闭"
  keyboard
>
  <p>打开后按键盘 Esc 可关闭此弹窗。</p>
</Modal>`}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>全屏</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            fullscreenable=true 时标题栏显示全屏切换按钮，可切换弹层全屏/还原。
          </Paragraph>
          <div class="flex gap-2">
            <Button
              type="button"
              variant="default"
              onClick={() => openFullscreen.value = true}
            >
              全屏切换
            </Button>
          </div>
          <Modal
            open={openFullscreen.value}
            onClose={() => openFullscreen.value = false}
            title="可全屏"
            fullscreenable
          >
            <p class="text-sm text-slate-600 dark:text-slate-400">
              点击标题栏右侧全屏按钮可切换全屏显示。
            </p>
          </Modal>
          <CodeBlock
            title="代码示例"
            code={`<Modal
  open={open.value}
  onClose={...}
  title="可全屏"
  fullscreenable
>
  <p>点击标题栏右侧全屏按钮可切换全屏显示。</p>
</Modal>`}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>自定义样式</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            maskClass、wrapClass、bodyClass、class
            可扩展遮罩、容器、内容区、弹层盒子样式。
          </Paragraph>
          <div class="flex gap-2">
            <Button
              type="button"
              variant="default"
              onClick={() => openCustomClass.value = true}
            >
              自定义 class
            </Button>
          </div>
          <Modal
            open={openCustomClass.value}
            onClose={() => openCustomClass.value = false}
            title="自定义样式"
            class="ring-2 ring-blue-500"
            bodyClass="bg-slate-50 dark:bg-slate-800/50"
          >
            <p class="text-sm text-slate-600 dark:text-slate-400">
              弹层加了 ring，内容区加了背景色（bodyClass）。
            </p>
          </Modal>
          <CodeBlock
            title="代码示例"
            code={`<Modal
  ...
  class="ring-2 ring-blue-500"
  bodyClass="bg-slate-50"
>
  ...
</Modal>`}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>
      </section>

      <section class="space-y-3">
        <Title level={2}>API</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          组件接收以下属性，open / onClose 受控显隐。
        </Paragraph>
        <div class="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-600">
          <table class="w-full min-w-lg text-sm">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/80">
                <th class="px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">
                  属性
                </th>
                <th class="px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">
                  类型
                </th>
                <th class="px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">
                  默认值
                </th>
                <th class="px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">
                  说明
                </th>
              </tr>
            </thead>
            <tbody>
              {MODAL_API.map((row) => (
                <tr
                  key={row.name}
                  class="border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                >
                  <td class="px-4 py-2.5 font-mono text-slate-700 dark:text-slate-300">
                    {row.name}
                  </td>
                  <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                    {row.type}
                  </td>
                  <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                    {row.default}
                  </td>
                  <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                    {row.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
