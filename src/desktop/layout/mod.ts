/**
 * 布局与容器（ANALYSIS 3.5）：Container、Hero、Grid、GridItem、Stack、Divider、Tabs、Accordion。
 *
 * `Tabs` / `Accordion` 非受控内部状态使用 `@dreamer/view` 的 **`Signal`**（`createSignal`，`.value`）；
 * `Container`、`Hero`、`Grid`、`Stack`、`Divider` 为纯 props，直接返回 VNode。
 */

export { Container } from "./Container.tsx";
export type { ContainerProps, ContainerSize } from "./Container.tsx";

export { Divider } from "./Divider.tsx";
export type { DividerOrientation, DividerProps } from "./Divider.tsx";

export { Stack } from "./Stack.tsx";
export type {
  StackAlign,
  StackDirection,
  StackJustify,
  StackProps,
} from "./Stack.tsx";

export { Grid, GridItem } from "./Grid.tsx";
export type { GridItemProps, GridProps } from "./Grid.tsx";

export { Hero } from "./Hero.tsx";
export type { HeroLayout, HeroProps } from "./Hero.tsx";

export { Tabs } from "./Tabs.tsx";
export type { TabItem, TabsProps, TabsType } from "./Tabs.tsx";

export { Accordion } from "./Accordion.tsx";
export type { AccordionItem, AccordionProps } from "./Accordion.tsx";
