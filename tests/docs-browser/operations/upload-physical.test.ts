import { describe, expect, it } from "@dreamer/test";
import { Buffer } from "node:buffer";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, eventually, open, section, value, visible } from "./driver.ts";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
  "base64",
);
function image(name: string) {
  return { name, mimeType: "image/png", buffer: png };
}
function text(name: string) {
  return {
    name,
    mimeType: "text/plain",
    buffer: Buffer.from("ui-view physical upload " + name),
  };
}
async function start(t: Parameters<typeof open>[0]): Promise<Page> {
  const page = await open(t, "/desktop/form/upload"), url = new URL(page.url());
  expect(["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)).toBe(true);
  expect(["8001", "8003"].includes(url.port)).toBe(false);
  return page;
}
function fileRow(demo: Locator, name: string): Locator {
  return demo.locator("li").filter({
    has: demo.page().locator(`span[title="${name}"]`),
  });
}
async function done(demo: Locator, name: string): Promise<Locator> {
  const row = fileRow(demo, name);
  await row.locator('[aria-label="已完成"], [aria-label="上传失败"]').waitFor({
    state: "visible",
    timeout: 15000,
  });
  if (await row.locator('[aria-label="上传失败"]').count()) {
    throw new Error("Upload must succeed: " + await row.textContent());
  }
  expect(await row.count()).toBe(1);
  return row;
}
async function download(
  page: Page,
  url: string,
  expected: Buffer,
): Promise<void> {
  const target = new URL(url, page.url());
  expect(target.origin).toBe(new URL(page.url()).origin);
  expect(target.pathname).toBe("/api/upload/file");
  const response = await page.request.get(target.href);
  expect(response.status()).toBe(200);
  const body = await response.body();
  expect(body.length).toBe(expected.length);
  const sha = async (b: Buffer) =>
    Array.from(
      new Uint8Array(await crypto.subtle.digest("SHA-256", Uint8Array.from(b))),
    ).map((n) => n.toString(16).padStart(2, "0")).join("");
  expect(await sha(body)).toBe(await sha(expected));
}
async function remove(demo: Locator, name: string): Promise<void> {
  await fileRow(demo, name).getByRole("button", {
    name: "移除 " + name,
    exact: true,
  }).click({ delay: 180 });
  await eventually(async () => await fileRow(demo, name).count() === 0);
}

describe("Upload physical", () => {
  it(
    "物理操作 Upload：表单必填、文件选择器上传、替换、空选择保留、移除再校验",
    async (t) => {
      const page = await start(t),
        demo = section(page, "与 createForm"),
        hidden = demo.locator("input[type=hidden]");
      const submit = demo.getByRole("button", { name: "提交", exact: true });
      await submit.click();
      await visible(demo.getByText("请上传文件", { exact: true }));
      const chooserEvent = page.waitForEvent("filechooser");
      await demo.locator("input[type=file]").click({ delay: 180 });
      const file = text("form-first.txt"), chooser = await chooserEvent;
      await chooser.setFiles(file);
      await done(demo, file.name);
      const firstUrl = await hidden.inputValue();
      await download(page, firstUrl, file.buffer);
      await submit.click();
      await visible(page.getByText("已提交", { exact: true }));
      await visible(demo.getByText("请上传文件", { exact: true }), false);
      await demo.locator("input[type=file]").setInputFiles([]);
      await value(hidden, firstUrl);
      await done(demo, file.name);
      const replacement = text("form-replacement.txt");
      await demo.locator("input[type=file]").setInputFiles(replacement);
      await done(demo, replacement.name);
      expect(await fileRow(demo, file.name).count()).toBe(0);
      expect(await hidden.inputValue()).not.toBe(firstUrl);
      await download(page, await hidden.inputValue(), replacement.buffer);
      await remove(demo, replacement.name);
      await value(hidden, "");
      await submit.click();
      await visible(demo.getByText("请上传文件", { exact: true }));
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "物理操作 Upload：多图片预览、响应隐藏数组、正文回调和中间移除",
    async (t) => {
      const page = await start(t),
        demo = section(page, "action：后台演示 API"),
        hidden = demo.locator("input[type=hidden]");
      await attr(hidden, "name", "fileUrl");
      await attr(hidden, "id", "doc-upload-value");
      await attr(demo.locator("input[type=file]"), "accept", "image/*");
      await demo.locator("input[type=file]").setInputFiles([
        image("first.png"),
        image("second.png"),
      ]);
      await done(demo, "first.png");
      await done(demo, "second.png");
      const urls = JSON.parse(await hidden.inputValue()) as string[];
      expect(urls.length).toBe(2);
      for (let i = 0; i < 2; i++) {
        await download(page, urls[i], png);
        const img = demo.locator("img").nth(i);
        await img.scrollIntoViewIfNeeded();
        await attr(img, "src", urls[i]);
        await eventually(async () =>
          await img.evaluate((el) =>
            (el as HTMLImageElement).naturalWidth === 1
          )
        );
      }
      await visible(demo.getByText(JSON.stringify(urls), { exact: true }));
      await remove(demo, "first.png");
      await value(hidden, JSON.stringify([urls[1]]));
      await done(demo, "second.png");
      await remove(demo, "second.png");
      await value(hidden, "[]");
      expect(await demo.locator("img").count()).toBe(0);
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "物理操作 Upload：拒绝类型和超5MB文件，不发请求且不提供无效重试",
    async (t) => {
      const page = await start(t),
        demo = section(page, "action：后台演示 API"),
        input = demo.locator("input[type=file]");
      let requests = 0;
      page.on("request", (request) => {
        if (
          new URL(request.url()).pathname === "/api/upload" &&
          request.method() === "POST"
        ) requests++;
      });
      await input.setInputFiles(text("wrong.txt"));
      await visible(
        fileRow(demo, "wrong.txt").getByText("文件类型不在 accept 允许范围内", {
          exact: true,
        }),
      );
      expect(
        await fileRow(demo, "wrong.txt").getByRole("button", {
          name: "重试",
          exact: true,
        }).count(),
      ).toBe(0);
      await input.setInputFiles({
        name: "oversized.png",
        mimeType: "image/png",
        buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
      });
      await visible(
        fileRow(demo, "oversized.png").getByText(
          "文件超过大小限制（最大 5.0 MB）",
          { exact: true },
        ),
      );
      expect(
        await fileRow(demo, "oversized.png").getByRole("button", {
          name: "重试",
          exact: true,
        }).count(),
      ).toBe(0);
      expect(requests).toBe(0);
      // JSON mode aligns with list rows, including null for rejected files.
      await value(demo.locator("input[type=hidden]"), "[null,null]");
      await remove(demo, "wrong.txt");
      await remove(demo, "oversized.png");
      expect(await demo.locator("li").count()).toBe(0);
    },
    DOCS_BROWSER_CONFIG,
  );

  it("物理操作 Upload：5MB等号边界接受并下载字节一致", async (t) => {
    const page = await start(t), demo = section(page, "action：后台演示 API");
    const buffer = Buffer.alloc(5 * 1024 * 1024);
    png.copy(buffer);
    await demo.locator("input[type=file]").setInputFiles({
      name: "boundary.png",
      mimeType: "image/png",
      buffer,
    });
    await done(demo, "boundary.png");
    const urls = JSON.parse(
      await demo.locator("input[type=hidden]").inputValue(),
    ) as string[];
    expect(urls.length).toBe(1);
    await download(page, urls[0], buffer);
    await remove(demo, "boundary.png");
  }, DOCS_BROWSER_CONFIG);

  it(
    "物理操作 Upload：真实请求503失败、重试同一文件成功并清错误",
    async (t) => {
      const page = await start(t),
        demo = section(page, "与 createForm"),
        endpoint = new URL("/api/upload", page.url()).href;
      let requests = 0;
      await page.route(endpoint, async (route) => {
        requests++;
        if (requests === 1) {
          await route.fulfill({
            status: 503,
            contentType: "application/json",
            body: JSON.stringify({ error: "physical-failure" }),
          });
        } else await route.continue();
      });
      try {
        const file = text("retry.txt");
        await demo.locator("input[type=file]").setInputFiles(file);
        const row = fileRow(demo, file.name);
        await row.locator('[aria-label="上传失败"]').waitFor({
          state: "visible",
        });
        await value(demo.locator("input[type=hidden]"), "");
        await visible(row.getByText(/503|physical-failure/));
        await row.getByRole("button", { name: "重试", exact: true }).click({
          delay: 180,
        });
        await done(demo, file.name);
        expect(requests).toBe(2);
        expect(await demo.locator("li").count()).toBe(1);
        expect(
          await row.getByRole("button", { name: "重试", exact: true }).count(),
        )
          .toBe(0);
        await download(
          page,
          await demo.locator("input[type=hidden]").inputValue(),
          file.buffer,
        );
      } finally {
        await page.unroute(endpoint);
      }
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "物理操作 Upload：上传中进度、取消中止请求、移除后不写入隐藏值",
    async (t) => {
      const page = await start(t),
        demo = section(page, "与 createForm"),
        endpoint = new URL("/api/upload", page.url()).href;
      const intercepted = Promise.withResolvers<
        import("npm:playwright@1.59.1").Route
      >();
      await page.route(endpoint, (route) => {
        intercepted.resolve(route);
      });
      try {
        await demo.locator("input[type=file]").setInputFiles(
          text("cancel.txt"),
        );
        const held = await intercepted.promise,
          row = fileRow(demo, "cancel.txt");
        await visible(row.getByRole("progressbar"));
        await attr(row.getByRole("progressbar"), "aria-valuenow", "0");
        await value(demo.locator("input[type=hidden]"), "");
        const failed = page.waitForEvent("requestfailed", {
          predicate: (request) => request.url() === endpoint,
        });
        await row.getByRole("button", {
          name: "取消或移除 cancel.txt",
          exact: true,
        }).click({ delay: 180 });
        const aborted = await failed;
        expect(aborted.failure()?.errorText).toContain("ERR_ABORTED");
        await held.abort();
        expect(await demo.locator("li").count()).toBe(0);
        await value(demo.locator("input[type=hidden]"), "");
      } finally {
        await page.unroute(endpoint);
      }
    },
    DOCS_BROWSER_CONFIG,
  );

  it("物理操作 Upload：三张上限、第四张拒绝、移除腾位再选", async (t) => {
    const page = await start(t),
      demo = section(page, "多选 + 关闭拖拽区（IconUpload + 上传图片）"),
      input = demo.locator("input[type=file]");
    await attr(input, "multiple", "");
    await attr(input, "accept", "image/*");
    await attr(input, "aria-label", "上传图片");
    await input.setInputFiles([
      image("one.png"),
      image("two.png"),
      image("three.png"),
      image("four.png"),
    ]);
    for (const name of ["one.png", "two.png", "three.png"]) {
      await done(demo, name);
    }
    await visible(
      fileRow(demo, "four.png").getByText("最多只能选择 3 个文件", {
        exact: true,
      }),
    );
    const hidden = demo.locator("input[type=hidden]");
    const values = JSON.parse(await hidden.inputValue()) as (string | null)[];
    expect(values.length).toBe(4);
    expect(values.slice(0, 3).every((url) => typeof url === "string")).toBe(
      true,
    );
    expect(values[3]).toBe(null);
    await remove(demo, "four.png");
    await remove(demo, "two.png");
    expect((JSON.parse(await hidden.inputValue()) as string[]).length).toBe(2);
    await input.setInputFiles(image("four.png"));
    await done(demo, "four.png");
    expect((JSON.parse(await hidden.inputValue()) as string[]).length).toBe(3);
    for (const name of ["one.png", "three.png", "four.png"]) {
      await remove(demo, name);
    }
    await value(hidden, "[]");
  }, DOCS_BROWSER_CONFIG);

  it(
    "物理操作 Upload：auto小文件直传、大文件init/chunk/complete及下载校验",
    async (t) => {
      const page = await start(t),
        demo = section(page, "action + 分片（与 @dreamer/upload/server 一致）"),
        input = demo.locator("input[type=file]");
      const phases: string[] = [];
      page.on("request", (request) => {
        const url = new URL(request.url());
        if (url.pathname === "/api/upload" && request.method() === "POST") {
          phases.push(url.searchParams.get("phase") ?? "simple");
        }
      });
      const small = text("small.txt");
      await input.setInputFiles(small);
      await done(demo, small.name);
      expect(phases).toEqual(["simple"]);
      const boundary = {
        name: "threshold.txt",
        mimeType: "text/plain",
        buffer: Buffer.alloc(2 * 1024 * 1024, 0x62),
      };
      await input.setInputFiles(boundary);
      await done(demo, boundary.name);
      expect(phases).toEqual(["simple", "simple"]);
      const large = {
        name: "large.txt",
        mimeType: "text/plain",
        buffer: Buffer.alloc(2 * 1024 * 1024 + 17, 0x61),
      };
      await input.setInputFiles(large);
      await done(demo, large.name);
      expect(phases.filter((p) => p === "init").length).toBe(1);
      expect(phases.filter((p) => p === "chunk").length).toBe(2);
      expect(phases[phases.length - 1]).toBe("complete");
      const urls = JSON.parse(
        await demo.locator("input[type=hidden]").inputValue(),
      ) as string[];
      expect(urls.length).toBe(3);
      await download(page, urls[0], small.buffer);
      await download(page, urls[1], boundary.buffer);
      await download(page, urls[2], large.buffer);
      await remove(demo, small.name);
      await remove(demo, boundary.name);
      await remove(demo, large.name);
      await value(demo.locator("input[type=hidden]"), "[]");
    },
    DOCS_BROWSER_CONFIG,
  );

  it("物理操作 Upload：禁用控件坐标命中不打开文件选择器", async (t) => {
    const page = await start(t),
      demo = section(page, "disabled"),
      input = demo.locator("input[type=file]");
    expect(await input.isDisabled()).toBe(true);
    let choosers = 0;
    page.on("filechooser", () => {
      choosers++;
    });
    await input.scrollIntoViewIfNeeded();
    const b = await input.boundingBox();
    if (!b) throw new Error("disabled input geometry missing");
    await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2, {
      delay: 180,
    });
    expect(choosers).toBe(0);
    await value(demo.locator("input[type=hidden]"), "");
    expect(await demo.locator("li").count()).toBe(0);
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 Upload：四尺寸各自上传、下载和移除，真实高度递增", async (t) => {
    const page = await start(t),
      demo = section(page, "size（xs / sm / md / lg）"),
      inputs = demo.locator("input[type=file]");
    const sizes = ["xs", "sm", "md", "lg"], heights: number[] = [];
    expect(await inputs.count()).toBe(4);
    for (let i = 0; i < 4; i++) {
      const input = inputs.nth(i), block = input.locator("xpath=../..");
      const b = await input.boundingBox();
      if (!b) throw new Error("upload size geometry missing");
      heights.push(b.height);
      await attr(input, "aria-label", sizes[i]);
      const file = text("size-" + sizes[i] + ".txt");
      await input.setInputFiles(file);
      await done(block, file.name);
      const hidden = block.locator("input[type=hidden]");
      await attr(hidden, "name", "size-" + sizes[i]);
      await download(page, await hidden.inputValue(), file.buffer);
      await remove(block, file.name);
      await value(hidden, "");
    }
    for (let i = 1; i < 4; i++) expect(heights[i] > heights[i - 1]).toBe(true);
  }, DOCS_BROWSER_CONFIG);

  it(
    "物理操作 Upload：原生文件拖拽进入高亮、离开复原、重新进入放下上传",
    async (t) => {
      const page = await start(t),
        demo = section(page, "action：后台演示 API"),
        input = demo.locator("input[type=file]");
      await input.scrollIntoViewIfNeeded();
      const box = await input.boundingBox();
      if (!box) throw new Error("drop zone missing");
      const zone = input.locator("xpath=..");
      const directory = await mkdtemp(tmpdir() + "/ui-view-physical-drag-");
      const path = directory + "/native-drop.png";
      await writeFile(path, png);
      const cdp = await page.context().newCDPSession(page);
      const data = { items: [], files: [path], dragOperationsMask: 1 };
      try {
        await cdp.send("Input.dispatchDragEvent", {
          type: "dragEnter",
          x: box.x + box.width / 2,
          y: box.y + box.height / 2,
          data,
        });
        await cdp.send("Input.dispatchDragEvent", {
          type: "dragOver",
          x: box.x + box.width / 2,
          y: box.y + box.height / 2,
          data,
        });
        await eventually(async () =>
          await zone.evaluate((el) => el.classList.contains("border-blue-500"))
        );
        await cdp.send("Input.dispatchDragEvent", {
          type: "dragOver",
          x: 3,
          y: 3,
          data,
        });
        await eventually(async () =>
          !await zone.evaluate((el) => el.classList.contains("border-blue-500"))
        );
        await cdp.send("Input.dispatchDragEvent", {
          type: "dragEnter",
          x: box.x + box.width / 2,
          y: box.y + box.height / 2,
          data,
        });
        await cdp.send("Input.dispatchDragEvent", {
          type: "dragOver",
          x: box.x + box.width / 2,
          y: box.y + box.height / 2,
          data,
        });
        await eventually(async () =>
          await zone.evaluate((el) => el.classList.contains("border-blue-500"))
        );
        await cdp.send("Input.dispatchDragEvent", {
          type: "drop",
          x: box.x + box.width / 2,
          y: box.y + box.height / 2,
          data,
        });
        await done(demo, "native-drop.png");
        expect(
          await zone.evaluate((el) => el.classList.contains("border-blue-500")),
        ).toBe(false);
        const urls = JSON.parse(
          await demo.locator("input[type=hidden]").inputValue(),
        ) as string[];
        expect(urls.length).toBe(1);
        await download(page, urls[0], png);
        // A native file drag onto the disabled example must not bypass its file input.
        const disabled = section(page, "disabled"),
          blocked = disabled.locator("input[type=file]");
        await blocked.scrollIntoViewIfNeeded();
        const d = await blocked.boundingBox();
        if (!d) throw new Error("disabled drop zone missing");
        const point = { x: d.x + d.width / 2, y: d.y + d.height / 2, data };
        await cdp.send("Input.dispatchDragEvent", {
          type: "dragEnter",
          ...point,
        });
        await cdp.send("Input.dispatchDragEvent", {
          type: "dragOver",
          ...point,
        });
        expect(
          await blocked.locator("xpath=..").evaluate((el) =>
            el.classList.contains("border-blue-500")
          ),
        ).toBe(false);
        await cdp.send("Input.dispatchDragEvent", { type: "drop", ...point });
        expect(await disabled.locator("li").count()).toBe(0);
        await value(disabled.locator("input[type=hidden]"), "");
      } finally {
        await cdp.send("Input.cancelDragging");
        await cdp.detach();
        await rm(directory, { recursive: true });
      }
    },
    DOCS_BROWSER_CONFIG,
  );
});
