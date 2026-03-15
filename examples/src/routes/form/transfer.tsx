/**
 * 表单 - Transfer（展示全部用法）
 * 路由: /form/transfer
 */

import { Form, FormItem, Paragraph, Title, Transfer } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

const data = [
  { key: "1", label: "苹果" },
  { key: "2", label: "香蕉" },
  { key: "3", label: "橙子" },
  { key: "4", label: "葡萄" },
  { key: "5", label: "西瓜" },
  { key: "6", label: "草莓", disabled: true },
];

export default function FormTransfer() {
  const [targetKeys, setTargetKeys] = createSignal<string[]>([]);
  const [targetKeys2, setTargetKeys2] = createSignal<string[]>(["2", "4"]);
  const [filterLeft, setFilterLeft] = createSignal("");
  const [filterRight, setFilterRight] = createSignal("");

  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Transfer</Title>
        <Paragraph>
          穿梭框：双列、批量移动、showSearch 搜索筛选、titles、disabled 项、整组
          disabled 等全部用法。
        </Paragraph>
      </div>

      <Form layout="vertical" class="max-w-3xl space-y-6">
        <section class="space-y-4">
          <Title level={2}>基础（无搜索）</Title>
          <FormItem label="穿梭">
            <Transfer
              dataSource={data}
              targetKeys={targetKeys}
              onChange={(keys) => setTargetKeys(keys)}
              titles={["待选", "已选"]}
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>showSearch 搜索筛选</Title>
          <FormItem label="左右列可搜索">
            <Transfer
              dataSource={data}
              targetKeys={targetKeys2}
              onChange={(keys) => setTargetKeys2(keys)}
              titles={["待选", "已选"]}
              showSearch
              filterLeft={filterLeft}
              filterRight={filterRight}
              onFilterLeftChange={(e) =>
                setFilterLeft((e.target as HTMLInputElement).value)}
              onFilterRightChange={(e) =>
                setFilterRight((e.target as HTMLInputElement).value)}
              searchPlaceholder={["筛选左侧", "筛选右侧"]}
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>dataSource 含 disabled 项 / 整组 disabled</Title>
          <FormItem label="草莓为 disabled">
            <Transfer
              dataSource={data}
              targetKeys={["1"]}
              onChange={() => {}}
              titles={["源", "目标"]}
            />
          </FormItem>
          <FormItem label="整组禁用">
            <Transfer
              dataSource={data}
              targetKeys={["1", "2"]}
              onChange={() => {}}
              disabled
            />
          </FormItem>
        </section>
      </Form>
    </div>
  );
}
