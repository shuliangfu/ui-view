/** WRITTEN-UNRUN: native actions and exact DOM/geometry contracts; run only after all inventory is written. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG, sharedEnv } from "../helpers.ts";
import { attr, eventually, example as demo, open } from "./driver.ts";
async function css(el: Locator, key: string, value: string) {
  expect(
    await el.evaluate((e, k) => getComputedStyle(e).getPropertyValue(k), key),
  ).toBe(value);
}
async function text(el: Locator, value: string) {
  expect((await el.textContent())?.trim()).toBe(value);
}
async function shown(el: Locator, n = 1) {
  await eventually(async () => await el.count() === n);
}
async function held(el: Locator) {
  await el.click({ delay: 180 });
}

describe("Feedback display written", () => {
  for (
    const [title, messages, tones] of [
      ["类型", [
        "操作成功",
        "这是一条信息提示",
        "请注意当前操作可能影响数据",
        "操作失败，请重试",
      ], ["green", "blue", "amber", "red"]],
      ["带描述", ["提示标题"], ["blue"]],
      ["自定义操作", ["有新版本可用"], ["blue"]],
      ["不显示图标（showIcon=false）", ["仅文案，不显示左侧图标"], ["blue"]],
      ["横幅样式（banner）", ["整行横幅提示，常用于页面顶部"], ["amber"]],
    ] as const
  ) {
    it("Alert展示：" + title, async (t) => {
      const p = await open(t, "/desktop/feedback/alert"),
        s = demo(p, title),
        alerts = s.getByRole("alert");
      expect(await alerts.count()).toBe(messages.length);
      for (let i = 0; i < messages.length; i++) {
        const a = alerts.nth(i);
        await text(a.locator(":scope > div.flex-1 > div").first(), messages[i]);
        expect(
          (await a.getAttribute("class"))?.split(/\s+/).includes(
            "bg-" + tones[i] + "-50",
          ),
        ).toBe(true);
        await css(a, "border-left-width", "4px");
        // 类型图标经 Icon 容器渲染为 span[role=img] > svg，不是 span > svg。
        expect(await a.locator(":scope > span [role='img'] svg").count()).toBe(
          title.startsWith("不显示") ? 0 : 1,
        );
        expect(
          await a.getByRole("button", { name: "关闭", exact: true }).count(),
        )
          .toBe(0);
        if (title === "带描述") {
          await text(
            a.locator(":scope > div.flex-1 > div").nth(1),
            "这里是补充描述，可多行说明当前状态或后续操作建议。",
          );
          await css(a, "align-items", "flex-start");
        } else if (title === "自定义操作") {
          await text(
            a.locator(":scope > div.flex-1 > div").nth(1),
            "当前为 v1.0，可升级至 v2.0。",
          );
          // This live demo has no upgrade handler; do not invent an actual release or purchase.
          const url = p.url(), before = await a.textContent();
          for (const method of ["click", "Enter", "Space"]) {
            const b = a.getByRole("button", { name: "立即升级", exact: true });
            if (method === "click") await held(b);
            else await b.press(method);
            expect(p.url()).toBe(url);
            expect(await a.textContent()).toBe(before);
          }
        } else {
          await css(a, "align-items", "center");
          expect(await a.locator(":scope > div.flex-1 > div").count()).toBe(1);
        }
        if (title === "横幅样式（banner）") {
          await css(a, "border-radius", "0px");
        }
        const b = await a.boundingBox();
        const parent = await a.evaluate((el) => {
          let n = el.parentElement;
          while (n && getComputedStyle(n).display === "contents") {
            n = n.parentElement;
          }
          if (!n) return null;
          const r = n.getBoundingClientRect();
          return { width: r.width };
        });
        if (!b || !parent) throw new Error("Alert geometry missing");
        expect(Math.abs(b.width - parent.width) < 2).toBe(true);
      }
    }, DOCS_BROWSER_CONFIG);
  }
  it(
    "Alert可关闭：按住跨timer释放、重开/键盘、实例隔离和刷新恢复",
    async (t) => {
      const p = await open(t, "/desktop/feedback/alert"),
        s = p.getByTestId("alert-closable-demo"),
        other = p.getByTestId("alert-close-prompt-demo");
      for (const method of ["click", "Enter", "Space"]) {
        const a = s.getByRole("alert");
        await shown(a);
        await text(a.locator(".font-medium"), "可关闭的提示");
        const b = a.getByRole("button", { name: "关闭", exact: true }),
          box = await b.boundingBox();
        if (!box) throw new Error("Close geometry missing");
        expect(Math.abs(box.width - box.height) < 1).toBe(true);
        expect(box.width).toBe(24);
        expect(box.height).toBe(24);
        if (method === "click") await held(b);
        else await b.press(method);
        await shown(a, 0);
        await shown(
          s.getByRole("button", { name: "重新显示提示", exact: true }),
        );
        await shown(other.getByRole("alert"));
        await held(
          s.getByRole("button", { name: "重新显示提示", exact: true }),
        );
        await shown(a);
      }
      await held(s.getByRole("button", { name: "关闭", exact: true }));
      await shown(s.getByRole("alert"), 0);
      await p.reload();
      await shown(p.getByTestId("alert-closable-demo").getByRole("alert"));
    },
    DOCS_BROWSER_CONFIG,
  );

  for (const persistent of [false, true]) {
    it(
      "Alert" +
        (persistent ? "关闭确认cookie持久化" : "关闭提示取消确认") +
        "：真实关闭/取消/外部点击/确定/刷新/重新显示",
      async (t) => {
        const p = await open(t, "/desktop/feedback/alert"),
          s = p.getByTestId(
            persistent ? "alert-close-confirm-demo" : "alert-close-prompt-demo",
          ),
          a = s.getByRole("alert"),
          key = "docs-alert-close-confirm";
        if (!t?.browser) {
          throw new Error("Physical tests require Playwright Page");
        }
        if (
          await s.getByRole("button", { name: "重新显示提示", exact: true })
            .count()
        ) {
          await held(
            s.getByRole("button", { name: "重新显示提示", exact: true }),
          );
        }
        const cookie = async () =>
          (await p.context().cookies(p.url())).filter((c) => c.name === key);
        if (persistent) expect(await cookie()).toEqual([]);
        const panel = p.locator("[data-dreamer-popconfirm-panel]");
        for (const dismiss of ["取消", "outside"]) {
          await held(a.getByRole("button", { name: "关闭", exact: true }));
          await shown(panel);
          await shown(a);
          await text(
            panel.locator(".text-sm.mb-3"),
            persistent ? "关闭后将不再提示" : "你确认要关闭吗？",
          );
          const ok = await panel.getByRole("button", {
              name: "确定",
              exact: true,
            }).boundingBox(),
            cancel = await panel.getByRole("button", {
              name: "取消",
              exact: true,
            }).boundingBox();
          if (!ok || !cancel) throw new Error("Popconfirm actions missing");
          expect(ok.x < cancel.x).toBe(true);
          if (dismiss === "取消") {
            await held(
              panel.getByRole("button", { name: "取消", exact: true }),
            );
          } else {
            await p.waitForTimeout(80);
            await held(
              p.getByRole("heading", { name: "Alert 静态提示条", exact: true }),
            );
          }
          await shown(panel, 0);
          await shown(a);
          if (persistent) expect(await cookie()).toEqual([]);
        }
        await a.getByRole("button", { name: "关闭", exact: true }).press(
          "Enter",
        );
        await shown(panel);
        const since = Date.now() / 1000;
        await panel.getByRole("button", { name: "确定", exact: true }).press(
          "Space",
        );
        await shown(a, 0);
        await shown(panel, 0);
        await shown(
          s.getByRole("button", { name: "重新显示提示", exact: true }),
        );
        if (persistent) {
          const cs = await cookie();
          expect(cs.length).toBe(1);
          const c = cs[0];
          expect([c.name, c.value, c.path, c.sameSite, c.httpOnly]).toEqual([
            key,
            "1",
            "/",
            "Lax",
            false,
          ]);
          expect(Math.abs(c.expires - since - 365 * 86400) < 10).toBe(true);
        }
        // reload 后须等 Dreamer 事件句柄；否则关闭/重新显示的 click 落在 hydration 窗口，面板或 Alert 都不会出现。
        await p.reload();
        await sharedEnv.waitDocMainReady(t);
        if (persistent) {
          await shown(
            s.getByRole("button", { name: "重新显示提示", exact: true }),
          );
          expect(await a.count()).toBe(0);
          await held(
            s.getByRole("button", { name: "重新显示提示", exact: true }),
          );
          await shown(a);
          expect(await cookie()).toEqual([]);
          await p.reload();
          await sharedEnv.waitDocMainReady(t);
          await shown(a);
        } else {
          await shown(a);
          expect(
            await s.getByRole("button", { name: "重新显示提示", exact: true })
              .count(),
          ).toBe(0);
          await held(a.getByRole("button", { name: "关闭", exact: true }));
          await shown(panel);
          await held(panel.getByRole("button", { name: "确定", exact: true }));
          await shown(a, 0);
          await held(
            s.getByRole("button", { name: "重新显示提示", exact: true }),
          );
          await shown(a);
        }
      },
      DOCS_BROWSER_CONFIG,
    );
  }

  it("Tag：variant完整文案及语义色、轮廓透明度", async (t) => {
    const p = await open(t, "/desktop/data-display/tag"),
      s = demo(p, "variant");
    for (
      const [label, background, foreground] of [
        ["默认", "bg-slate-100", "text-slate-700"],
        ["Primary", "bg-blue-100", "text-blue-700"],
        ["Success", "bg-green-100", "text-green-700"],
        ["Warning", "bg-amber-100", "text-amber-700"],
        ["Danger", "bg-red-100", "text-red-700"],
        ["Outline", "bg-transparent", "text-slate-700"],
      ]
    ) {
      const tag = s.getByText(label, { exact: true }),
        cs = (await tag.getAttribute("class"))?.split(/\s+/);
      expect(cs?.includes(background)).toBe(true);
      expect(cs?.includes(foreground)).toBe(true);
      await css(tag, "border-top-width", "1px");
      if (label === "Outline") {
        await css(tag, "background-color", "rgba(0, 0, 0, 0)");
      }
    }
  }, DOCS_BROWSER_CONFIG);
  it("Tag：size / closable真实关闭更新且其它尺寸保留", async (t) => {
    const p = await open(t, "/desktop/data-display/tag"),
      s = demo(p, "size / closable");
    for (
      const [label, font, px, py] of [["xs", 12, 6, 2], ["sm", 12, 8, 4], [
        "md",
        14,
        10,
        4,
      ], ["lg", 16, 12, 6]] as const
    ) {
      const tag = s.getByText(label, { exact: true });
      await css(tag, "font-size", font + "px");
      await css(tag, "padding-left", px + "px");
      await css(tag, "padding-top", py + "px");
    }
    const tag = s.locator("span.inline-flex").filter({ hasText: "可关闭" });
    await shown(tag);
    await held(tag.getByRole("button", { name: "关闭", exact: true }));
    await shown(tag, 0);
    expect(await s.getByRole("button", { name: "关闭", exact: true }).count())
      .toBe(0);
    for (const label of ["xs", "sm", "md", "lg"]) {
      await shown(s.getByText(label, { exact: true }));
    }
  }, DOCS_BROWSER_CONFIG);
  it(
    "Tag：disabled / rounded实际命中禁用项不变、圆角DOM",
    async (t) => {
      const p = await open(t, "/desktop/data-display/tag"),
        s = demo(p, "disabled / rounded"),
        disabled = s.getByText("disabled", { exact: true }),
        rounded = s.getByText("rounded", { exact: true }),
        url = p.url();
      await css(disabled, "opacity", "0.6");
      await css(disabled, "cursor", "not-allowed");
      expect(await disabled.getByRole("button").count()).toBe(0);
      const before = await s.textContent();
      await held(disabled);
      expect(await s.textContent()).toBe(before);
      expect(p.url()).toBe(url);
      expect(
        (await rounded.getAttribute("class"))?.split(/\s+/).includes(
          "rounded-full",
        ),
      ).toBe(true);
      expect(
        await rounded.evaluate((e) =>
          parseFloat(getComputedStyle(e).borderTopLeftRadius) >=
            e.getBoundingClientRect().height / 2
        ),
      ).toBe(true);
    },
    DOCS_BROWSER_CONFIG,
  );

  for (
    const [title, description, simple, button] of [
      ["默认", "暂无数据", false, ""],
      ["simple + footer", "没有找到相关结果", true, "新建"],
      ["自定义 footer", "自定义插图可通过 image 传入节点", false, "刷新"],
    ] as const
  ) {
    it("Empty：" + title, async (t) => {
      const p = await open(t, "/desktop/data-display/empty"),
        s = demo(p, title),
        status = s.getByRole("status", { name: "空状态", exact: true }),
        svg = status.locator("svg");
      await text(status.locator("p"), description);
      await attr(svg, "aria-hidden", "true");
      await attr(svg, "viewBox", "0 0 24 24");
      await css(svg, "width", simple ? "64px" : "96px");
      await css(svg, "height", simple ? "64px" : "96px");
      await css(status, "align-items", "center");
      await css(status, "text-align", "center");
      expect(await status.getByRole("button").count()).toBe(button ? 1 : 0);
      if (button) {
        const b = status.getByRole("button", { name: button, exact: true }),
          url = p.url(),
          content = await status.textContent();
        for (const method of ["click", "Enter", "Space"]) {
          if (method === "click") await held(b);
          else await b.press(method);
          expect(p.url()).toBe(url);
          expect(await status.textContent()).toBe(content);
          await shown(status);
        }
      }
    }, DOCS_BROWSER_CONFIG);
  }

  for (
    const [title, variants] of [
      ["成功", [[
        "操作成功",
        "您的申请已提交，我们将在 1-3 个工作日内处理。",
        "green",
        ["返回列表"],
      ]]],
      ["失败", [["提交失败", "请检查网络后重试，或联系客服。", "red", [
        "返回",
        "重试",
      ]]]],
      ["信息 / 警告", [["提示", "当前为信息类结果页。", "blue", ["知道了"]], [
        "注意",
        "请确认后再继续操作。",
        "amber",
        ["确认"],
      ]]],
      ["403 / 404", [
        ["无权限", "您没有权限访问该页面。", "slate", ["返回首页"]],
        ["页面不存在", "请检查链接或返回首页。", "slate", ["返回首页"]],
      ]],
    ] as const
  ) {
    it("Result：" + title + "全部按钮和结果态", async (t) => {
      const p = await open(t, "/desktop/feedback/result"), s = demo(p, title);
      for (const [heading, subtitle, tone, buttons] of variants) {
        const h = s.getByRole("heading", { name: heading, exact: true }),
          root = h.locator(".."),
          icon = root.locator(":scope > span");
        await text(root.locator(":scope > p"), subtitle);
        await css(root, "align-items", "center");
        await css(root, "text-align", "center");
        await css(icon, "width", "64px");
        await css(icon, "height", "64px");
        expect(
          (await icon.getAttribute("class"))?.split(/\s+/).includes(
            "text-" + tone + (tone === "slate" ? "-500" : "-600"),
          ),
        ).toBe(true);
        expect(await icon.locator("svg").count()).toBe(1);
        expect(await root.getByRole("button").allTextContents()).toEqual([
          ...buttons,
        ]);
        // Current live extra buttons are intentionally handler-free; check their actual no-op contract, not fictional navigation/submission.
        const url = p.url(), before = await root.textContent();
        for (const button of buttons) {
          const b = root.getByRole("button", { name: button, exact: true });
          for (const method of ["click", "Enter", "Space"]) {
            if (method === "click") await held(b);
            else await b.press(method);
            expect(p.url()).toBe(url);
            expect(await root.textContent()).toBe(before);
          }
        }
      }
    }, DOCS_BROWSER_CONFIG);
  }

  async function lines(s: Locator) {
    return await s.evaluate((root) =>
      Array.from(root.querySelectorAll("div")).filter((e) =>
        e.style.height.endsWith("px") &&
        e.firstElementChild instanceof HTMLElement &&
        e.firstElementChild.style.width.endsWith("%")
      ).map((e) => {
        const b = e.firstElementChild as HTMLElement,
          track = e.getBoundingClientRect(),
          bar = b.getBoundingClientRect();
        return {
          percent: parseFloat(b.style.width),
          height: parseFloat(e.style.height),
          info: e.parentElement?.querySelector(":scope > span")?.textContent
            ?.trim() ?? null,
          classes: b.className,
          color: getComputedStyle(b).backgroundColor,
          trail: getComputedStyle(e).backgroundColor,
          ratio: bar.width / track.width,
          trackWidth: track.width,
        };
      })
    );
  }
  async function ring(
    svg: Locator,
    percent: number,
    size: number,
    strokeWidth: number,
    stroke: string,
  ) {
    await attr(svg, "width", String(size));
    await attr(svg, "height", String(size));
    const cs = svg.locator("circle");
    expect(await cs.count()).toBe(2);
    const r = (size - strokeWidth) / 2, c = 2 * Math.PI * r;
    for (const index of [0, 1]) {
      await attr(cs.nth(index), "cx", String(size / 2));
      await attr(cs.nth(index), "cy", String(size / 2));
      await attr(cs.nth(index), "r", String(r));
      await attr(cs.nth(index), "stroke-width", String(strokeWidth));
    }
    await attr(cs.nth(1), "stroke", stroke);
    expect(
      Math.abs(Number(await cs.nth(1).getAttribute("stroke-dasharray")) - c) <
        1e-8,
    ).toBe(true);
    expect(
      Math.abs(
        Number(await cs.nth(1).getAttribute("stroke-dashoffset")) -
          (1 - percent / 100) * c,
      ) < 1e-8,
    ).toBe(true);
    await text(svg.locator("..").locator(":scope > span"), percent + "%");
  }
  for (
    const title of [
      "线性",
      "不显示百分比",
      "自定义 format",
      "线性 strokeWidth / strokeColor / trailColor",
    ]
  ) {
    it("Progress：" + title + "精确数值样式与实际条宽", async (t) => {
      const p = await open(t, "/desktop/feedback/progress"),
        s = demo(p, title),
        expected = title === "线性"
          ? [30, 70, 100, 45]
          : title === "不显示百分比"
          ? [60]
          : title === "自定义 format"
          ? [3]
          : [50, 60];
      await eventually(async () => {
        const ls = await lines(s);
        return ls.length === expected.length &&
          ls.every((l, i) =>
            Math.abs(l.ratio - expected[i] / 100) * l.trackWidth <= 1
          );
      });
      const ls = await lines(s);
      expect(ls.map((l) => l.percent)).toEqual(expected);
      expect(ls.map((l) => l.info)).toEqual(
        title === "不显示百分比"
          ? [null]
          : title === "自定义 format"
          ? ["3/10 步"]
          : expected.map((n) => n + "%"),
      );
      expect(ls.map((l) => l.height)).toEqual(
        title.startsWith("线性 stroke") ? [12, 8] : expected.map(() => 8),
      );
      if (title === "线性") {
        for (
          const [i, cls] of [
            "bg-blue-500",
            "bg-green-500",
            "bg-red-500",
            "bg-blue-500",
          ].entries()
        ) expect(ls[i].classes.split(/\s+/).includes(cls)).toBe(true);
        expect(ls[3].classes.split(/\s+/).includes("animate-pulse")).toBe(true);
      }
      if (title.startsWith("线性 stroke")) {
        expect(ls[1].color).toBe("rgb(34, 197, 94)");
        expect(ls[1].trail).toBe("rgb(226, 232, 240)");
      }
    }, DOCS_BROWSER_CONFIG);
  }
  it("Progress：环形三实例精确圆周/偏移/尺寸/颜色", async (t) => {
    const p = await open(t, "/desktop/feedback/progress"),
      svgs = demo(p, "环形").locator("svg:has(> circle)");
    expect(await svgs.count()).toBe(3);
    await ring(svgs.nth(0), 75, 120, 6, "#3b82f6");
    await ring(svgs.nth(1), 100, 120, 6, "#22c55e");
    await ring(svgs.nth(2), 30, 80, 4, "#3b82f6");
  }, DOCS_BROWSER_CONFIG);
  it(
    "Progress：动态进度0到100、原生重放与进行中重置，线/环始终同值",
    async (t) => {
      const p = await open(t, "/desktop/feedback/progress"),
        s = demo(p, "动态进度（0 → 100）"),
        replay = s.getByRole("button", { name: "重新播放", exact: true }),
        svg = s.locator("svg:has(> circle)");
      const snapshot = () =>
        s.evaluate((root) => {
          const bar = Array.from(root.querySelectorAll("div")).find((e) =>
              e.style.width.endsWith("%")
            ),
            sv = root.querySelector("svg:has(> circle)"),
            percent = parseFloat(bar?.style.width ?? "NaN"),
            offset = Number(
              sv?.querySelectorAll("circle")[1]?.getAttribute(
                "stroke-dashoffset",
              ),
            ),
            circ = Number(
              sv?.querySelectorAll("circle")[1]?.getAttribute(
                "stroke-dasharray",
              ),
            );
          return {
            percent,
            linear: bar?.parentElement?.parentElement?.querySelector(
              ":scope > span",
            )?.textContent?.trim(),
            circular: sv?.parentElement?.querySelector(":scope > span")
              ?.textContent?.trim(),
            ringPercent: (1 - offset / circ) * 100,
          };
        });
      for (const method of ["click", "Enter", "Space"]) {
        await s.getByText("100%", { exact: true }).first().waitFor({
          state: "visible",
          timeout: 10000,
        });
        if (method === "click") await held(replay);
        else await replay.press(method);
        await eventually(async () => (await snapshot()).percent < 100);
        await eventually(async () => {
          const v = await snapshot();
          return v.percent > 0 && v.percent < 75;
        });
        const before = await snapshot();
        expect(before.linear).toBe(before.percent + "%");
        expect(before.circular).toBe(before.percent + "%");
        expect(Math.abs(before.ringPercent - before.percent) < 1e-8).toBe(true);
        await eventually(async () => (await snapshot()).percent >= 35);
        const high = (await snapshot()).percent;
        await held(replay);
        expect((await snapshot()).percent < high).toBe(true);
        await s.getByText("100%", { exact: true }).first().waitFor({
          state: "visible",
          timeout: 10000,
        });
        const done = await snapshot();
        expect([done.percent, done.linear, done.circular, done.ringPercent])
          .toEqual([100, "100%", "100%", 100]);
        await ring(svg, 100, 100, 6, "#3b82f6");
        await eventually(async () =>
          (await lines(s)).every((l) =>
            Math.abs(l.ratio - 1) * l.trackWidth <= 1
          )
        );
      }
    },
    DOCS_BROWSER_CONFIG,
  );
});
