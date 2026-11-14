/**
 * Upload smoke: uiViewUploadPlugin (localDir required, basePath=/ui-view-upload)
 * real init→chunk→complete + RichText helper same base.
 * Run: deno run -A scripts/smoke-ui-view-upload.ts
 */
import { createMultipartUploadHandler } from "@dreamer/upload/server";
import {
  DEFAULT_UI_VIEW_UPLOAD_BASE_PATH,
  uiViewUploadPlugin,
  wrapUploadCompletePipeline,
} from "../upload.ts";
import { uploadFileViaUiViewBase } from "../src/shared/form/upload-http.ts";

const BASE = DEFAULT_UI_VIEW_UPLOAD_BASE_PATH;

function tinyPngFile(): File {
  // 1x1 PNG
  const bytes = Uint8Array.from([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
    0x00,
    0x00,
    0x00,
    0x0d,
    0x49,
    0x48,
    0x44,
    0x52,
    0x00,
    0x00,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    0x01,
    0x08,
    0x02,
    0x00,
    0x00,
    0x00,
    0x90,
    0x77,
    0x53,
    0xde,
    0x00,
    0x00,
    0x00,
    0x0c,
    0x49,
    0x44,
    0x41,
    0x54,
    0x08,
    0xd7,
    0x63,
    0xf8,
    0xff,
    0xff,
    0x3f,
    0x00,
    0x05,
    0xfe,
    0x02,
    0xfe,
    0xa7,
    0x35,
    0x81,
    0x84,
    0x00,
    0x00,
    0x00,
    0x00,
    0x49,
    0x45,
    0x4e,
    0x44,
    0xae,
    0x42,
    0x60,
    0x82,
  ]);
  return new File([bytes], "smoke.png", { type: "image/png" });
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

// localDir required
let threw = false;
try {
  uiViewUploadPlugin({ localDir: "   " } as never);
} catch (e) {
  threw = String(e).includes("localDir is required");
}
assert(threw, "empty localDir must throw");

const localDir = await Deno.makeTempDir({ prefix: "ui-view-upload-smoke-" });
const plugin = uiViewUploadPlugin({
  localDir,
  basePath: BASE,
  requireAuth: false,
});
assert(
  (plugin.uploadConfig as { basePath: string }).basePath === BASE,
  `basePath must be ${BASE}`,
);

const handler = createMultipartUploadHandler(
  plugin.uploadConfig as never,
);
wrapUploadCompletePipeline(handler, {
  storage: plugin.storage,
  basePath: BASE,
});

const server = Deno.serve({ port: 0, hostname: "127.0.0.1" }, async (req) => {
  const url = new URL(req.url);
  // plugin file serve
  if (
    (req.method === "GET" || req.method === "HEAD") &&
    url.pathname === `${BASE}/file`
  ) {
    const fakeCtx = {
      method: req.method,
      path: url.pathname,
      url,
      request: req,
    };
    const res = await plugin.onRequest?.(fakeCtx as never, {} as never);
    if (res instanceof Response) return res;
  }
  const r = await handler.handle(req, BASE);
  if (r) return r;
  return new Response("not found", { status: 404 });
});

const port = server.addr.transport === "tcp" ? server.addr.port : 0;
const origin = `http://127.0.0.1:${port}`;
const endpoint = `${origin}${BASE}`;

try {
  assert(
    BASE === "/ui-view-upload",
    "DEFAULT_UI_VIEW_UPLOAD_BASE_PATH must be /ui-view-upload",
  );

  const url = await uploadFileViaUiViewBase(endpoint, tinyPngFile(), {
    chunkSize: 1024,
  });
  assert(typeof url === "string" && url.length > 0, "complete must return url");
  console.log("[smoke] upload complete url=", url);

  // RichText same base: helper path uses DEFAULT when empty — call with BASE path segment
  const url2 = await uploadFileViaUiViewBase(`${origin}${BASE}`, tinyPngFile());
  assert(url2.length > 0, "RichText-aligned second upload failed");
  console.log("[smoke] richtext-aligned upload ok url=", url2);

  console.log("[smoke] PASS");
} finally {
  await server.shutdown();
  try {
    await Deno.remove(localDir, { recursive: true });
  } catch {
    /* ignore */
  }
}
