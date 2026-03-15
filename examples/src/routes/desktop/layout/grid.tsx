/** 路由: /layout/grid */
import { Grid, GridItem, Paragraph, Title } from "@dreamer/ui-view";

export default function LayoutGrid() {
  return (
    <div class="space-y-6">
      <Title level={1}>Grid</Title>
      <Paragraph>栅格：12/24 列、gap、GridItem span。</Paragraph>

      <div>
        <Title level={2}>12 列</Title>
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
    </div>
  );
}
