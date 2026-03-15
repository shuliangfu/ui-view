/**
 * 路由: /feedback/modal - Modal 全部用法示例
 * 组件返回 thunk () => VNode，使 open 等 signal 的订阅发生在子 effect 内，避免根 effect 重跑导致整棵 #app 重渲染、全屏闪烁。
 */
import { createSignal } from "@dreamer/view";
import { Button, Modal, Paragraph, Title } from "@dreamer/ui-view";

export default function FeedbackModal() {
  const [open, setOpen] = createSignal(false);
  const [openNoFooter, setOpenNoFooter] = createSignal(false);
  const [openNoTitle, setOpenNoTitle] = createSignal(false);
  const [openNoClosable, setOpenNoClosable] = createSignal(false);
  const [openNoMaskClose, setOpenNoMaskClose] = createSignal(false);
  const [openWidth, setOpenWidth] = createSignal(false);
  const [openNotCentered, setOpenNotCentered] = createSignal(false);
  const [openDestroy, setOpenDestroy] = createSignal(false);
  const [openNoKeyboard, setOpenNoKeyboard] = createSignal(false);
  const [openCustomClass, setOpenCustomClass] = createSignal(false);

  return () => (
    <div class="space-y-8">
      <div>
        <Title level={1}>Modal</Title>
        <Paragraph>
          模态弹窗：遮罩、标题、内容、底部；支持关闭、点击遮罩关闭、Esc、自定义宽度与
          footer。下方示例覆盖全部属性用法。
        </Paragraph>
      </div>

      {/* 1. 基础：标题 + 内容 + footer */}
      <section class="space-y-2">
        <Title level={2}>基础用法</Title>
        <Paragraph>open / onClose / title / children / footer</Paragraph>
        <div class="flex gap-2">
          <Button variant="primary" onClick={() => setOpen(true)}>
            打开 Modal
          </Button>
        </div>
        <Modal
          open={open()}
          onClose={() => setOpen(false)}
          title="弹窗标题"
          footer={
            <>
              <Button variant="default" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button variant="primary" onClick={() => setOpen(false)}>
                确定
              </Button>
            </>
          }
        >
          <p class="text-sm text-slate-600 dark:text-slate-400">
            这里是弹层内容区域，可放置表单、说明或自定义节点。
          </p>
        </Modal>
      </section>

      {/* 2. 无 Footer */}
      <section class="space-y-2">
        <Title level={2}>无 Footer</Title>
        <Paragraph>不传 footer 或 footer=null 时不显示底部区域。</Paragraph>
        <div class="flex gap-2">
          <Button variant="default" onClick={() => setOpenNoFooter(true)}>
            无 Footer Modal
          </Button>
        </div>
        <Modal
          open={openNoFooter()}
          onClose={() => setOpenNoFooter(false)}
          title="仅标题与内容"
        >
          <p class="text-sm text-slate-600 dark:text-slate-400">
            不传 footer 时不显示底部按钮区。
          </p>
        </Modal>
      </section>

      {/* 3. 无标题 */}
      <section class="space-y-2">
        <Title level={2}>无标题</Title>
        <Paragraph>title 传 null 或空字符串时不显示标题栏，closable 时关闭按钮在右上角。</Paragraph>
        <div class="flex gap-2">
          <Button variant="default" onClick={() => setOpenNoTitle(true)}>
            无标题 Modal
          </Button>
        </div>
        <Modal
          open={openNoTitle()}
          onClose={() => setOpenNoTitle(false)}
          title={null}
        >
          <p class="text-sm text-slate-600 dark:text-slate-400">
            无标题栏，仅内容与关闭按钮。
          </p>
        </Modal>
      </section>

      {/* 4. closable={false} */}
      <section class="space-y-2">
        <Title level={2}>无关闭按钮</Title>
        <Paragraph>closable=false 时不显示右上角关闭按钮，需通过遮罩或 Esc 关闭（若开启）。</Paragraph>
        <div class="flex gap-2">
          <Button variant="default" onClick={() => setOpenNoClosable(true)}>
            无关闭按钮
          </Button>
        </div>
        <Modal
          open={openNoClosable()}
          onClose={() => setOpenNoClosable(false)}
          title="只能点遮罩或 Esc 关闭"
          closable={false}
        >
          <p class="text-sm text-slate-600 dark:text-slate-400">
            未显示关闭按钮，请点击遮罩或按 Esc 关闭。
          </p>
        </Modal>
      </section>

      {/* 5. maskClosable={false} */}
      <section class="space-y-2">
        <Title level={2}>点击遮罩不关闭</Title>
        <Paragraph>maskClosable=false 时点击遮罩不会触发 onClose。</Paragraph>
        <div class="flex gap-2">
          <Button variant="default" onClick={() => setOpenNoMaskClose(true)}>
            遮罩不可关闭
          </Button>
        </div>
        <Modal
          open={openNoMaskClose()}
          onClose={() => setOpenNoMaskClose(false)}
          title="点击遮罩不关闭"
          maskClosable={false}
        >
          <p class="text-sm text-slate-600 dark:text-slate-400">
            只能通过关闭按钮或 Esc 关闭。
          </p>
        </Modal>
      </section>

      {/* 6. width 自定义宽度 */}
      <section class="space-y-2">
        <Title level={2}>自定义宽度</Title>
        <Paragraph>width 支持字符串（如 "80%"、"400px"）或数字（视为 px）。</Paragraph>
        <div class="flex gap-2">
          <Button variant="default" onClick={() => setOpenWidth(true)}>
            宽 80% Modal
          </Button>
        </div>
        <Modal
          open={openWidth()}
          onClose={() => setOpenWidth(false)}
          title="宽度 80%"
          width="80%"
        >
          <p class="text-sm text-slate-600 dark:text-slate-400">
            width="80%" 时弹层占视口宽度 80%。
          </p>
        </Modal>
      </section>

      {/* 7. centered={false} */}
      <section class="space-y-2">
        <Title level={2}>不垂直居中</Title>
        <Paragraph>centered=false 时弹层靠上对齐（默认 pt-16）。</Paragraph>
        <div class="flex gap-2">
          <Button variant="default" onClick={() => setOpenNotCentered(true)}>
            顶部对齐
          </Button>
        </div>
        <Modal
          open={openNotCentered()}
          onClose={() => setOpenNotCentered(false)}
          title="顶部对齐"
          centered={false}
        >
          <p class="text-sm text-slate-600 dark:text-slate-400">
            弹层在视口上方，非垂直居中。
          </p>
        </Modal>
      </section>

      {/* 8. destroyOnClose={true} */}
      <section class="space-y-2">
        <Title level={2}>关闭后销毁</Title>
        <Paragraph>destroyOnClose=true 时关闭后子节点不挂载，再次打开为全新挂载。</Paragraph>
        <div class="flex gap-2">
          <Button variant="default" onClick={() => setOpenDestroy(true)}>
            关闭后销毁
          </Button>
        </div>
        <Modal
          open={openDestroy()}
          onClose={() => setOpenDestroy(false)}
          title="关闭后销毁内容"
          destroyOnClose
        >
          <p class="text-sm text-slate-600 dark:text-slate-400">
            关闭后此内容会被销毁，再次打开会重新挂载。
          </p>
        </Modal>
      </section>

      {/* 9. keyboard={false} */}
      <section class="space-y-2">
        <Title level={2}>禁用 Esc 关闭</Title>
        <Paragraph>keyboard=false 时按 Esc 不触发 onClose。</Paragraph>
        <div class="flex gap-2">
          <Button variant="default" onClick={() => setOpenNoKeyboard(true)}>
            不支持 Esc
          </Button>
        </div>
        <Modal
          open={openNoKeyboard()}
          onClose={() => setOpenNoKeyboard(false)}
          title="按 Esc 无效"
          keyboard={false}
        >
          <p class="text-sm text-slate-600 dark:text-slate-400">
            请使用关闭按钮或点击遮罩关闭。
          </p>
        </Modal>
      </section>

      {/* 10. maskClass / wrapClass / bodyClass / class */}
      <section class="space-y-2">
        <Title level={2}>自定义样式</Title>
        <Paragraph>maskClass、wrapClass、bodyClass、class 可扩展遮罩、容器、内容区、弹层盒子样式。</Paragraph>
        <div class="flex gap-2">
          <Button variant="default" onClick={() => setOpenCustomClass(true)}>
            自定义 class
          </Button>
        </div>
        <Modal
          open={openCustomClass()}
          onClose={() => setOpenCustomClass(false)}
          title="自定义样式"
          class="ring-2 ring-blue-500"
          bodyClass="bg-slate-50 dark:bg-slate-800/50"
        >
          <p class="text-sm text-slate-600 dark:text-slate-400">
            弹层加了 ring，内容区加了背景色（bodyClass）。
          </p>
        </Modal>
      </section>
    </div>
  );
}
