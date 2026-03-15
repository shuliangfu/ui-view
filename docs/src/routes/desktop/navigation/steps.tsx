/** 路由: /navigation/steps */
import { createSignal } from "@dreamer/view";
import { Paragraph, Steps, Title } from "@dreamer/ui-view";

export default function NavigationSteps() {
  const [current, setCurrent] = createSignal(1);

  const items = [
    { title: "步骤一", description: "填写基本信息" },
    { title: "步骤二", description: "确认订单" },
    { title: "步骤三", description: "完成支付" },
  ];

  return (
    <div class="space-y-8">
      <Title level={1}>Steps</Title>
      <Paragraph>
        步骤条：current、items(title/description)、水平/垂直方向；传 onChange
        可点击某步跳转。
      </Paragraph>

      <Steps
        items={items}
        current={current()}
        onChange={setCurrent}
        direction="horizontal"
      />

      <Steps items={items} current={current()} direction="vertical" />

      <div class="flex gap-2">
        <button
          type="button"
          class="px-3 py-1.5 text-sm rounded border border-slate-300 dark:border-slate-600"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
        >
          上一步
        </button>
        <button
          type="button"
          class="px-3 py-1.5 text-sm rounded bg-blue-600 text-white"
          onClick={() => setCurrent((c) => Math.min(2, c + 1))}
        >
          下一步
        </button>
      </div>
    </div>
  );
}
