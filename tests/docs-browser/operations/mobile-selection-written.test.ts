/** WRITTEN-UNRUN. Actual mobile doc instances, not synthetic dispatch or shallow dropdown probes. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, eventually, example as demo, open } from "./driver.ts";
type Kind = "select" | "multiselect" | "cascader" | "tree-select";
const kinds: Kind[] = ["select", "multiselect", "cascader", "tree-select"];
const trigger = (s: Locator) => s.locator("button[aria-haspopup]");
async function text(s: Locator, expected: string) {
  await eventually(async () => (await s.textContent())?.trim() === expected);
  expect((await s.textContent())?.trim()).toBe(expected);
}
async function click(s: Locator) {
  await s.click({ delay: 180 });
}
async function exactValue(s: Locator, value: string) {
  await eventually(async () => await s.inputValue() === value);
  expect(await s.inputValue()).toBe(value);
}
async function panel(p: Page, t: Locator, kind: Kind) {
  await click(t);
  await attr(t, "aria-expanded", "true");
  const s = p.getByRole(kind === "cascader" ? "dialog" : "listbox");
  expect(await s.count()).toBe(1);
  expect(await s.getByRole("searchbox").count()).toBe(0);
  return s;
}
async function outside(p: Page, t: Locator) {
  await p.mouse.click(5, 180, { delay: 180 });
  await attr(t, "aria-expanded", "false");
}
async function selectSingle(
  p: Page,
  s: Locator,
  initial: string,
  placeholder?: string,
  echo?: Locator,
) {
  const t = trigger(s), input = s.locator('input[type="hidden"]');
  await exactValue(input, initial);
  let old = initial;
  for (
    const [label, value, method] of [["选项 B", "b", "click"], [
      "选项 A",
      "a",
      "Enter",
    ]] as const
  ) {
    const list = await panel(p, t, "select");
    expect(await list.getByRole("option").allTextContents()).toEqual([
      ...(placeholder ? [placeholder] : []),
      "选项 A",
      "选项 B",
      "选项 C",
    ]);
    const disabled = list.getByRole("option", { name: "选项 C", exact: true });
    expect(await disabled.isDisabled()).toBe(true);
    await disabled.scrollIntoViewIfNeeded();
    const b = await disabled.boundingBox();
    if (!b) throw new Error("Disabled option missing");
    await p.mouse.click(b.x + b.width / 2, b.y + b.height / 2, { delay: 180 });
    await attr(t, "aria-expanded", "true");
    await exactValue(input, old);
    await attr(disabled, "aria-selected", "false");
    const option = list.getByRole("option", { name: label, exact: true });
    if (method === "click") await click(option);
    else await option.press(method);
    await attr(t, "aria-expanded", "false");
    await exactValue(input, value);
    await text(t, label);
    if (echo) await text(echo, "当前：" + value);
    const reopened = await panel(p, t, "select");
    for (
      const [name, v] of [["选项 A", "a"], ["选项 B", "b"], ["选项 C", "c"]]
    ) {
      await attr(
        reopened.getByRole("option", { name, exact: true }),
        "aria-selected",
        String(v === value),
      );
    }
    await p.keyboard.press("Escape");
    await attr(t, "aria-expanded", "false");
    old = value;
  }
  if (placeholder) {
    const list = await panel(p, t, "select");
    await list.getByRole("option", { name: placeholder, exact: true }).press(
      "Space",
    );
    await attr(t, "aria-expanded", "false");
    await exactValue(input, "");
    await text(t, placeholder);
  }
  await panel(p, t, "select");
  await outside(p, t);
}
async function selectedMulti(list: Locator, values: string[]) {
  await attr(list, "aria-multiselectable", "true");
  expect(await list.getByRole("option").allTextContents()).toEqual([
    "项 X",
    "项 Y",
    "项 Z",
  ]);
  for (const [key, label] of [["x", "项 X"], ["y", "项 Y"], ["z", "项 Z"]]) {
    const o = list.getByRole("option", { name: label, exact: true });
    await attr(o, "aria-selected", String(values.includes(key)));
    expect(await o.locator("svg").count()).toBe(values.includes(key) ? 1 : 0);
  }
}
async function multi(
  p: Page,
  s: Locator,
  initial: string[],
  placeholder = "请选择",
  echo?: Locator,
) {
  const t = trigger(s), list = await panel(p, t, "multiselect");
  let values = [...initial];
  await selectedMulti(list, values);
  for (
    const [key, label] of [["y", "项 Y"], ["z", "项 Z"], ["x", "项 X"], [
      "y",
      "项 Y",
    ]]
  ) {
    // Holding over multiple timers must still toggle exactly once after pointerup/click.
    await click(list.getByRole("option", { name: label, exact: true }));
    values = values.includes(key)
      ? values.filter((v) => v !== key)
      : [...values, key];
    await selectedMulti(list, values);
    await attr(t, "aria-expanded", "true");
    const summary = values.map((v) => ({ x: "项 X", y: "项 Y", z: "项 Z" }[v]))
      .join("、");
    await text(t, summary || placeholder);
    if (echo) await text(echo, "当前：" + (values.join(", ") || "（空）"));
  }
  const all = list.getByRole("button", { name: "全选", exact: true }),
    clear = list.getByRole("button", { name: "清空", exact: true });
  await click(clear);
  await selectedMulti(list, []);
  expect(await clear.isDisabled()).toBe(true);
  await text(t, placeholder);
  await all.press("Enter");
  await selectedMulti(list, ["x", "y", "z"]);
  expect(await all.isDisabled()).toBe(true);
  await text(t, "项 X、项 Y、项 Z");
  if (echo) await text(echo, "当前：x, y, z");
  await list.getByRole("button", { name: "完成", exact: true }).press("Space");
  await attr(t, "aria-expanded", "false");
  const again = await panel(p, t, "multiselect");
  await selectedMulti(again, ["x", "y", "z"]);
  await p.keyboard.press("Escape");
  await attr(t, "aria-expanded", "false");
  await text(t, "项 X、项 Y、项 Z");
  await panel(p, t, "multiselect");
  await outside(p, t);
  await panel(p, t, "multiselect");
  await click(clear);
  await selectedMulti(list, []);
  if (echo) await text(echo, "当前：（空）");
  await click(list.getByRole("button", { name: "完成", exact: true }));
  await text(t, placeholder);
  await attr(t, "aria-expanded", "false");
}
const treeOptions = [["研发", "dev"], ["研发 / 前端", "fe"], [
  "研发 / 后端",
  "be",
], ["运维", "ops"]] as const;
async function tree(p: Page, s: Locator, placeholder: string, initial = "") {
  const t = trigger(s), input = s.locator('input[type="hidden"]');
  await exactValue(input, initial);
  for (const [path, key] of treeOptions) {
    const list = await panel(p, t, "tree-select");
    expect(await list.getByRole("option").allTextContents()).toEqual([
      placeholder,
      "研发",
      "前端",
      "后端",
      "运维",
    ]);
    for (const [full] of treeOptions) {
      const o = list.getByRole("option", { name: full, exact: true });
      await attr(o, "title", full);
      expect(await o.evaluate((e) => getComputedStyle(e).paddingLeft)).toBe(
        full.includes(" / ") ? "24px" : "12px",
      );
    }
    await click(list.getByRole("option", { name: path, exact: true }));
    await attr(t, "aria-expanded", "false");
    await text(t, path);
    await exactValue(input, key);
    const again = await panel(p, t, "tree-select");
    for (const [full, v] of treeOptions) {
      await attr(
        again.getByRole("option", { name: full, exact: true }),
        "aria-selected",
        String(v === key),
      );
    }
    await p.keyboard.press("Escape");
    await attr(t, "aria-expanded", "false");
  }
  const list = await panel(p, t, "tree-select");
  await list.getByRole("option", { name: placeholder, exact: true }).press(
    "Space",
  );
  await attr(t, "aria-expanded", "false");
  await text(t, placeholder);
  await exactValue(input, "");
  await panel(p, t, "tree-select");
  await outside(p, t);
}
async function cascader(p: Page, s: Locator, placeholder = "请选择") {
  const t = trigger(s);
  for (
    const [province, city] of [["浙江", "杭州"], ["浙江", "宁波"], [
      "江苏",
      "南京",
    ]]
  ) {
    const dialog = await panel(p, t, "cascader");
    await click(dialog.getByRole("button", { name: province, exact: true }));
    await attr(t, "aria-expanded", "true");
    // Current Cascader API commits branch prefixes immediately; Escape closes, not a transaction cancel.
    await text(t, province);
    await p.keyboard.press("Escape");
    await attr(t, "aria-expanded", "false");
    await text(t, province);
    await panel(p, t, "cascader");
    const cities = province === "浙江" ? ["杭州", "宁波"] : ["南京"];
    for (const label of cities) {
      expect(
        await dialog.getByRole("button", { name: label, exact: true }).count(),
      ).toBe(1);
    }
    for (
      const label of ["杭州", "宁波", "南京"].filter((v) => !cities.includes(v))
    ) {
      expect(
        await dialog.getByRole("button", { name: label, exact: true }).count(),
      ).toBe(0);
    }
    await dialog.getByRole("button", { name: city, exact: true }).press(
      "Enter",
    );
    await attr(t, "aria-expanded", "false");
    const committed = province + " / " + city;
    await text(t, committed);
    const again = await panel(p, t, "cascader");
    expect(
      (await again.getByRole("button", { name: province, exact: true })
        .getAttribute("class"))?.includes("bg-blue-50"),
    ).toBe(true);
    expect(
      (await again.getByRole("button", { name: city, exact: true })
        .getAttribute("class"))?.includes("bg-blue-50"),
    ).toBe(true);
    await p.keyboard.press("Escape");
    await attr(t, "aria-expanded", "false");
    await text(t, committed);
  }
  const dialog = await panel(p, t, "cascader");
  await dialog.getByRole("button", { name: placeholder, exact: true }).press(
    "Space",
  );
  await attr(t, "aria-expanded", "false");
  await text(t, placeholder);
  await panel(p, t, "cascader");
  await outside(p, t);
}
async function data(form: Locator) {
  return await form.evaluate((el) =>
    Array.from(new FormData(el as HTMLFormElement).entries()).map((
      [k, v],
    ) => [k, String(v)])
  );
}
describe("Mobile selection written", () => {
  for (const width of [390, 1280]) {
    for (const kind of kinds) {
      const route = "/mobile/form/" + kind;
      it(
        "移动选择 " + kind + " 与 createForm @" + width +
          "：空值失败→真实选择提交→清空再失败",
        async (t) => {
          const p = await open(t, route);
          await p.setViewportSize({ width, height: 900 });
          const s = demo(p, "与 createForm"),
            form = s.locator("form"),
            tr = trigger(form),
            error = form.locator('[id$="-error"]'),
            submit = form.getByRole("button", { name: "提交", exact: true }),
            toast = p.getByRole("alert").filter({ hasText: /^已提交$/ }),
            errorText = {
              select: "请选择",
              multiselect: "请至少选一项",
              cascader: "请选择地区",
              "tree-select": "请选择部门",
            }[kind];
          await click(submit);
          await text(error, errorText);
          await attr(tr, "aria-invalid", "true");
          expect(await toast.count()).toBe(0);
          const list = await panel(p, tr, kind);
          let expected: string[][];
          if (kind === "select") {
            await click(
              list.getByRole("option", { name: "选项 B", exact: true }),
            );
            expected = [["city", "b"]];
            await text(tr, "选项 B");
          } else if (kind === "multiselect") {
            await click(
              list.getByRole("option", { name: "项 X", exact: true }),
            );
            await click(
              list.getByRole("option", { name: "项 Y", exact: true }),
            );
            await selectedMulti(list, ["x", "y"]);
            await click(
              list.getByRole("button", { name: "完成", exact: true }),
            );
            expected = [["tags", "x"], ["tags", "y"]];
            await text(tr, "项 X、项 Y");
          } else if (kind === "cascader") {
            await click(
              list.getByRole("button", { name: "浙江", exact: true }),
            );
            await attr(tr, "aria-expanded", "true");
            await text(tr, "浙江");
            expect(await data(form)).toEqual([["region", "zhejiang"]]);
            await click(
              list.getByRole("button", { name: "杭州", exact: true }),
            );
            expected = [["region", "zhejiang"], ["region", "hangzhou"]];
            await text(tr, "浙江 / 杭州");
          } else {
            await click(
              list.getByRole("option", { name: "研发 / 前端", exact: true }),
            );
            expected = [["dept", "fe"]];
            await text(tr, "研发 / 前端");
          }
          await attr(tr, "aria-expanded", "false");
          expect(await data(form)).toEqual(expected);
          await click(submit);
          await eventually(async () => await error.count() === 0);
          await attr(tr, "aria-invalid", "false");
          await text(toast, "已提交");
          expect(await data(form)).toEqual(expected);
          await toast.waitFor({ state: "detached", timeout: 10000 });
          const again = await panel(p, tr, kind);
          if (kind === "multiselect") {
            await click(
              again.getByRole("button", { name: "清空", exact: true }),
            );
            await selectedMulti(again, []);
            await click(
              again.getByRole("button", { name: "完成", exact: true }),
            );
          } else {await click(
              again.getByRole(kind === "cascader" ? "button" : "option", {
                name: kind === "tree-select" ? "请选择部门" : "请选择",
                exact: true,
              }),
            );}
          expect(await data(form)).toEqual(
            kind === "select"
              ? [["city", ""]]
              : kind === "tree-select"
              ? [["dept", ""]]
              : [],
          );
          await click(submit);
          await text(error, errorText);
          await attr(tr, "aria-invalid", "true");
          expect(await toast.count()).toBe(0);
          // Cover the form instance's own entire option/menu surface, not just another basic demo.
          if (kind === "select") await selectSingle(p, form, "", "请选择");
          else if (kind === "multiselect") await multi(p, form, []);
          else if (kind === "cascader") await cascader(p, form);
          else await tree(p, form, "请选择部门");
          expect(await data(form)).toEqual(
            kind === "select"
              ? [["city", ""]]
              : kind === "tree-select"
              ? [["dept", ""]]
              : [],
          );
          await click(submit);
          await text(error, errorText);
          await attr(tr, "aria-invalid", "true");
          expect(await toast.count()).toBe(0);
        },
        DOCS_BROWSER_CONFIG,
      );
      const basicTitle = kind === "cascader" ? "静态树 + Signal" : "基础";
      it(
        "移动选择 " + kind + " " + basicTitle + " @" + width +
          "：全部真实选项/回显/清空/关闭",
        async (t) => {
          const p = await open(t, route);
          await p.setViewportSize({ width, height: 900 });
          const s = demo(p, basicTitle);
          if (kind === "select") await selectSingle(p, s, "", "请选择");
          else if (kind === "multiselect") await multi(p, s, ["x"]);
          else if (kind === "cascader") await cascader(p, s);
          else await tree(p, s, "请选择部门", "fe");
          if (kind === "select") {
            await exactValue(
              demo(p, "受控 Signal").locator('input[type="hidden"]'),
              "a",
            );
            expect(await data(demo(p, "与 createForm").locator("form")))
              .toEqual([
                ["city", ""],
              ]);
          } else if (kind === "multiselect") {
            await text(trigger(demo(p, "受控 Signal")), "项 X");
            expect(await data(demo(p, "与 createForm").locator("form")))
              .toEqual(
                [],
              );
          } else {expect(await data(demo(p, "与 createForm").locator("form")))
              .toEqual(kind === "tree-select" ? [["dept", ""]] : []);}
        },
        DOCS_BROWSER_CONFIG,
      );
      if (kind === "select" || kind === "multiselect") {
        it(
          "移动选择 " + kind + " 受控 Signal @" + width +
            "：组件回写与当前值逐步精确一致",
          async (t) => {
            const p = await open(t, route);
            await p.setViewportSize({ width, height: 900 });
            const s = demo(p, "受控 Signal"),
              echo = s.locator("p").filter({ hasText: /^当前：/ });
            if (kind === "select") {
              await selectSingle(p, s, "a", undefined, echo);
            } else await multi(p, s, ["x"], "请选择", echo);
            if (kind === "select") {
              await exactValue(
                demo(p, "基础").locator('input[type="hidden"]'),
                "",
              );
            } else await text(trigger(demo(p, "基础")), "项 X");
          },
          DOCS_BROWSER_CONFIG,
        );
      }
      it(
        "移动选择 " + kind + " size @" + width +
          "：四尺寸非受控持久、所有可见选项结果与互不污染",
        async (t) => {
          const p = await open(t, route);
          await p.setViewportSize({ width, height: 900 });
          const s = demo(p, "size（xs / sm / md / lg）"), ts = trigger(s);
          expect(await ts.count()).toBe(4);
          const heights: number[] = [];
          for (const [index, size] of ["xs", "sm", "md", "lg"].entries()) {
            const tr = ts.nth(index), root = tr.locator("../..");
            await text(tr, size);
            const expectedFont = [12, 14, 14, 16][index],
              expectedY = [4, 6, 8, 10][index],
              expectedX = [10, 12, 12, 16][index];
            const style = await tr.evaluate((e) => {
              const cs = getComputedStyle(e);
              return [cs.fontSize, cs.paddingTop, cs.paddingLeft];
            });
            expect(style).toEqual([
              expectedFont + "px",
              expectedY + "px",
              expectedX + "px",
            ]);
            const box = await tr.boundingBox();
            if (!box) throw new Error("Size geometry missing");
            heights.push(box.height);
            if (kind === "select") await selectSingle(p, root, "", size);
            else if (kind === "multiselect") await multi(p, root, [], size);
            else if (kind === "cascader") await cascader(p, root, size);
            else await tree(p, root, size);
            for (let j = index + 1; j < 4; j++) {
              await text(ts.nth(j), ["xs", "sm", "md", "lg"][j]);
            }
          }
          expect(heights.every((h, i) => i === 0 || h > heights[i - 1])).toBe(
            true,
          );
        },
        DOCS_BROWSER_CONFIG,
      );
      it(
        "移动选择 " + kind + " 自动聚焦 @" + width +
          "：浏览器activeElement、原生Enter/Space开启与持久选中",
        async (t) => {
          const p = await open(t, route);
          await p.setViewportSize({ width, height: 900 });
          const s = demo(p, "自动聚焦"), tr = trigger(s);
          expect(await tr.evaluate((e) => e === document.activeElement)).toBe(
            true,
          );
          expect(await tr.getAttribute("autofocus")).not.toBe(null);
          await p.keyboard.press("Enter");
          await attr(tr, "aria-expanded", "true");
          const list = p.getByRole(kind === "cascader" ? "dialog" : "listbox");
          if (kind === "select") {
            await list.getByRole("option", { name: "选项 B", exact: true })
              .press(
                "Space",
              );
            await text(tr, "选项 B");
            await exactValue(s.locator('input[type="hidden"]'), "b");
          } else if (kind === "multiselect") {
            await click(
              list.getByRole("option", { name: "项 Y", exact: true }),
            );
            await selectedMulti(list, ["y"]);
            await list.getByRole("button", { name: "完成", exact: true }).press(
              "Space",
            );
            await text(tr, "项 Y");
          } else if (kind === "cascader") {
            await list.getByRole("button", { name: "江苏", exact: true }).press(
              "Enter",
            );
            await list.getByRole("button", { name: "南京", exact: true }).press(
              "Space",
            );
            await text(tr, "江苏 / 南京");
          } else {
            await list.getByRole("option", { name: "研发 / 后端", exact: true })
              .press("Space");
            await text(tr, "研发 / 后端");
            await exactValue(s.locator('input[type="hidden"]'), "be");
          }
          await attr(tr, "aria-expanded", "false");
          await tr.press("Space");
          await attr(tr, "aria-expanded", "true");
          await p.keyboard.press("Escape");
          await attr(tr, "aria-expanded", "false");
          // Every autofocus instance also exercises all its actual choices and clear/done/outside actions.
          if (kind === "select") {
            await selectSingle(p, s, "b", "挂载后自动聚焦");
          } else if (kind === "multiselect") {
            await multi(p, s, ["y"], "挂载后自动聚焦");
          } else if (kind === "cascader") {
            await cascader(p, s, "挂载后自动聚焦");
          } else await tree(p, s, "挂载后自动聚焦", "be");
        },
        DOCS_BROWSER_CONFIG,
      );
    }
  }
});
