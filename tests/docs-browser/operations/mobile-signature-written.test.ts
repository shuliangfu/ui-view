/** WRITTEN-UNRUN: trusted native strokes + exact canvas pixels/PNG and visible form-store preview. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, eventually, open } from "./driver.ts";
async function empty(pad: Locator, expected: boolean) {
  await eventually(async () =>
    await pad.getByText("请在此签名", { exact: true }).count() ===
      (expected ? 1 : 0)
  );
  expect(
    await pad.locator("canvas").evaluate((e) => {
      const c = e as HTMLCanvasElement, ctx = c.getContext("2d");
      if (!ctx) throw new Error("Missing drawing context");
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      return !d.some((v, i) => i % 4 === 3 && v !== 0);
    }),
  ).toBe(expected);
}
async function alpha(canvas: Locator, x: number, y: number) {
  return await canvas.evaluate((el, point) => {
    const c = el as HTMLCanvasElement, dpr = devicePixelRatio || 1;
    return c.getContext("2d")!.getImageData(
      Math.floor(point[0] * dpr),
      Math.floor(point[1] * dpr),
      1,
      1,
    ).data[3];
  }, [x, y]);
}
async function dataURL(canvas: Locator) {
  return await canvas.evaluate((e) =>
    (e as HTMLCanvasElement).toDataURL("image/png")
  );
}
async function stroke(
  p: Page,
  canvas: Locator,
  offset: number,
  outside: boolean,
) {
  await canvas.scrollIntoViewIfNeeded();
  const b = await canvas.boundingBox();
  if (!b) throw new Error("Canvas geometry missing");
  await p.mouse.move(b.x + 30 + offset, b.y + 30);
  await p.mouse.down();
  await p.waitForTimeout(180);
  await p.mouse.move(b.x + 70 + offset, b.y + 30, { steps: 5 });
  await p.mouse.move(b.x + 70 + offset, b.y + 60, { steps: 5 });
  if (outside) {
    await p.mouse.move(b.x + b.width + 10, b.y + b.height + 10, { steps: 5 });
  }
  await p.mouse.up();
  expect(await alpha(canvas, 50 + offset, 30) > 0).toBe(true);
  expect(await alpha(canvas, 70 + offset, 45) > 0).toBe(true);
  expect(await alpha(canvas, 5, 5)).toBe(0);
}
async function touchStroke(p: Page, canvas: Locator, height: number) {
  await canvas.scrollIntoViewIfNeeded();
  const b = await canvas.boundingBox();
  if (!b) throw new Error("Touch canvas geometry missing");
  const session = await p.context().newCDPSession(p);
  try {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{
        x: b.x + 30,
        y: b.y + height - 20,
        id: 1,
        force: 1,
        radiusX: 2,
        radiusY: 2,
      }],
    });
    await p.waitForTimeout(180);
    for (const dx of [40, 50, 60, 75]) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{
          x: b.x + dx,
          y: b.y + height - 20,
          id: 1,
          force: 1,
          radiusX: 2,
          radiusY: 2,
        }],
      });
    }
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  } finally {
    await session.detach();
  }
  expect(await alpha(canvas, 50, height - 20) > 0).toBe(true);
}
async function preview(form: Locator, canvas: Locator) {
  const img = form.getByTestId("signature-form-preview"),
    url = await dataURL(canvas);
  await eventually(async () => await img.count() === 1);
  await attr(img, "src", url);
  expect(await form.getByTestId("signature-form-empty").count()).toBe(0);
  const expected = await canvas.evaluate(
    (e) => [(e as HTMLCanvasElement).width, (e as HTMLCanvasElement).height],
  );
  expect(
    await img.evaluate(async (e) => {
      const image = e as HTMLImageElement;
      await image.decode();
      return [image.naturalWidth, image.naturalHeight];
    }),
  ).toEqual(expected);
  expect(
    await img.evaluate((e) => {
      const bytes = atob((e as HTMLImageElement).src.split(",")[1]);
      return Array.from(bytes.slice(0, 8), (s) => s.charCodeAt(0));
    }),
  ).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
}
async function signatureContract(
  p: Page,
  pad: Locator,
  height: number,
  form?: Locator,
) {
  const canvas = pad.locator("canvas"),
    clear = pad.getByRole("button", { name: "清空", exact: true });
  await attr(canvas, "aria-label", "请在此签名");
  expect(await canvas.evaluate((e) => getComputedStyle(e).height)).toBe(
    height + "px",
  );
  expect(await canvas.evaluate((e) => (e as HTMLCanvasElement).height)).toBe(
    Math.floor(height * await p.evaluate(() => devicePixelRatio || 1)),
  );
  expect(await clear.isDisabled()).toBe(false);
  await empty(pad, true);
  await clear.click({ delay: 180 });
  await empty(pad, true);
  await stroke(p, canvas, 0, false);
  await empty(pad, false);
  if (form) await preview(form, canvas);
  const first = await dataURL(canvas);
  await stroke(p, canvas, 70, true);
  await empty(pad, false);
  expect(await dataURL(canvas)).not.toBe(first);
  expect(await alpha(canvas, 50, 30) > 0).toBe(true);
  if (form) await preview(form, canvas);
  const afterRelease = await dataURL(canvas), b = await canvas.boundingBox();
  if (!b) throw new Error("Canvas disappeared after release");
  await p.mouse.move(b.x + 30, b.y + 90, { steps: 3 });
  expect(await dataURL(canvas)).toBe(afterRelease);
  expect(await alpha(canvas, 30, 90)).toBe(0);
  await touchStroke(p, canvas, height);
  if (form) await preview(form, canvas);
  await clear.press("Enter");
  await empty(pad, true);
  if (form) {
    expect(await form.getByTestId("signature-form-preview").count()).toBe(0);
    expect(await form.getByTestId("signature-form-empty").textContent()).toBe(
      "尚未签名",
    );
  }
  await stroke(p, canvas, 0, false);
  if (form) await preview(form, canvas);
  await clear.press("Space");
  await empty(pad, true);
  if (form) {
    expect(await form.getByTestId("signature-form-preview").count()).toBe(0);
  }
}
describe("Mobile signature written", () => {
  for (const width of [390, 1280]) {
    it(
      "移动SignaturePad 基础未设三级标题 @" + width +
        "：按住跨timer/外部释放/触摸/清空及像素结果",
      async (t) => {
        const p = await open(t, "/mobile/form/signature-pad");
        await p.setViewportSize({ width, height: 900 });
        const pads = p.locator(".signature-pad");
        expect(await pads.count()).toBe(6);
        await signatureContract(p, pads.nth(1), 160);
        await empty(pads.nth(0), true);
        for (let i = 2; i < 6; i++) await empty(pads.nth(i), true);
      },
      DOCS_BROWSER_CONFIG,
    );
    it(
      "移动SignaturePad 与 createForm @" + width +
        "：实际PNG字段预览/空值校验/有效提交/清空复错",
      async (t) => {
        const p = await open(t, "/mobile/form/signature-pad");
        await p.setViewportSize({ width, height: 900 });
        const form = p.locator("main form"),
          pad = form.locator(".signature-pad"),
          canvas = pad.locator("canvas"),
          submit = form.getByRole("button", { name: "提交", exact: true }),
          error = form.locator('[id$="-error"]'),
          toast = p.getByRole("alert").filter({ hasText: /^已提交$/ });
        expect(await form.getByTestId("signature-form-empty").textContent())
          .toBe(
            "尚未签名",
          );
        await submit.click({ delay: 180 });
        expect(await error.textContent()).toBe("请签名");
        await attr(pad, "aria-invalid", "true");
        expect(await toast.count()).toBe(0);
        await signatureContract(p, pad, 160, form);
        await submit.click({ delay: 180 });
        expect(await error.textContent()).toBe("请签名");
        expect(await toast.count()).toBe(0);
        await stroke(p, canvas, 0, false);
        await preview(form, canvas);
        await submit.click({ delay: 180 });
        await eventually(async () => await error.count() === 0);
        await attr(pad, "aria-invalid", "false");
        await eventually(async () => await toast.count() === 1);
        expect((await toast.textContent())?.trim()).toBe("已提交");
        await toast.waitFor({ state: "detached", timeout: 10000 });
        await pad.getByRole("button", { name: "清空", exact: true }).click({
          delay: 180,
        });
        await empty(pad, true);
        expect(await form.getByTestId("signature-form-preview").count()).toBe(
          0,
        );
        await submit.click({ delay: 180 });
        expect(await error.textContent()).toBe("请签名");
        await attr(pad, "aria-invalid", "true");
        expect(await toast.count()).toBe(0);
      },
      DOCS_BROWSER_CONFIG,
    );
    for (const [index, size] of ["xs", "sm", "md", "lg"].entries()) {
      it(
        "移动SignaturePad size " + size + " @" + width +
          "：对应画布高度/完整笔画清空/其它板不变",
        async (t) => {
          const p = await open(t, "/mobile/form/signature-pad");
          await p.setViewportSize({ width, height: 900 });
          const pads = p.locator(".signature-pad"),
            pad = pads.nth(index + 2),
            height = [120, 150, 180, 220][index];
          expect(
            await pad.getByRole("button", { name: "清空", exact: true })
              .evaluate(
                (e) => getComputedStyle(e).fontSize,
              ),
          ).toBe([12, 14, 14, 16][index] + "px");
          await signatureContract(p, pad, height);
          for (let i = 0; i < 6; i++) {
            if (i !== index + 2) await empty(pads.nth(i), true);
          }
        },
        DOCS_BROWSER_CONFIG,
      );
    }
  }
});
