/** WRITTEN-UNRUN. Historical Tree tests use DOM handler invocation and are NOT reused as physical evidence. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, eventually, open } from "./driver.ts";
const row = (s: Locator, k: string) => s.locator(`[data-tree-node-key="${k}"]`);
const arrow = (s: Locator, k: string) =>
  s.locator(`[data-tree-expand-key="${k}"]`);
const check = (s: Locator, k: string) =>
  s.locator(`[data-tree-check-key="${k}"]`);
const title = (s: Locator, k: string) =>
  s.locator(`[data-tree-select-key="${k}"]`);
const sorted = (keys: string[]) => [...keys].sort();
async function selected(s: Locator, keys: string[]) {
  await eventually(async () =>
    JSON.stringify(
      await s.locator('[role="treeitem"][aria-selected="true"]').evaluateAll(
        (es) => es.map((e) => e.getAttribute("data-tree-node-key")).sort(),
      ),
    ) === JSON.stringify(sorted(keys))
  );
  expect(
    await s.locator('[data-tree-selected="true"]').evaluateAll((es) =>
      es.map((e) => e.getAttribute("data-tree-node-key")).sort()
    ),
  ).toEqual(sorted(keys));
  const display = s.locator("p").filter({ hasText: /已选:/ });
  if (await display.count() === 1) {
    const match = (await display.innerText()).match(/已选:\s*(.*?)\s*\|/);
    if (!match) throw Error("Missing selected-key display");
    expect(sorted(match[1] === "-" ? [] : match[1].split(/,\s*/))).toEqual(
      sorted(keys),
    );
  }
}
async function checked(s: Locator, keys: string[], mixed: string[] = []) {
  const current = async () =>
    await s.locator("input[data-tree-check-key]").evaluateAll((es) =>
      es.map((e) => {
        const i = e as HTMLInputElement;
        return [
          i.dataset.treeCheckKey,
          i.checked,
          i.indeterminate,
          i.getAttribute("aria-checked"),
        ];
      })
    );
  await eventually(async () => {
    const state = await current();
    return state.every(([k, c, m, a]) =>
      c === keys.includes(String(k)) && m === mixed.includes(String(k)) &&
      a ===
        (mixed.includes(String(k)) ? "mixed" : String(keys.includes(String(k))))
    );
  });
  const state = await current();
  expect(state.filter((v) => v[1]).map((v) => v[0]).sort()).toEqual(
    sorted(keys),
  );
  expect(state.filter((v) => v[2]).map((v) => v[0]).sort()).toEqual(
    sorted(mixed),
  );
  for (const [k, c, m] of state) {
    await attr(
      row(s, String(k)),
      "data-tree-check-visual",
      m ? "indeterminate" : c ? "checked" : "unchecked",
    );
  }
  const display = s.locator("p").filter({ hasText: /已勾选:/ });
  expect(await display.count()).toBe(1);
  const text = (await display.innerText()).replace(/\s+/g, " ");
  const match = text.match(/已勾选:\s*(.*?)（共\s*(\d+)）/);
  if (!match) throw Error("Missing exact checked-key/count display: " + text);
  expect(Number(match[2])).toBe(keys.length);
  expect(sorted(match[1] === "-" ? [] : match[1].split(/,\s*/))).toEqual(
    sorted(keys),
  );
}
async function initial(s: Locator, strict: boolean, checkable: boolean) {
  const tree = s.getByRole("tree");
  expect(await tree.count()).toBe(1);
  await attr(tree, "data-tree-check-strictly", String(strict));
  expect(await s.locator("[data-tree-select-key]").allTextContents()).toEqual([
    "节点 1",
    "节点 1-1",
    "节点 1-2",
    "节点 2",
  ]);
  await attr(row(s, "1"), "aria-expanded", "true");
  await attr(row(s, "1-2"), "aria-expanded", "false");
  await selected(s, []);
  if (checkable) {
    expect(await tree.getByRole("checkbox").count()).toBe(4);
    await checked(s, []);
  } else expect(await tree.getByRole("checkbox").count()).toBe(0);
}
async function navigateAndSelect(
  s: Locator,
  desktop: boolean,
  checkable: boolean,
) {
  await arrow(s, "1-2").click({ delay: 180 });
  await attr(row(s, "1-2"), "aria-expanded", "true");
  expect(await row(s, "1-2-1").count()).toBe(1);
  if (desktop) {
    await arrow(s, "2").click({ delay: 180 });
    await attr(row(s, "2"), "aria-expanded", "true");
  } else {
    await attr(row(s, "2"), "aria-expanded", null);
    expect(await arrow(s, "2").isDisabled()).toBe(true);
    expect(await arrow(s, "2").isVisible()).toBe(false);
  }
  expect(await s.locator("[data-tree-select-key]").allTextContents()).toEqual(
    desktop
      ? ["节点 1", "节点 1-1", "节点 1-2", "节点 1-2-1", "节点 2", "节点 2-1"]
      : ["节点 1", "节点 1-1", "节点 1-2", "节点 1-2-1", "节点 2"],
  );
  await title(s, "1-2-1").click({ delay: 180 });
  await selected(s, ["1-2-1"]);
  if (checkable) await checked(s, []);
  await arrow(s, "1").click({ delay: 180 });
  await attr(row(s, "1"), "aria-expanded", "false");
  expect(await row(s, "1-2").count()).toBe(0);
  await arrow(s, "1").click({ delay: 180 });
  await attr(row(s, "1-2"), "aria-expanded", "true");
  await selected(s, ["1-2-1"]);
  await row(s, "1-2").press("ArrowLeft");
  await attr(row(s, "1-2"), "aria-expanded", "false");
  expect(await row(s, "1-2-1").count()).toBe(0);
  await row(s, "1-2").press("ArrowRight");
  await attr(row(s, "1-2"), "aria-expanded", "true");
  await selected(s, ["1-2-1"]);
  await row(s, "1-2-1").press("Enter");
  await selected(s, []);
  await row(s, "1-2-1").press("Enter");
  await selected(s, ["1-2-1"]);
  if (checkable) await checked(s, []);
}
async function cascade(s: Locator, desktop: boolean) {
  await row(s, "1-2-1").press("Space");
  await checked(s, ["1-2", "1-2-1"], ["1"]);
  await selected(s, ["1-2-1"]);
  await check(s, "1").click({ delay: 180 });
  await checked(s, ["1", "1-1", "1-2", "1-2-1"]);
  await selected(s, ["1-2-1"]);
  await check(s, "1-2-1").click({ delay: 180 });
  await checked(s, ["1-1"], ["1"]);
  await selected(s, ["1-2-1"]);
  await row(s, "1-1").press("Space");
  await checked(s, []);
  await check(s, "2").click({ delay: 180 });
  await checked(s, desktop ? ["2", "2-1"] : ["2"]);
  await row(s, desktop ? "2-1" : "2").press("Space");
  await checked(s, []);
}
async function strictChecks(s: Locator) {
  await check(s, "1").click({ delay: 180 });
  await checked(s, ["1"]);
  await selected(s, ["1-2-1"]);
  await check(s, "1-2-1").click({ delay: 180 });
  await checked(s, ["1", "1-2-1"]);
  await selected(s, ["1-2-1"]);
  await row(s, "1-2").press("Space");
  await checked(s, ["1", "1-2", "1-2-1"]);
  await check(s, "1").click({ delay: 180 });
  await checked(s, ["1-2", "1-2-1"]);
  await row(s, "1-2").press("Space");
  await checked(s, ["1-2-1"]);
  await check(s, "1-2-1").click({ delay: 180 });
  await checked(s, []);
}
async function allAndRestore(s: Locator, desktop: boolean, strict: boolean) {
  await check(s, "1-1").click({ delay: 180 });
  await row(s, "1-1").press("ControlOrMeta+A");
  await checked(
    s,
    desktop
      ? ["1", "1-1", "1-2", "1-2-1", "2", "2-1"]
      : ["1", "1-1", "1-2", "1-2-1", "2"],
  );
  await selected(s, ["1-2-1"]);
  await row(s, "1-1").press("ControlOrMeta+A");
  await checked(s, []);
  await selected(s, ["1-2-1"]);
  await check(s, "1-2-1").click({ delay: 180 });
  await checked(s, strict ? ["1-2-1"] : ["1-2", "1-2-1"], strict ? [] : ["1"]);
  const before = await s.locator("p").filter({ hasText: /已勾选:/ })
    .innerText();
  await row(s, "1").press("ArrowLeft");
  expect(await row(s, "1-2-1").count()).toBe(0);
  expect(await s.locator("p").filter({ hasText: /已勾选:/ }).innerText()).toBe(
    before,
  );
  await row(s, "1").press("ArrowRight");
  expect(await row(s, "1-2-1").count()).toBe(1);
  expect(await s.locator("p").filter({ hasText: /已勾选:/ }).innerText()).toBe(
    before,
  );
  await checked(s, strict ? ["1-2-1"] : ["1-2", "1-2-1"], strict ? [] : ["1"]);
  await selected(s, ["1-2-1"]);
}
async function isolated(p: Page, active: string) {
  for (const key of ["cascade", "strict", "show-line", "block-node"]) {
    if (key === active) continue;
    const s = p.locator(`[data-tree-demo="${key}"]`);
    await selected(s, []);
    expect(await s.locator("input:checked").count()).toBe(0);
    await attr(row(s, "1-2"), "aria-expanded", "false");
  }
}
describe("Tree physical written", () => {
  for (const platform of ["desktop", "mobile"]) {
    for (const width of [390, 1280]) {
      for (
        const [key, label] of [
          ["cascade", "展开 / 选中 / 勾选"],
          ["strict", "严格勾选 checkStrictly"],
          ["show-line", "showLine 连接线"],
          ["block-node", "blockNode 块级行"],
        ]
      ) {
        it(
          `Tree ${platform} ${label} @${width}：真实分流/嵌套展开/精确keys及视觉`,
          async (t) => {
            const p = await open(t, `/${platform}/data-display/tree`);
            await p.setViewportSize({ width, height: 900 });
            const s = p.locator(`[data-tree-demo="${key}"]`),
              desktop = platform === "desktop",
              checkable = key !== "show-line";
            await initial(s, key === "strict", checkable);
            await navigateAndSelect(s, desktop, checkable);
            if (key === "show-line") {
              await attr(s.getByRole("tree"), "data-tree-show-line", "true");
              for (
                const [k, padding] of [["1", "12px"], ["1-2", "32px"], [
                  "1-2-1",
                  "52px",
                ]]
              ) {
                expect(
                  await row(s, k).evaluate((e) =>
                    getComputedStyle(e).paddingLeft
                  ),
                ).toBe(padding);
              }
              const line = s.locator('[data-tree-children-key="1"]');
              expect(
                await line.evaluate((e) => getComputedStyle(e).borderLeftWidth),
              ).toBe("1px");
              const connectors = s.locator(
                '[data-tree-line-item="true"] > span[aria-hidden="true"]',
              );
              expect(await connectors.count()).toBe(desktop ? 4 : 3);
              for (let i = 0; i < await connectors.count(); i++) {
                expect(
                  await connectors.nth(i).evaluate((e) =>
                    getComputedStyle(e).borderTopWidth
                  ),
                ).toBe("1px");
                expect(
                  await connectors.nth(i).evaluate((e) =>
                    getComputedStyle(e).width
                  ),
                ).toBe("12px");
              }
              await row(s, "1-1").press("Space");
              await selected(s, ["1-1"]);
              await row(s, "1-1").press("Space");
              await selected(s, []);
              const b = await row(s, "1").boundingBox();
              if (!b) throw Error("Row hit box missing");
              await p.mouse.click(b.x + b.width - 3, b.y + b.height / 2, {
                delay: 180,
              });
              await selected(s, ["1"]);
              await attr(row(s, "1"), "aria-expanded", "true");
            } else {
              if (key === "strict") await strictChecks(s);
              else await cascade(s, desktop);
              await allAndRestore(s, desktop, key === "strict");
              if (key === "block-node") {
                await attr(s.getByRole("tree"), "data-tree-block-node", "true");
                const bounds = await s.getByRole("tree").boundingBox();
                if (!bounds) throw Error("Tree geometry missing");
                for (const k of ["1", "1-1", "1-2-1"]) {
                  await attr(row(s, k), "data-tree-block-node", "true");
                  const b = await row(s, k).boundingBox();
                  expect(Math.abs(b!.width - bounds.width) < 1).toBe(true);
                  expect(
                    await row(s, k).evaluate((e) =>
                      getComputedStyle(e).borderRadius
                    ),
                  ).toBe("0px");
                }
                expect(
                  await row(s, "1-2-1").evaluate((e) =>
                    getComputedStyle(e).backgroundColor
                  ),
                ).not.toBe("rgba(0, 0, 0, 0)");
              }
            }
            await isolated(p, key);
          },
          DOCS_BROWSER_CONFIG,
        );
      }
    }
  }
});
