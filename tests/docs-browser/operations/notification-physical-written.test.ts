/** WRITTEN-UNRUN. Five live Notification examples: types, action, key, placement, duration/destroy. */
import { describe, expect, it } from "@dreamer/test";
import type { Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, example, open } from "./driver.ts";

const route = "/desktop/message/notification";

function alertOf(page: Page, text: string) {
  return page.getByRole("alert").filter({ hasText: text });
}

async function hostClass(page: Page, text: string) {
  return await alertOf(page, text).evaluate((el) => {
    const box = el.closest(".fixed") as HTMLElement | null;
    return box?.className ?? "";
  });
}

describe("Notification physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `Notification 类型 @${width}：成功/错误/信息通知标题与图标色可见`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const root = example(page, "类型");
        const cases = [
          ["成功通知", "任务完成", "您的文件已上传成功。", "text-green-600"],
          ["错误通知", "请求失败", "请检查网络后重试。", "text-red-600"],
          [
            "信息通知",
            "系统通知",
            "新版本已发布，建议尽快更新。",
            "text-blue-600",
          ],
        ] as const;
        for (const [btn, title, desc, icon] of cases) {
          await example(page, "duration 与 onClose / destroy").getByRole(
            "button",
            { name: "notification.destroy()", exact: true },
          ).click();
          await eventually(async () =>
            await page.getByRole("alert").filter({ hasText: "任务完成" })
                    .count() +
                  await page.getByRole("alert").filter({ hasText: "请求失败" })
                    .count() +
                  await page.getByRole("alert").filter({ hasText: "系统通知" })
                    .count() === 0 ||
            await page.getByRole("alert").count() === 0
          );
          await root.getByRole("button", { name: btn, exact: true }).click({
            delay: 180,
          });
          await eventually(async () => await alertOf(page, title).isVisible());
          await eventually(async () =>
            await alertOf(page, title).getByText(desc, { exact: true })
              .isVisible()
          );
          expect(
            await alertOf(page, title).locator("[role=img]").first().evaluate((
              el,
            ) => el.getAttribute("class") ?? ""),
          ).toContain(icon);
        }
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Notification 操作按钮 @${width}：查看详情触发 toast「点击了「查看详情」」`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        await example(page, "操作按钮").getByRole("button", {
          name: "带操作按钮",
          exact: true,
        }).click({ delay: 180 });
        const note = alertOf(page, "系统通知");
        await eventually(async () => await note.isVisible());
        await note.getByRole("button", { name: "查看详情", exact: true }).click(
          {
            delay: 180,
          },
        );
        await eventually(async () =>
          await page.getByRole("alert").filter({
            hasText: "点击了「查看详情」",
          }).isVisible()
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Notification key 去重 @${width}：多次点击只保留一条同 key 通知`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const btn = example(page, "key 去重").getByRole("button", {
          name: "同 key 去重",
          exact: true,
        });
        await btn.click({ delay: 180 });
        await eventually(async () =>
          await alertOf(page, "同 key 会替换").isVisible()
        );
        await btn.click({ delay: 180 });
        await btn.click({ delay: 180 });
        await eventually(async () =>
          await alertOf(page, "同 key 会替换").count() === 1
        );
        expect(await alertOf(page, "同 key 会替换").count()).toBe(1);
        expect(
          await alertOf(page, "多次点击此按钮，只会保留一条（key 去重）。")
            .count(),
        ).toBe(1);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Notification placement @${width}：六个位置容器 class 与源码一致`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const root = example(page, "placement 弹出位置");
        const destroy = example(page, "duration 与 onClose / destroy")
          .getByRole(
            "button",
            { name: "notification.destroy()", exact: true },
          );
        const expected: Record<string, string> = {
          "top-right": "top-4 right-4 pl-4 items-end",
          "top-center": "top-4 left-1/2 -translate-x-1/2 px-4 items-center",
          "top-left": "top-4 left-4 pr-4 items-start",
          "bottom-right": "bottom-4 right-4 pl-4 items-end",
          "bottom-center":
            "bottom-4 left-1/2 -translate-x-1/2 px-4 items-center",
          "bottom-left": "bottom-4 left-4 pr-4 items-start",
        };
        for (const [name, tokens] of Object.entries(expected)) {
          await destroy.click();
          await eventually(async () =>
            await page.getByRole("alert").filter({ hasText: name }).count() ===
              0
          );
          await root.getByRole("button", { name, exact: true }).click({
            delay: 180,
          });
          await eventually(async () => await alertOf(page, name).isVisible());
          const cls = await hostClass(page, name);
          for (const token of tokens.split(" ")) {
            expect(cls.split(/\s+/)).toContain(token);
          }
        }
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Notification duration 与 destroy @${width}：2 秒关闭触发 toast，duration=0 需点 X 或 destroy`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const root = example(page, "duration 与 onClose / destroy");
        await root.getByRole("button", {
          name: "自定义 duration + onClose",
          exact: true,
        }).click({ delay: 180 });
        await eventually(async () =>
          await alertOf(page, "2 秒后关闭").isVisible()
        );
        await eventually(async () =>
          await page.getByRole("alert").filter({ hasText: "通知已关闭" })
            .isVisible()
        );
        await eventually(async () =>
          await alertOf(page, "2 秒后关闭").isVisible() === false
        );
        await root.getByRole("button", {
          name: "不自动关闭（duration=0）",
          exact: true,
        }).click({ delay: 180 });
        await eventually(async () =>
          await alertOf(
            page,
            "此条不自动关闭，需点击右侧 X 或调用 destroy 关闭。",
          )
            .isVisible()
        );
        await new Promise((r) => setTimeout(r, 1200));
        expect(
          await alertOf(
            page,
            "此条不自动关闭，需点击右侧 X 或调用 destroy 关闭。",
          )
            .isVisible(),
        ).toBe(true);
        await alertOf(
          page,
          "此条不自动关闭，需点击右侧 X 或调用 destroy 关闭。",
        )
          .getByRole("button", { name: "关闭" }).click({ delay: 180 });
        await eventually(async () =>
          await alertOf(
            page,
            "此条不自动关闭，需点击右侧 X 或调用 destroy 关闭。",
          )
            .isVisible() === false
        );
        await root.getByRole("button", {
          name: "不自动关闭（duration=0）",
          exact: true,
        }).click({ delay: 180 });
        await eventually(async () =>
          await alertOf(
            page,
            "此条不自动关闭，需点击右侧 X 或调用 destroy 关闭。",
          )
            .isVisible()
        );
        await root.getByRole("button", {
          name: "notification.destroy()",
          exact: true,
        }).click({ delay: 180 });
        await eventually(async () =>
          await alertOf(
            page,
            "此条不自动关闭，需点击右侧 X 或调用 destroy 关闭。",
          )
            .isVisible() === false
        );
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
