/** WRITTEN-UNRUN. Fixed reviewed props/messages fixtures, never derived from live docs in the browser run. */
import { describe, expect, it } from "@dreamer/test";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { open } from "./driver.ts";
const fixtures = [
  {
    "route": "/desktop/layout/container",
    "api": [
      [
        [
          "maxWidth",
          "sm | md | lg | xl | 2xl | full",
          "xl",
          "最大宽度预设（px：640/768/1024/1280/1536/无限制）",
        ],
        [
          "size",
          "sm | md | lg | xl | 2xl | full",
          "-",
          "与 maxWidth 同义；同时传入时 size 优先",
        ],
        [
          "centered",
          "boolean",
          "true",
          "是否水平居中",
        ],
        [
          "padded",
          "boolean",
          "true",
          "是否使用默认内边距",
        ],
        [
          "class",
          "string",
          "-",
          "额外 class",
        ],
        [
          "children",
          "unknown",
          "-",
          "子节点",
        ],
      ],
    ],
    "messages": [],
  },
  {
    "route": "/desktop/layout/divider",
    "api": [
      [
        [
          "type",
          "horizontal | vertical",
          "horizontal",
          "水平或垂直",
        ],
        [
          "dashed",
          "boolean",
          "false",
          "是否虚线",
        ],
        [
          "orientation",
          "left | right | center",
          "center",
          "中间文案对齐（仅 type=horizontal 且 children 时有效）",
        ],
        [
          "children",
          "unknown",
          "-",
          "中间文案（不传则为纯线）",
        ],
        [
          "class",
          "string",
          "-",
          "额外 class",
        ],
      ],
    ],
    "messages": [],
  },
  {
    "route": "/desktop/layout/stack",
    "api": [
      [
        [
          "direction",
          "column | row",
          "column",
          "方向",
        ],
        [
          "gap",
          "number | string",
          "4",
          "间距（Tailwind 值）",
        ],
        [
          "align",
          "string",
          "-",
          "交叉轴对齐",
        ],
        [
          "justify",
          "string",
          "-",
          "主轴对齐",
        ],
        [
          "wrap",
          "boolean",
          "false",
          "是否换行",
        ],
        [
          "inline",
          "boolean",
          "false",
          "是否 inline-flex",
        ],
        [
          "class",
          "string",
          "-",
          "额外 class",
        ],
        [
          "children",
          "unknown",
          "-",
          "子节点",
        ],
      ],
    ],
    "messages": [],
  },
  {
    "route": "/desktop/layout/grid",
    "api": [
      [
        [
          "cols",
          "number",
          "12",
          "列数（1–24；兼容原先的 6 / 12 / 24）",
        ],
        [
          "xs / sm / md / lg",
          "number",
          "-",
          "响应式列数，移动优先。最小屏取 xs ?? cols ?? 12，较大屏仅在传入对应键时生效",
        ],
        [
          "gap",
          "number | string",
          "4",
          "间距（Tailwind gap）",
        ],
        [
          "class",
          "string",
          "-",
          "网格容器 class",
        ],
        [
          "children",
          "unknown",
          "-",
          "子节点（通常为 GridItem）",
        ],
      ],
      [
        [
          "span",
          "number",
          "1",
          "占据列数（1 到 cols）；与 xs 同时出现时作为未设 xs 时的最小屏回退",
        ],
        [
          "xs / sm / md / lg",
          "number",
          "-",
          "响应式跨度，与 Grid 的断点同向",
        ],
        [
          "class",
          "string",
          "-",
          "额外 class",
        ],
        [
          "className",
          "string",
          "-",
          "同上（React 风格）",
        ],
        [
          "children",
          "unknown",
          "-",
          "子节点",
        ],
      ],
    ],
    "messages": [],
  },
  {
    "route": "/desktop/layout/hero",
    "api": [
      [
        [
          "title",
          "string | unknown",
          "-",
          "主标题",
        ],
        [
          "subtitle",
          "string | unknown",
          "-",
          "副标题",
        ],
        [
          "description",
          "string | unknown",
          "-",
          "描述文案",
        ],
        [
          "extra",
          "unknown",
          "-",
          "主操作区（CTA 等）",
        ],
        [
          "media",
          "string | unknown",
          "-",
          "全幅背景图（URL 或节点，cover 铺满）",
        ],
        [
          "layout",
          "center | left | right",
          "center",
          "居中 / 左（右侧 pr 40% 留白）/ 右（左侧 pl 40%）；块内字与按钮仍居中（同 center）",
        ],
        [
          "fullScreen",
          "boolean",
          "false",
          "是否全屏高（min-h-screen）",
        ],
        [
          "background",
          "string | unknown",
          "-",
          "无 media 时为底层背景；与 media 并存时叠在 media 之上",
        ],
        [
          "class",
          "string",
          "-",
          "最外层 section class",
        ],
        [
          "contentClass",
          "string",
          "-",
          "文案外包层 class",
        ],
        [
          "overlayClass",
          "string",
          "（默认半透明）",
          "背景与文案间遮罩；传空字符串可关闭默认遮罩",
        ],
        [
          "children",
          "unknown",
          "-",
          "子节点（extra 下方）",
        ],
      ],
    ],
    "messages": [],
  },
  {
    "route": "/desktop/layout/accordion",
    "api": [
      [
        [
          "items",
          "AccordionItem[]",
          "-",
          "手风琴项（key、header、disabled、children）",
        ],
        [
          "expandedKeys",
          "string[] | () => string[]",
          "-",
          "当前展开 key 列表（受控）；推荐 `() => sig.value` 或 getter，细粒度更新下勿只传一次性快照",
        ],
        [
          "defaultExpandedKeys",
          "string[]",
          "[]",
          "默认展开 key（非受控）",
        ],
        [
          "onChange",
          "(expandedKeys: string[]) => void",
          "-",
          "展开/收起变化回调",
        ],
        [
          "allowMultiple",
          "boolean",
          "true",
          "是否允许多项同时展开",
        ],
        [
          "class",
          "string",
          "-",
          "外层 class",
        ],
        [
          "itemClass",
          "string",
          "-",
          "单项容器 class",
        ],
        [
          "headerClass",
          "string",
          "-",
          "标题区 class",
        ],
        [
          "contentClass",
          "string",
          "-",
          "内容区 class",
        ],
      ],
    ],
    "messages": [],
  },
  {
    "route": "/desktop/layout/splitter",
    "api": [
      [
        [
          "orientation",
          "horizontal | vertical",
          "horizontal",
          "方向：horizontal 为左右，vertical 为上下",
        ],
        [
          "sizes",
          "number[] | Signal<number[]> | () => number[]",
          "均分",
          "各面板宽度／高度百分比。请传 Signal 或 getter，勿传 sizes={sig.value} 快照；未传时由组件内部保存拖拽结果。非受控且开启 persist 时，初始比例优先读 cookie",
        ],
        [
          "onSizesChange",
          "(sizes: number[]) => void",
          "-",
          "拖拽过程中尺寸变化回调",
        ],
        [
          "persist",
          "string",
          "-",
          "记住拖拽位置的名字（如 editor-split）。传入即开启，拖拽结束写入 cookie，有效期一年；不传不记住。同一页多个 Splitter 须用不同名字",
        ],
        [
          "cookie",
          "string | null",
          "document.cookie",
          "服务端渲染时传入请求的 Cookie 头。浏览器可省略。这样首屏就能用上次的比例，不会先画成均分再跳一下",
        ],
        [
          "minSize",
          "number",
          "10",
          "最小百分比",
        ],
        [
          "class",
          "string",
          "-",
          "额外 class",
        ],
      ],
    ],
    "messages": [],
  },
  {
    "route": "/desktop/navigation/steps",
    "api": [
      [
        [
          "items",
          "StepItem[]",
          "-",
          "步骤项（title、description、status）",
        ],
        [
          "current",
          "number | (() => number) | Signal<number>",
          "0",
          "当前步骤（从 0 起）；等于步骤总数时全部为已完成。推荐 current={sig}，勿 current={sig.value}（手写 JSX 快照）",
        ],
        [
          "direction",
          "horizontal | vertical",
          "horizontal",
          "方向。默认水平；容器宽 ≤639.98px 时水平会自动改为垂直，避免步骤挤在一行。显式 vertical 始终垂直。",
        ],
        [
          "onChange",
          "(current: number) => void",
          "-",
          "点击某步时回调",
        ],
        [
          "class",
          "string",
          "-",
          "额外 class",
        ],
        [
          "messages",
          "Partial<StepsMessages>",
          "-",
          "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
        ],
      ],
      [
        [
          "title",
          "string | unknown",
          "-",
          "标题",
        ],
        [
          "description",
          "string | unknown",
          "-",
          "描述",
        ],
        [
          "status",
          "wait | process | finish | error",
          "-",
          "状态（不传则根据 current 推导：未到为 wait，当前为 process，已过为 finish；current 等于步骤总数时全部为 finish）",
        ],
      ],
    ],
    "messages": [
      [
        [
          "ariaLabel",
          "string",
          '"步骤"',
          "列表 aria-label",
        ],
      ],
    ],
  },
  {
    "route": "/desktop/navigation/breadcrumb",
    "api": [
      [
        [
          "items",
          "BreadcrumbItem[]",
          "-",
          "面包屑项（label、href、onClick）",
        ],
        [
          "separator",
          "unknown",
          "ChevronRight 图标",
          "自定义分隔符",
        ],
        [
          "onItemClick",
          "(item, index) => void",
          "-",
          "某项无 href 时的点击回调",
        ],
        [
          "class",
          "string",
          "-",
          "nav 容器 class",
        ],
        [
          "messages",
          "Partial<BreadcrumbMessages>",
          "-",
          "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
        ],
      ],
      [
        [
          "label",
          "string | unknown",
          "-",
          "显示文案",
        ],
        [
          "href",
          "string",
          "-",
          "链接（最后一项可不传）",
        ],
        [
          "onClick",
          "(e: Event) => void",
          "-",
          "无 href 时的点击回调",
        ],
      ],
    ],
    "messages": [
      [
        [
          "navAriaLabel",
          "string",
          '"Breadcrumb"',
          "nav aria-label",
        ],
      ],
    ],
  },
  {
    "route": "/mobile/navigation/tab-bar",
    "api": [
      [
        [
          "items",
          "TabBarItem[]",
          "-",
          "标签项：key、label、可选 icon、badge",
        ],
        [
          "activeKey",
          "Signal | () => string",
          "-",
          "当前选中 key；须 `activeKey={sig}` 或 getter",
        ],
        [
          "onChange",
          "(key: string) => void",
          "-",
          "切换标签时回调",
        ],
        [
          "fixed",
          "boolean",
          "true",
          "是否 fixed 贴底；文档示例常用 false 避免挡布局",
        ],
        [
          "border",
          "boolean",
          "true",
          "是否显示顶部分割线",
        ],
        [
          "safeAreaInsetBottom",
          "boolean",
          "true",
          "底部安全区占位（如 iPhone Home 指示条）",
        ],
        [
          "class",
          "string",
          "-",
          "根节点 class",
        ],
        [
          "messages",
          "Partial<TabBarMessages>",
          "-",
          "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
        ],
      ],
      [
        [
          "key",
          "string",
          "-",
          "唯一标识",
        ],
        [
          "label",
          "string | VNode",
          "-",
          "展示文案或节点",
        ],
        [
          "icon",
          "VNode",
          "-",
          "图标（可选）",
        ],
        [
          "badge",
          "number | string | VNode",
          "-",
          "角标",
        ],
      ],
    ],
    "messages": [
      [
        [
          "navAriaLabel",
          "string",
          '"底部导航"',
          "nav aria-label",
        ],
      ],
    ],
  },
  {
    "route": "/mobile/navigation/navbar",
    "api": [
      [
        [
          "title",
          "string | null",
          "-",
          "居中标题",
        ],
        [
          "leftText",
          "string | null",
          "-",
          "左侧文案（常与 leftArrow 同用）",
        ],
        [
          "rightText",
          "string | null",
          "-",
          "右侧文案",
        ],
        [
          "leftArrow",
          "boolean",
          "false",
          "是否显示左侧返回箭头",
        ],
        [
          "left",
          "VNode",
          "-",
          "左侧自定义区（覆盖 leftText/leftArrow）",
        ],
        [
          "right",
          "VNode",
          "-",
          "右侧自定义区（覆盖 rightText）",
        ],
        [
          "onClickLeft",
          "() => void",
          "-",
          "左侧点击",
        ],
        [
          "onClickRight",
          "() => void",
          "-",
          "右侧点击",
        ],
        [
          "leftDisabled",
          "boolean",
          "false",
          "左侧禁用态",
        ],
        [
          "rightDisabled",
          "boolean",
          "false",
          "右侧禁用态",
        ],
        [
          "fixed",
          "boolean",
          "false",
          "是否 fixed 贴顶",
        ],
        [
          "placeholder",
          "boolean",
          "false",
          "fixed 时是否在文档流插入等高占位，避免内容被挡",
        ],
        [
          "safeAreaInsetTop",
          "boolean",
          "false",
          "顶部安全区（刘海屏）",
        ],
        [
          "border",
          "boolean",
          "true",
          "底部分割线",
        ],
        [
          "zIndex",
          "number",
          "1",
          "fixed 时 style.zIndex",
        ],
        [
          "class",
          "string",
          "-",
          "顶栏根节点 class",
        ],
        [
          "messages",
          "Partial<NavBarMessages>",
          "-",
          "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
        ],
      ],
    ],
    "messages": [
      [
        [
          "back",
          "string",
          '"返回"',
          "无 leftText 时左侧 aria-label",
        ],
      ],
    ],
  },
  {
    "route": "/mobile/navigation/index-bar",
    "api": [
      [
        [
          "items",
          "IndexBarItem[]",
          "-",
          "分组",
        ],
        [
          "onSelect",
          "(index)=>void",
          "-",
          "选中索引",
        ],
        [
          "messages",
          "Partial<IndexBarMessages>",
          "-",
          "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
        ],
      ],
    ],
    "messages": [
      [
        [
          "nav",
          "string",
          '"索引"',
          "索引条 aria-label",
        ],
      ],
    ],
  },
] as const;
describe("Layout navigation reference written", () => {
  for (const entry of fixtures) {
    it("布局导航API/messages：" + entry.route, async (t) => {
      const p = await open(t, entry.route),
        api = p.getByRole("heading", { name: "API", exact: true }).locator("..")
          .locator("table");
      expect(await api.count()).toBe(entry.api.length);
      for (const [i, rows] of entry.api.entries()) {
        const table = api.nth(i);
        expect(
          (await table.locator("thead th").allTextContents()).map((s) =>
            s.trim()
          ),
        ).toEqual(["属性", "类型", "默认值", "说明"]);
        expect(
          await table.locator("tbody tr").evaluateAll((nodes) =>
            nodes.map((row) =>
              [...row.querySelectorAll("td")].map((c) => c.textContent!.trim())
            )
          ),
        ).toEqual(rows);
      }
      const messages = p.getByRole("heading", {
        name: "文案（messages）",
        exact: true,
      }).locator("..").locator("table");
      expect(await messages.count()).toBe(entry.messages.length);
      for (const [i, rows] of entry.messages.entries()) {
        const table = messages.nth(i);
        expect(
          (await table.locator("thead th").allTextContents()).map((s) =>
            s.trim()
          ),
        ).toEqual(["字段", "类型", "默认值", "说明"]);
        expect(
          await table.locator("tbody tr").evaluateAll((nodes) =>
            nodes.map((row) =>
              [...row.querySelectorAll("td")].map((c) => c.textContent!.trim())
            )
          ),
        ).toEqual(rows);
      }
    }, DOCS_BROWSER_CONFIG);
  }
});
