/**
 * 文档站「具名类型」属性表列表：每个类型一节 Title + 说明 + DocsApiTable。
 */
import { Paragraph, Title } from "@dreamer/ui-view/basic";
import { DocsApiTable } from "./DocsApiTable.tsx";
import {
  DATA_DISPLAY_TYPE_SECTIONS,
  type DataDisplayTypeSection,
} from "../data/data-display-api-types.ts";

export function DocsTypeApiSections(props: { ids: readonly string[] }) {
  const sections: DataDisplayTypeSection[] = [];
  for (const id of props.ids) {
    const hit = DATA_DISPLAY_TYPE_SECTIONS.find((s) => s.id === id);
    if (hit) sections.push(hit);
  }
  return (
    <>
      {sections.map((section) => (
        <section class="mt-8 space-y-3" data-api-type={section.id}>
          <Title level={3} id={`api-type-${section.id}`}>
            {section.title}
          </Title>
          {section.lead
            ? (
              <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
                {section.lead}
              </Paragraph>
            )
            : null}
          <DocsApiTable
            rows={section.rows}
            nameColumnHeader={section.nameColumnHeader}
          />
        </section>
      ))}
    </>
  );
}
