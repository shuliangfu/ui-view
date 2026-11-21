/** WRITTEN-UNRUN. Three live Popconfirm examples; native mouse/keyboard. Escape is not a product close path. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, example, open } from "./driver.ts";

const panel = (p: Page) => p.locator("[data-dreamer-popconfirm-panel]");
const near = (a: number, b: number) =>
  expect(Math.abs(a - b)).toBeLessThanOrEqual(1.5);

async function boxOf(el: Locator) {
  const r = await el.boundingBox();
  if (!r) throw Error("Visible popconfirm geometry required");
  return r;
}

function collectLogs(p: Page) {
  const logs: string[] = [];
  const on = (msg: { type: () => string; text: () => string }) => {
    if (msg.type() === "log") logs.push(msg.text());
  };
  p.on("console", on);
  return {
    logs,
    stop: () => p.off("console", on),
  };
}

async function placed(trigger: Locator, pop: Locator, expectedPrefix: string) {
  await eventually(async () => {
    const place = await pop.getAttribute("data-dreamer-placement");
    const tr = await trigger.boundingBox();
    const pr = await pop.boundingBox();
    return !!place && place.startsWith(expectedPrefix) && !!tr && !!pr &&
      pr.width >= 199;
  });
  const place = await pop.getAttribute("data-dreamer-placement");
  expect(place?.startsWith(expectedPrefix)).toBe(true);
  const tr = await boxOf(trigger), pr = await boxOf(pop);
  if (expectedPrefix === "bottom") {
    expect(pr.y).toBeGreaterThanOrEqual(tr.y + tr.height - 8);
  }
  if (expectedPrefix === "top") {
    expect(pr.y + pr.height).toBeLessThanOrEqual(tr.y + 8);
  }
  if (expectedPrefix === "left" || (place ?? "").endsWith("Left")) {
    expect(pr.x + pr.width).toBeLessThanOrEqual(tr.x + tr.width + 8);
  }
  expect(await pop.locator("[data-dreamer-arrow]").count()).toBe(1);
  return place!;
}

async function openOne(
  p: Page,
  root: Locator,
  opener: string,
  title: string,
  ok: string,
  variant: string,
  prefix: string,
) {
  const button = root.getByRole("button", { name: opener, exact: true });
  await button.click({ delay: 180 });
  const pop = panel(p);
  await pop.waitFor({ state: "visible" });
  expect(await pop.count()).toBe(1);
  expect(
    await pop.evaluate((e) =>
      document.body.contains(e) && document.querySelector("main") !== null &&
      !document.querySelector("main")!.contains(e)
    ),
  ).toBe(true);
  expect(await pop.locator("div.text-sm.mb-3").innerText()).toBe(title);
  const yes = pop.getByRole("button", { name: ok, exact: true });
  const no = pop.getByRole("button", { name: "取消", exact: true });
  expect(await yes.getAttribute("data-variant")).toBe(variant);
  expect((await boxOf(yes)).x).toBeLessThan((await boxOf(no)).x);
  near((await boxOf(yes)).y, (await boxOf(no)).y);
  await placed(button, pop, prefix);
  return { button, pop, yes, no };
}

describe("Popconfirm physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `Popconfirm 受控示例：普通 / 警告 / 危险 @${width}：三种语义关闭/外部关闭/ESC不关/控制台结果`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/popconfirm");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "受控示例：普通 / 警告 / 危险");
        const sink = collectLogs(p);
        try {
          const demos = [
            {
              opener: "普通确认",
              title: "确定要执行该操作吗？",
              ok: "确定",
              variant: "primary",
              prefix: "bottom",
              confirm: "普通确认：已确定",
              cancel: "普通确认：已取消",
              icon: "text-slate-400",
            },
            {
              opener: "warning",
              title: "该操作可能影响性能或产生额外费用，是否继续？",
              ok: "继续",
              variant: "warning",
              prefix: "top",
              confirm: "警告确认：已继续",
              cancel: "警告确认：已取消",
              icon: "text-amber-500",
            },
            {
              opener: "删除",
              title: "删除后无法恢复，确定删除吗？",
              ok: "删除",
              variant: "danger",
              prefix: "top",
              confirm: "危险操作：已确认删除",
              cancel: "危险操作：已取消删除",
              icon: "text-red-500",
            },
          ];
          for (const demo of demos) {
            for (const action of ["confirm", "取消", "outside"]) {
              const s = await openOne(
                p,
                root,
                demo.opener,
                demo.title,
                demo.ok,
                demo.variant,
                demo.prefix,
              );
              const icon = s.pop.locator("span.shrink-0").first();
              expect(
                await icon.evaluate(
                  (e, cls) => e.classList.contains(cls),
                  demo.icon,
                ),
              ).toBe(true);
              expect(await icon.evaluate((e) => getComputedStyle(e).color)).not
                .toBe("rgba(0, 0, 0, 0)");
              await p.keyboard.press("Escape");
              expect(await s.pop.isVisible()).toBe(true);
              const before = sink.logs.length;
              if (action === "outside") {
                await p.waitForTimeout(50);
                // example() 是标题后的预览容器，不含标题本身；点标题作为面板外关闭。
                await p.getByRole("heading", {
                  name: "受控示例：普通 / 警告 / 危险",
                  exact: true,
                }).click({ delay: 180 });
              } else if (action === "confirm") await s.yes.press("Enter");
              else await s.no.press("Space");
              await eventually(async () => await panel(p).count() === 0);
              const added = sink.logs.slice(before);
              if (action === "outside") expect(added).toEqual([]);
              else {expect(added).toEqual([
                  action === "confirm" ? demo.confirm : demo.cancel,
                ]);}
            }
          }
          // Opening warning after a settled ordinary confirm: the previous panel is gone; only the warning title is shown.
          await openOne(
            p,
            root,
            "warning",
            demos[1].title,
            "继续",
            "warning",
            "top",
          );
          expect(await panel(p).locator("div.text-sm.mb-3").innerText()).toBe(
            demos[1].title,
          );
          await p.waitForTimeout(50);
          await root.getByRole("button", { name: "普通确认", exact: true })
            .click(
              { delay: 180 },
            );
          await eventually(async () =>
            await panel(p).count() === 1 &&
            await panel(p).locator("div.text-sm.mb-3").innerText() ===
              demos[0].title
          );
          await p.mouse.click(4, 4, { delay: 180 });
          await eventually(async () => await panel(p).count() === 0);
        } finally {
          sink.stop();
        }
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Popconfirm 贴边自动翻转（placement=auto） @${width}：向左展开且取消完整可见`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/popconfirm");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "贴边自动翻转（placement=auto）");
        const sink = collectLogs(p);
        try {
          const button = root.getByRole("button", {
            name: "靠右删除",
            exact: true,
          });
          await button.click({ delay: 180 });
          const pop = panel(p);
          await pop.waitFor({ state: "visible" });
          expect(await pop.locator("div.text-sm.mb-3").innerText()).toBe(
            "删除后无法恢复，确定删除吗？",
          );
          // auto 优选上方；右侧被挡住时交叉轴改为 *Right（面板向左展开），
          // 或主轴翻到 left*。二者都满足「向左展开且取消完整可见」。
          const opensLeftward = (place: string | null) =>
            !!place && (place.startsWith("left") || place.endsWith("Right"));
          await eventually(async () =>
            opensLeftward(await pop.getAttribute("data-dreamer-placement"))
          );
          const place = await pop.getAttribute("data-dreamer-placement") ?? "";
          expect(opensLeftward(place)).toBe(true);
          const pr = await boxOf(pop),
            tr = await boxOf(button),
            cancel = await boxOf(
              pop.getByRole("button", { name: "取消", exact: true }),
            );
          expect(pr.x).toBeGreaterThanOrEqual(0);
          expect(pr.x + pr.width).toBeLessThanOrEqual(width + 1);
          expect(cancel.x + cancel.width).toBeLessThanOrEqual(width - 1);
          expect(pr.x + pr.width).toBeLessThanOrEqual(tr.x + tr.width + 8);
          expect(
            await pop.getByRole("button", { name: "删除", exact: true })
              .getAttribute("data-variant"),
          ).toBe("danger");
          await pop.getByRole("button", { name: "删除", exact: true }).click({
            delay: 180,
          });
          await eventually(async () => await panel(p).count() === 0);
          expect(sink.logs.filter((l) => l.startsWith("auto："))).toEqual([
            "auto：已确认删除",
          ]);
        } finally {
          sink.stop();
        }
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Popconfirm 异步确认（onConfirm 返回 Promise） @${width}：loading 期间取消与外部不关/成功后关闭`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/popconfirm");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "异步确认（onConfirm 返回 Promise）");
        const button = root.getByRole("button", { name: "发送", exact: true });
        await button.click({ delay: 180 });
        const pop = panel(p);
        await pop.waitFor({ state: "visible" });
        expect(await pop.locator("div.text-sm.mb-3").innerText()).toBe(
          "确认发送重置邮件？",
        );
        const yes = pop.getByRole("button", { name: "确定", exact: true });
        const no = pop.getByRole("button", { name: "取消", exact: true });
        expect(await yes.getAttribute("data-variant")).toBe("primary");
        expect(await yes.isDisabled()).toBe(false);
        await p.waitForTimeout(50);
        // example() 是标题后的预览容器，不含标题本身；点标题作为面板外关闭。
        await p.getByRole("heading", {
          name: "异步确认（onConfirm 返回 Promise）",
          exact: true,
        }).click({ delay: 180 });
        await eventually(async () => await panel(p).count() === 0);
        await button.click({ delay: 180 });
        await pop.waitFor({ state: "visible" });
        const started = Date.now();
        await yes.click({ delay: 180 });
        await eventually(async () =>
          await yes.getAttribute("aria-busy") === "true"
        );
        expect(await yes.isDisabled()).toBe(true);
        expect(await no.isDisabled()).toBe(true);
        expect(await yes.locator("svg.animate-spin").count()).toBe(1);
        const cr = await boxOf(no);
        await p.mouse.click(cr.x + cr.width / 2, cr.y + cr.height / 2, {
          delay: 180,
        });
        await p.mouse.click(4, 4, { delay: 180 });
        expect(await pop.isVisible()).toBe(true);
        expect(await yes.getAttribute("aria-busy")).toBe("true");
        // 800ms Promise 从点击确定起算；固定再等 400ms 可能已经超过完成点。
        // 只在仍处于 loading 窗口内再断言仍打开，然后等成功关闭。
        const elapsed = Date.now() - started;
        if (elapsed < 700) {
          await p.waitForTimeout(Math.min(400, 700 - elapsed));
          expect(await pop.isVisible()).toBe(true);
          expect(await yes.getAttribute("aria-busy")).toBe("true");
        }
        await eventually(async () => await panel(p).count() === 0);
        expect(Date.now() - started).toBeGreaterThanOrEqual(800);
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
