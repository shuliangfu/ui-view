import { describe, expect, it } from "@dreamer/test";
import type { Locator } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { MESSAGES_UPLOAD } from "../../../docs/src/data/component-messages-rows.ts";
import { eventually, open, section, value, visible } from "./driver.ts";
const route = "/desktop/form/upload";
const rows = [
  [
    "size",
    '"xs" | "sm" | "md" | "lg"',
    '"md"',
    "尺寸：xs、sm、md、lg；也可由外层 Form 的 size 注入",
  ],
  [
    "action",
    "string",
    "-",
    "与 requestUpload 至少其一。整文件 multipart；大文件同 URL 使用 ?phase=init|chunk|complete",
  ],
  [
    "requestUpload",
    "(file, signal) => Promise<string>",
    "-",
    "自定义上传，返回值写入隐藏域；若与 action 同时存在则优先用此函数",
  ],
  [
    "method / headers / withCredentials",
    "…",
    "POST / - / false",
    "内置 fetch 时的请求选项",
  ],
  ["fileFieldName", "string", "file", "非分片时 multipart 字段名"],
  ["maxFileSize / maxCount", "number", "-", "单文件最大字节；多选最大条数"],
  [
    "chunked",
    'boolean | "auto"',
    "auto",
    "分片策略；auto 表示大于 chunkThreshold 走 phase 分片",
  ],
  [
    "chunkThreshold / chunkSize",
    "number",
    "2MiB / 2MiB",
    "auto 阈值与单片大小",
  ],
  [
    "getValueFromResponse",
    "(res) => Promise<string>",
    "内置",
    "从响应解析隐藏域字符串（仅 action 内置路径）",
  ],
  ["multipleValueMode", '"json" | "comma"', "json", "多文件隐藏域格式"],
  ["value / defaultValue / onValueChange", "…", "-", "隐藏域受控与回调"],
  ["onUploadSuccess / onUploadError", "…", "-", "单文件成功或失败"],
  ["multiple", "boolean", "false", "是否多选"],
  ["accept", "string", "-", "类型限制（选择 + 拖拽均校验）"],
  ["drag", "boolean", "true", "是否显示拖拽区；false 时仅文件选择按钮"],
  ["dragPlaceholder", "string", "-", "拖拽模式占位文案（图标在上）"],
  [
    "showTriggerIcon",
    "boolean",
    "true",
    "是否显示 IconUpload（拖拽区 / 非拖拽触发条）",
  ],
  [
    "triggerLabel",
    "string",
    "选择文件",
    "drag=false 时触发条文案，如「上传图片」",
  ],
  ["hideFocusRing", "boolean", "false", "关闭 focus-within 蓝色 ring"],
  [
    "preview",
    "boolean",
    "false",
    "上传成功且 URL 可判为图片时展示缩略图；accept 含 image 时放宽判定",
  ],
  ["disabled", "boolean", "false", "禁用"],
  ["name", "string", "-", "隐藏域 name（可见 file input 无 name）"],
  ["id", "string", "-", "可见 file input id；隐藏域为 `${id}-value`"],
  ["class", "string", "-", "容器 class"],
  ["error", "boolean", "false", "错误状态（红框）；可与 createForm 绑定联用"],
  [
    "messages",
    "Partial<UploadMessages>",
    "-",
    "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
  ],
];
async function table(table: Locator, headers: string[], expected: string[][]) {
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  expect((await table.locator("thead th").allTextContents()).map(norm)).toEqual(
    headers,
  );
  const actual = [];
  for (const row of await table.locator("tbody tr").all()) {
    actual.push((await row.locator("td").allTextContents()).map(norm));
  }
  expect(actual).toEqual(expected.map((row) => row.map(norm)));
}
describe("Upload reference", () => {
  it("非交互文档 Upload：26行API四列逐一精确渲染", async (t) => {
    const page = await open(t, route);
    await table(section(page, "API").getByRole("table"), [
      "属性",
      "类型",
      "默认值",
      "说明",
    ], rows);
  }, DOCS_BROWSER_CONFIG);
  it("非交互文档 Upload：独立消息表字段与默认值精确渲染", async (t) => {
    const page = await open(t, route), demo = section(page, "文案（messages）");
    await table(
      demo.getByRole("table"),
      ["字段", "类型", "默认值", "说明"],
      MESSAGES_UPLOAD.map((r) => [r.name, r.type, r.default, r.description]),
    );
    await visible(demo.getByText("Partial<UploadMessages>", { exact: true }));
    await visible(demo.getByText("defaultUploadMessages", { exact: true }));
  }, DOCS_BROWSER_CONFIG);
  it(
    "非交互文档 Upload：服务挂载、引入和自建分片示例展示具体协议",
    async (t) => {
      const page = await open(t, route);
      const mount = await section(page, "服务端挂载（uiViewUploadPlugin）")
        .locator(
          "pre code",
        ).textContent();
      for (
        const line of [
          'from "@dreamer/ui-view/plugin/upload"',
          'localDir: "./runtime/uploads"',
          'basePath: "/ui-view-upload"',
          "upload: upload.uploadConfig",
          "app.registerPlugin(upload)",
          "action={DEFAULT_UI_VIEW_UPLOAD_BASE_PATH}",
        ]
      ) expect(mount).toContain(line);
      const imports = await section(page, "引入").locator("pre code")
        .textContent();
      expect(imports).toContain("@dreamer/ui-view/form/upload");
      const advanced = await section(page, "进阶").locator("pre code")
        .textContent();
      for (
        const declaration of [
          "runChunkedUpload",
          "chunkSize: DEFAULT_UPLOAD_CHUNK_SIZE",
          "signal,",
          "onProgress:",
          "uploadChunk:",
          "complete:",
        ]
      ) expect(advanced).toContain(declaration);
    },
    DOCS_BROWSER_CONFIG,
  );
  it("物理操作 Upload文档：正文Form链接导航后可输入", async (t) => {
    const page = await open(t, route),
      link = page.locator('main a[href="/desktop/form/form-containers"]');
    expect(await link.count()).toBe(1);
    await link.click({ delay: 180 });
    await eventually(() =>
      new URL(page.url()).pathname === "/desktop/form/form-containers"
    );
    await visible(
      page.getByRole("heading", {
        level: 1,
        name: "Form · FormItem · FormList · createForm",
        exact: true,
      }),
    );
    const input = page.getByPlaceholder("字母开头", { exact: true });
    await input.fill("UploadLink");
    await value(input, "UploadLink");
  }, DOCS_BROWSER_CONFIG);
});
