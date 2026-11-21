/** Fixed reviewed public documentation fixtures. Expected data is NOT imported/read from live docs at runtime. */
import { describe, expect, it } from "@dreamer/test";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { open } from "./driver.ts";
const cases = [
  {
    "slug": "share-sheet",
    "interface": "ShareSheet",
    "tables": [
      {
        "heading": "API",
        "header": "属性",
        "rows": [
          [
            "open",
            "ControlledOpenInput",
            "-",
            "是否打开",
          ],
          [
            "options",
            "ShareSheetOption[]",
            "-",
            "分享选项",
          ],
          [
            "title",
            "string | null",
            "-",
            "标题",
          ],
          [
            "onClose",
            "() => void",
            "-",
            "关闭",
          ],
          [
            "cancelText",
            "string | null",
            "取消",
            "取消文案",
          ],
          [
            "messages",
            "Partial<ShareSheetMessages>",
            "-",
            "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
          ],
        ],
      },
      {
        "heading": "文案（messages）",
        "header": "字段",
        "rows": [
          [
            "cancel",
            "string",
            '"取消"',
            "底部取消文案",
          ],
          [
            "dialog",
            "string",
            '"分享"',
            "面板 aria-label／对话名",
          ],
          [
            "close",
            "string",
            '"关闭"',
            "关闭 aria-label",
          ],
        ],
      },
    ],
  },
  {
    "slug": "floating-panel",
    "interface": "FloatingPanel",
    "tables": [
      {
        "heading": "API",
        "header": "属性",
        "rows": [
          [
            "open",
            "ControlledOpenInput",
            "-",
            "是否打开",
          ],
          [
            "anchors",
            "number[]",
            "[120,320,560]",
            "锚点高度（px，升序）",
          ],
          [
            "anchorIndex",
            "number",
            "-",
            "当前锚点下标",
          ],
          [
            "onClose",
            "() => void",
            "-",
            "遮罩关闭",
          ],
          [
            "onAnchorChange",
            "(index) => void",
            "-",
            "锚点变化",
          ],
          [
            "messages",
            "Partial<FloatingPanelMessages>",
            "-",
            "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
          ],
        ],
      },
      {
        "heading": "文案（messages）",
        "header": "字段",
        "rows": [
          [
            "close",
            "string",
            '"关闭"',
            "遮罩关闭 aria-label",
          ],
        ],
      },
    ],
  },
  {
    "slug": "overlay",
    "interface": "Overlay",
    "tables": [
      {
        "heading": "API",
        "header": "属性",
        "rows": [
          [
            "open",
            "ControlledOpenInput",
            "-",
            "是否显示",
          ],
          [
            "onClick",
            "() => void",
            "-",
            "点击遮罩",
          ],
          [
            "clickable",
            "boolean",
            "true",
            "点击是否触发 onClick",
          ],
          [
            "portal",
            "boolean",
            "true",
            "挂 body；框内示例用 false",
          ],
          [
            "zIndex",
            "number",
            "-",
            "层级",
          ],
          [
            "messages",
            "Partial<OverlayMessages>",
            "-",
            "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
          ],
        ],
      },
      {
        "heading": "文案（messages）",
        "header": "字段",
        "rows": [
          [
            "label",
            "string",
            '"遮罩"',
            "遮罩 aria-label；显式 aria-label 优先",
          ],
        ],
      },
    ],
  },
  {
    "slug": "notice-bar",
    "interface": "NoticeBar",
    "tables": [
      {
        "heading": "API",
        "header": "属性",
        "rows": [
          [
            "content",
            "unknown | unknown[]",
            "-",
            "文案；数组时一次只显示一条，停留后再接下一条",
          ],
          [
            "tone",
            "info|success|warning|danger",
            "info",
            "色调",
          ],
          [
            "icon",
            "boolean | unknown",
            "false",
            "默认不显示。写 icon 即用默认 info 图标，颜色随 tone；也可传入自定义节点",
          ],
          [
            "closable",
            "boolean",
            "false",
            "可关闭。传入 closeConfirm 或 closeKey 时默认显示",
          ],
          [
            "scrollable",
            "boolean",
            "false",
            "开启滚动。水平从右向左循环；垂直从下往上；数组时一次一条",
          ],
          [
            "speed",
            '"fast" | "medium" | "slow" | number',
            "medium",
            "滚动速度。三档或数字（像素/秒）：fast 120、medium 60、slow 30",
          ],
          [
            "direction",
            '"horizontal" | "vertical"',
            "horizontal",
            "滚动方向。horizontal 从右向左，vertical 从下往上",
          ],
          [
            "interval",
            "number",
            "3",
            "当前条展示秒数，到时再滚下一条。仅多条或垂直滚动时生效",
          ],
          [
            "closeConfirm",
            "string",
            "-",
            "关闭前确认文案。传入后点击关闭会先弹出气泡，取消则不关闭",
          ],
          [
            "closeKey",
            "string",
            "-",
            "Cookie 名。关闭后写入该 cookie（一年），之后刷新或 SSR 都不再显示",
          ],
          [
            "visible",
            "boolean",
            "-",
            "受控可见",
          ],
          [
            "rounded",
            'boolean | "sm" | "md" | "lg" | "full"',
            "false",
            "圆角，默认 false 为直角。写 rounded 即为 rounded-lg；也可写 sm／md／lg／full",
          ],
          [
            "messages",
            "Partial<NoticeBarMessages>",
            "-",
            "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
          ],
        ],
      },
      {
        "heading": "文案（messages）",
        "header": "字段",
        "rows": [
          [
            "close",
            "string",
            '"关闭"',
            "关闭按钮 aria-label",
          ],
        ],
      },
    ],
  },
  {
    "slug": "pull-refresh",
    "interface": "PullRefresh",
    "tables": [
      {
        "heading": "API",
        "header": "属性",
        "rows": [
          [
            "loading",
            "Signal | () => boolean",
            "-",
            "是否加载中；推荐 `loading={sig}`，勿仅传 `sig.value`",
          ],
          [
            "onRefresh",
            "() => void | Promise<void>",
            "-",
            "下拉释放后触发；父级拉取数据后应将 loading 置 false",
          ],
          [
            "pullingText",
            "string",
            "内置文案",
            "下拉过程提示",
          ],
          [
            "loosingText",
            "string",
            "内置文案",
            "释放过程提示",
          ],
          [
            "loadingText",
            "string",
            "内置文案",
            "加载中提示",
          ],
          [
            "successText",
            "string | null",
            "null",
            "成功态文案；空则不显示成功动画",
          ],
          [
            "successDuration",
            "number",
            "500",
            "成功提示展示时长（ms）",
          ],
          [
            "headHeight",
            "number",
            "50",
            "头部指示区高度（px）",
          ],
          [
            "pullDistance",
            "number",
            "同 headHeight",
            "触发刷新的下拉距离（px）",
          ],
          [
            "disabled",
            "boolean",
            "false",
            "禁用下拉刷新",
          ],
          [
            "class",
            "string",
            "-",
            "最外层 class",
          ],
          [
            "scrollContainerRef",
            "(el: HTMLDivElement | null) => void",
            "-",
            "内层滚动容器（data-pull-refresh-content）挂载/卸载回调；供 ScrollList 等挂 IntersectionObserver",
          ],
          [
            "children",
            "unknown",
            "-",
            "通常为可滚动列表主体",
          ],
          [
            "messages",
            "Partial<PullRefreshMessages>",
            "-",
            "本地化默认文案；显式 pullingText/loosingText/loadingText/successText 优先于 messages 对应字段",
          ],
        ],
      },
      {
        "heading": "文案（messages）",
        "header": "字段",
        "rows": [
          [
            "pulling",
            "string",
            '"下拉即可刷新..."',
            "未达阈值",
          ],
          [
            "loosing",
            "string",
            '"释放即可刷新..."',
            "已达阈值",
          ],
          [
            "loading",
            "string",
            '"加载中..."',
            "刷新中",
          ],
          [
            "success",
            "string | null",
            "`null`",
            "成功提示；null 不展示成功态",
          ],
        ],
      },
    ],
  },
  {
    "slug": "swipe-cell",
    "interface": "SwipeCell",
    "tables": [
      {
        "heading": "SwipeCell",
        "header": "属性",
        "rows": [
          [
            "leftActions",
            "SwipeCellAction[]",
            "[]",
            "左侧操作（向右滑露出）",
          ],
          [
            "rightActions",
            "SwipeCellAction[]",
            "[]",
            "右侧操作（向左滑露出）",
          ],
          [
            "children",
            "unknown",
            "-",
            "单元格主内容",
          ],
          [
            "disabled",
            "boolean",
            "false",
            "禁用滑动",
          ],
          [
            "actionWidth",
            "number",
            "64",
            "单侧每个按钮宽度（px）",
          ],
          [
            "onOpen",
            '(side: "left" | "right") => void',
            "-",
            "滑开一侧时回调",
          ],
          [
            "onClose",
            "() => void",
            "-",
            "收回时回调",
          ],
          [
            "class",
            "string",
            "-",
            "最外层 class",
          ],
        ],
      },
      {
        "heading": "SwipeCellAction",
        "header": "属性",
        "rows": [
          [
            "text",
            "string",
            "-",
            "按钮文案",
          ],
          [
            "onClick",
            "() => void",
            "-",
            "点击回调",
          ],
          [
            "style",
            '"default" | "primary" | "danger"',
            "default",
            "预设配色",
          ],
          [
            "class",
            "string",
            "-",
            "覆盖按钮 class",
          ],
        ],
      },
    ],
  },
] as const;
describe("Mobile feedback reference", () => {
  for (const entry of cases) {
    it("DOM完整合同 移动反馈API/messages：" + entry.slug, async (t) => {
      const page = await open(t, "/mobile/feedback/" + entry.slug);
      for (const spec of entry.tables) {
        const section = page.getByRole("heading", {
            name: spec.heading,
            exact: true,
          }).locator(".."),
          table = section.locator("table");
        // PullRefresh keeps its messages section inside the API section: select the direct props table.
        const target = spec.heading === "API" ? table.last() : table;
        expect(
          (await target.locator("thead th").allTextContents()).map((s) =>
            s.trim()
          ),
        ).toEqual([spec.header, "类型", "默认值", "说明"]);
        expect(
          await target.locator("tbody tr").evaluateAll((rows) =>
            rows.map((row) =>
              [...row.querySelectorAll("td")].map((c) => c.textContent!.trim())
            )
          ),
        ).toEqual(spec.rows);
        if (spec.heading === "文案（messages）") {
          expect(await section.locator("p code").allTextContents()).toEqual([
            "messages",
            `Partial<${entry.interface}Messages>`,
            `default${entry.interface}Messages`,
          ]);
        }
      }
    }, DOCS_BROWSER_CONFIG);
  }
});
