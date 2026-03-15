/** 路由: /layout/grid */
import { Grid, GridItem, Paragraph, Title } from "@dreamer/ui-view";

export default function LayoutGrid() {
  return (
    <div class="space-y-6">
      <Title level={1}>Grid</Title>
      <Paragraph>
        栅格：Grid 支持 cols（6/12/24）、gap、class、children；GridItem 支持 span、class、className、children。
      </Paragraph>

      <div>
        <Title level={2}>cols=12</Title>
        <Grid cols={12} gap={4} class="max-w-2xl">
          <GridItem span={6}>
            <div class="rounded bg-slate-200 dark:bg-slate-600 p-3 text-sm">
              span 6
            </div>
          </GridItem>
          <GridItem span={6}>
            <div class="rounded bg-slate-200 dark:bg-slate-600 p-3 text-sm">
              span 6
            </div>
          </GridItem>
          <GridItem span={4}>
            <div class="rounded bg-slate-200 dark:bg-slate-600 p-3 text-sm">
              span 4
            </div>
          </GridItem>
          <GridItem span={4}>
            <div class="rounded bg-slate-200 dark:bg-slate-600 p-3 text-sm">
              span 4
            </div>
          </GridItem>
          <GridItem span={4}>
            <div class="rounded bg-slate-200 dark:bg-slate-600 p-3 text-sm">
              span 4
            </div>
          </GridItem>
        </Grid>
      </div>
      <div>
        <Title level={2}>cols=24</Title>
        <Grid cols={24} gap={2} class="max-w-2xl">
          <GridItem span={12}>
            <div class="rounded bg-slate-200 dark:bg-slate-600 p-3 text-sm">span 12</div>
          </GridItem>
          <GridItem span={12}>
            <div class="rounded bg-slate-200 dark:bg-slate-600 p-3 text-sm">span 12</div>
          </GridItem>
          <GridItem span={8}>
            <div class="rounded bg-slate-200 dark:bg-slate-600 p-3 text-sm">span 8</div>
          </GridItem>
          <GridItem span={16}>
            <div class="rounded bg-slate-200 dark:bg-slate-600 p-3 text-sm">span 16</div>
          </GridItem>
        </Grid>
      </div>
    </div>
  );
}
