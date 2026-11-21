import { describe, expect, it } from "@dreamer/test";
import type { Locator } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, open, section, visible } from "./driver.ts";
const trigger = (demo: Locator) =>
  demo.locator("button[aria-haspopup]").first();
async function cascade(button: Locator, labels: string[]) {
  if (await button.getAttribute("aria-expanded") !== "true") {
    await button.click();
  }
  const panel = button.page().getByRole("dialog");
  await visible(panel);
  for (const name of labels) {
    await panel.getByRole("button", { name, exact: true }).click({
      delay: 150,
    });
  }
  await attr(button, "aria-label", labels.join(" / "));
  await attr(button, "aria-expanded", "false");
}
async function tree(button: Locator, label: string) {
  await button.click();
  const list = button.page().getByRole("listbox");
  await visible(list);
  await list.getByRole("option", { name: label, exact: true }).click({
    delay: 180,
  });
  await attr(button, "aria-label", label);
  await attr(button, "aria-expanded", "false");
}

describe("Hierarchy physical", () => {
  it("物理操作 Cascader：三级/二级路径、切换分支与占位重置", async (t) => {
    const page = await open(t, "/desktop/form/cascader");
    const deep = trigger(section(page, "静态数据（多级嵌套）"));
    await cascade(deep, ["浙江", "杭州", "西湖区"]);
    await deep.click();
    await page.getByRole("dialog").getByRole("button", {
      name: "江苏",
      exact: true,
    }).click();
    await attr(deep, "aria-label", "江苏");
    expect(
      await page.getByRole("dialog").getByRole("button", {
        name: "西湖区",
        exact: true,
      }).count(),
    ).toBe(0);
    await page.getByRole("dialog").getByRole("button", {
      name: "苏州",
      exact: true,
    }).click();
    await attr(deep, "aria-label", "江苏 / 苏州");
    await attr(deep, "aria-expanded", "false");
    await deep.click();
    await page.getByRole("dialog").getByRole("button", {
      name: "请选择",
      exact: true,
    }).click();
    await attr(deep, "aria-label", "请选择");
    const two = trigger(section(page, "静态数据（二级：市 / 区）"));
    await cascade(two, ["宁波", "江北区"]);
  }, DOCS_BROWSER_CONFIG);

  it(
    "物理操作 Cascader：命名多隐藏域准确写入、选择父节点后外部关闭",
    async (t) => {
      const page = await open(t, "/desktop/form/cascader");
      const demo = section(page, "表单 name（多段隐藏域）"),
        button = trigger(demo);
      const hidden = demo.locator("input[type=hidden][name=region]");
      expect(
        await hidden.evaluateAll((els) =>
          els.map((el) => (el as HTMLInputElement).value)
        ),
      ).toEqual(["zhejiang", "hangzhou", "xihu"]);
      await cascade(button, ["江苏", "南京", "秦淮区"]);
      expect(
        await hidden.evaluateAll((els) =>
          els.map((el) => (el as HTMLInputElement).value)
        ),
      ).toEqual(["jiangsu", "nanjing", "qinhuai"]);
      await button.click();
      await page.getByRole("dialog").getByRole("button", {
        name: "浙江",
        exact: true,
      }).click();
      await page.getByRole("heading", {
        name: "Cascader 级联选择",
        exact: true,
      })
        .click();
      await attr(button, "aria-expanded", "false");
      await attr(button, "aria-label", "浙江");
      expect(
        await hidden.evaluateAll((els) =>
          els.map((el) => (el as HTMLInputElement).value)
        ),
      ).toEqual(["zhejiang"]);
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "物理操作 Cascader：异步两分支加载、等待中状态、缓存重开及显式叶子",
    async (t) => {
      const page = await open(t, "/desktop/form/cascader");
      const button = trigger(section(page, "动态加载（loadChildren）"));
      await button.click();
      let panel = page.getByRole("dialog");
      await panel.getByRole("button", { name: "浙江", exact: true }).click();
      await visible(panel.getByText("加载中…", { exact: true }));
      await panel.getByRole("button", { name: "杭州", exact: true }).click();
      await panel.getByRole("button", { name: "滨江区", exact: true }).click();
      await attr(button, "aria-label", "浙江 / 杭州 / 滨江区");
      await attr(button, "aria-expanded", "false");
      await button.click();
      panel = page.getByRole("dialog");
      await panel.getByRole("button", { name: "宁波", exact: true }).click();
      await panel.getByRole("button", { name: "海曙区", exact: true }).click();
      await attr(button, "aria-label", "浙江 / 宁波 / 海曙区");
      await attr(button, "aria-expanded", "false");
      await button.click();
      await visible(
        page.getByRole("dialog").getByRole("button", {
          name: "江北区",
          exact: true,
        }),
      );
      await page.getByRole("dialog").getByRole("button", {
        name: "江苏",
        exact: true,
      }).click();
      await attr(button, "aria-expanded", "false");
      await attr(button, "aria-label", "江苏");
    },
    DOCS_BROWSER_CONFIG,
  );

  it("物理操作 Cascader：四尺寸逐个选择、自动聚焦及键盘关闭", async (t) => {
    const page = await open(t, "/desktop/form/cascader");
    const auto = page.locator("#docs-autofocus-cascader");
    expect(await auto.evaluate((el) => el === document.activeElement)).toBe(
      true,
    );
    await cascade(auto, ["江苏", "苏州"]);
    const buttons = section(page, "size（xs / sm / md / lg）").locator(
      "button[aria-haspopup]",
    );
    expect(await buttons.count()).toBe(4);
    const heights = [];
    for (const button of await buttons.all()) {
      const b = await button.boundingBox();
      if (!b) throw new Error("missing cascader");
      heights.push(b.height);
      await cascade(button, ["浙江", "宁波", "江北区"]);
    }
    for (let i = 1; i < 4; i++) expect(heights[i] > heights[i - 1]).toBe(true);
    await auto.click();
    await page.keyboard.press("Escape");
    await attr(auto, "aria-expanded", "false");
    await attr(auto, "aria-label", "江苏 / 苏州");
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 Cascader：搜索叶路径/无结果/重置、清除与加载禁用", async (t) => {
    const page = await open(t, "/desktop/form/cascader");
    const demo = section(page, "清除、搜索与加载");
    const button = trigger(demo);
    await attr(button, "aria-label", "浙江 / 杭州 / 西湖区");
    await button.click();
    const panel = page.getByRole("dialog"),
      search = panel.getByRole("searchbox");
    await search.fill("not-existing");
    await visible(panel.getByText("无匹配选项", { exact: true }));
    expect(await panel.getByRole("button").count()).toBe(0);
    await search.fill("qinhuai");
    expect(await panel.getByRole("button").count()).toBe(1);
    await panel.getByRole("button", {
      name: "江苏 / 南京 / 秦淮区",
      exact: true,
    })
      .click();
    await attr(button, "aria-label", "江苏 / 南京 / 秦淮区");
    await attr(button, "aria-expanded", "false");
    await button.click();
    await visible(
      page.getByRole("dialog").getByRole("button", {
        name: "浙江",
        exact: true,
      }),
    );
    await page.keyboard.press("Escape");
    await demo.getByRole("button", { name: "清除", exact: true }).click();
    await attr(button, "aria-label", "可搜索并清除");
    await visible(
      demo.getByRole("button", { name: "清除", exact: true }),
      false,
    );
    const loading = demo.getByRole("button", { name: "加载中", exact: true });
    expect(await loading.isDisabled()).toBe(true);
    await attr(loading, "aria-busy", "true");
  }, DOCS_BROWSER_CONFIG);

  for (
    const [route, error, labels] of [["cascader", "请选择地区", [
      "浙江",
      "杭州",
      "西湖区",
    ]], ["tree-select", "请选择部门", ["研发 / 后端"]]] as const
  ) {
    it("物理操作 " + route + "：表单失败、选值提交及错误消失", async (t) => {
      const page = await open(t, "/desktop/form/" + route);
      const demo = section(page, "与 createForm"), button = trigger(demo);
      await demo.getByRole("button", { name: "提交", exact: true }).click();
      await visible(demo.getByText(error, { exact: true }));
      if (route === "cascader") await cascade(button, [...labels]);
      else await tree(button, labels[0]);
      await demo.getByRole("button", { name: "提交", exact: true }).click();
      await visible(page.getByText("已提交", { exact: true }));
      await visible(demo.getByText(error, { exact: true }), false);
    }, DOCS_BROWSER_CONFIG);
  }

  it(
    "物理操作 TreeSelect：基础父/子节点选择、重开选中、占位清空与外部关闭",
    async (t) => {
      const page = await open(t, "/desktop/form/tree-select");
      const demo = section(page, "基础用法"), button = trigger(demo);
      await tree(button, "研发 / 前端");
      await button.click();
      const list = page.getByRole("listbox");
      await attr(
        list.getByRole("option", { name: "研发 / 前端", exact: true }),
        "aria-selected",
        "true",
      );
      await list.getByRole("option", { name: "研发", exact: true }).click();
      await attr(button, "aria-label", "研发");
      await button.click();
      await page.getByRole("listbox").getByRole("option").first().click();
      await attr(button, "aria-label", "请选择");
      await button.click();
      await page.mouse.click(3, 3);
      await attr(button, "aria-expanded", "false");
    },
    DOCS_BROWSER_CONFIG,
  );

  it("物理操作 TreeSelect：深层缩进、命名隐藏值与禁用命中", async (t) => {
    const page = await open(t, "/desktop/form/tree-select");
    const deep = trigger(section(page, "多层级（缩进）"));
    await deep.click();
    const list = page.getByRole("listbox");
    const pads = await Promise.all(
      ["总公司", "总公司 / 华东区", "总公司 / 华东区 / 上海办"].map((name) =>
        list.getByRole("option", { name, exact: true }).evaluate((el) =>
          parseFloat(getComputedStyle(el).paddingLeft)
        )
      ),
    );
    expect(pads[1] > pads[0] && pads[2] > pads[1]).toBe(true);
    await list.getByRole("option", {
      name: "总公司 / 华东区 / 杭州办",
      exact: true,
    }).click();
    await attr(deep, "aria-label", "总公司 / 华东区 / 杭州办");
    const named = section(page, "name / id（表单）");
    const button = named.locator("#tree-dept-field");
    expect(await named.locator("input[name=deptId]").inputValue()).toBe("fe");
    await tree(button, "运维");
    expect(await named.locator("input[name=deptId]").inputValue()).toBe("ops");
    const disabled = trigger(section(page, "disabled"));
    expect(await disabled.isDisabled()).toBe(true);
    await attr(disabled, "aria-label", "研发 / 前端");
    await disabled.scrollIntoViewIfNeeded();
    const b = await disabled.boundingBox();
    if (!b) throw new Error("missing disabled");
    await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    await attr(disabled, "aria-expanded", "false");
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 TreeSelect：四尺寸选择与自动聚焦", async (t) => {
    const page = await open(t, "/desktop/form/tree-select");
    const auto = page.locator("#docs-autofocus-tree-select");
    expect(await auto.evaluate((el) => el === document.activeElement)).toBe(
      true,
    );
    await tree(auto, "研发 / 后端");
    const buttons = section(page, "size（xs / sm / md / lg）").locator(
      "button[aria-haspopup]",
    );
    expect(await buttons.count()).toBe(4);
    const heights = [];
    for (const button of await buttons.all()) {
      const b = await button.boundingBox();
      if (!b) throw new Error("missing tree size");
      heights.push(b.height);
      await tree(button, "运维");
    }
    for (let i = 1; i < 4; i++) expect(heights[i] > heights[i - 1]).toBe(true);
  }, DOCS_BROWSER_CONFIG);

  it(
    "物理操作 TreeSelect：搜索全路径/值、无结果恢复、清除与加载",
    async (t) => {
      const page = await open(t, "/desktop/form/tree-select");
      const demo = section(page, "清除、搜索与加载"), button = trigger(demo);
      await attr(button, "aria-label", "研发 / 前端");
      await button.click();
      let list = page.getByRole("listbox");
      const search = list.getByRole("searchbox");
      await search.fill("研发");
      expect(await list.getByRole("option").count()).toBe(4);
      await search.fill("not-exist");
      await visible(list.getByText("无匹配选项", { exact: true }));
      expect(await list.getByRole("option").count()).toBe(1);
      await search.fill("be");
      expect(await list.getByRole("option").count()).toBe(2);
      await list.getByRole("option", { name: "研发 / 后端", exact: true })
        .click({
          delay: 180,
        });
      await attr(button, "aria-label", "研发 / 后端");
      await button.click();
      list = page.getByRole("listbox");
      expect(await list.getByRole("option").count()).toBe(5);
      await page.keyboard.press("Escape");
      await attr(button, "aria-expanded", "false");
      await demo.getByRole("button", { name: "清除", exact: true }).click();
      await attr(button, "aria-label", "可搜索并清除");
      await visible(
        demo.getByRole("button", { name: "清除", exact: true }),
        false,
      );
      const loading = demo.getByRole("button", { name: "加载中", exact: true });
      expect(await loading.isDisabled()).toBe(true);
      await attr(loading, "aria-busy", "true");
    },
    DOCS_BROWSER_CONFIG,
  );
});
