/**
 * uiViewUploadPlugin: object-key safety, exact file route, HEAD, and
 * complete-pipeline download skipping.
 */
import { describe, expect, it } from "@dreamer/test";
import type { RequestContext } from "@dreamer/plugin";
import type { ServiceContainer } from "@dreamer/service";
import {
  isSafeUiViewUploadObjectKey,
  uiViewUploadPlugin,
  wrapUploadCompletePipeline,
  type UiViewUploadStorage,
} from "../upload.ts";

function stubContainer(): ServiceContainer {
  return {
    has: () => false,
    get: () => {
      throw new Error("unexpected container.get");
    },
    tryGet: () => undefined,
  } as unknown as ServiceContainer;
}

function fileCtx(
  method: string,
  path: string,
  key?: string,
): RequestContext {
  const url = new URL(`http://example.test${path}`);
  if (key != null) url.searchParams.set("key", key);
  const request = new Request(url, { method });
  return {
    request,
    path,
    method,
    url,
    headers: request.headers,
  };
}

function mockStorage(
  opts?: { exists?: (key: string) => Promise<boolean> },
): UiViewUploadStorage & { downloads: string[] } {
  const downloads: string[] = [];
  return {
    downloads,
    download: async (key: string) => {
      downloads.push(key);
      return new Uint8Array([1, 2, 3, 4]);
    },
    upload: async () => {},
    delete: async () => {},
    exists: opts?.exists,
    getPresignedUrl: async () => "http://example.test/file",
  };
}

describe("isSafeUiViewUploadObjectKey", () => {
  it("accepts relative object keys with a single extension", () => {
    expect(isSafeUiViewUploadObjectKey("avatars/a.png")).toBe(true);
    expect(isSafeUiViewUploadObjectKey("files/x")).toBe(true);
  });

  it("rejects traversal, absolute, and empty-segment keys", () => {
    expect(isSafeUiViewUploadObjectKey("")).toBe(false);
    expect(isSafeUiViewUploadObjectKey("..")).toBe(false);
    expect(isSafeUiViewUploadObjectKey("../secret")).toBe(false);
    expect(isSafeUiViewUploadObjectKey("foo/../bar")).toBe(false);
    expect(isSafeUiViewUploadObjectKey("foo/./bar")).toBe(false);
    expect(isSafeUiViewUploadObjectKey("foo//bar")).toBe(false);
    expect(isSafeUiViewUploadObjectKey("/etc/passwd")).toBe(false);
    expect(isSafeUiViewUploadObjectKey("foo\\bar")).toBe(false);
    expect(isSafeUiViewUploadObjectKey("C:foo")).toBe(false);
    expect(isSafeUiViewUploadObjectKey("~/.ssh/id")).toBe(false);
    expect(isSafeUiViewUploadObjectKey("foo\0bar")).toBe(false);
    expect(isSafeUiViewUploadObjectKey("．．/x")).toBe(false);
  });
});

describe("uiViewUploadPlugin file route", () => {
  it("serves only the exact file path and rejects unsafe keys", async () => {
    const storage = mockStorage({
      exists: async (key) => key === "avatars/ok.png",
    });
    const plugin = uiViewUploadPlugin({
      localDir: "./tmp-upload-security",
      requireAuth: false,
      pathPrefix: "avatars",
      storage,
    });

    const ok = await plugin.onRequest?.(
      fileCtx("GET", "/ui-view-upload/file", "avatars/ok.png"),
      stubContainer(),
    );
    expect(ok).toBeTruthy();
    expect((ok as Response).status).toBe(200);
    expect((ok as Response).headers.get("content-type")).toBe("image/png");
    expect((ok as Response).headers.get("x-content-type-options")).toBe(
      "nosniff",
    );
    expect((ok as Response).headers.get("content-disposition")).toContain(
      "inline",
    );
    expect(storage.downloads).toEqual(["avatars/ok.png"]);

    const suffix = await plugin.onRequest?.(
      fileCtx("GET", "/evil/ui-view-upload/file", "avatars/ok.png"),
      stubContainer(),
    );
    expect(suffix).toBeUndefined();

    const bad = await plugin.onRequest?.(
      fileCtx("GET", "/ui-view-upload/file", "../avatars/ok.png"),
      stubContainer(),
    );
    expect((bad as Response).status).toBe(400);

    const outsidePrefix = await plugin.onRequest?.(
      fileCtx("GET", "/ui-view-upload/file", "other/ok.png"),
      stubContainer(),
    );
    expect((outsidePrefix as Response).status).toBe(400);
  });

  it("HEAD does not read the file body when exists() is available", async () => {
    const storage = mockStorage({
      exists: async (key) => key === "avatars/ok.png",
    });
    const plugin = uiViewUploadPlugin({
      localDir: "./tmp-upload-security",
      requireAuth: false,
      pathPrefix: "avatars",
      storage,
    });
    const res = await plugin.onRequest?.(
      fileCtx("HEAD", "/ui-view-upload/file", "avatars/ok.png"),
      stubContainer(),
    );
    expect((res as Response).status).toBe(200);
    expect((await (res as Response).arrayBuffer()).byteLength).toBe(0);
    expect(storage.downloads).toEqual([]);
  });
});

describe("wrapUploadCompletePipeline", () => {
  it("skips download when afterComplete and dual are both off", async () => {
    const storage = mockStorage();
    const handler: {
      handle: (
        request: Request,
        basePath?: string,
      ) => Promise<Response | null> | Response | null;
    } = {
      handle: () =>
        new Response(
          JSON.stringify({ fileId: "files/a.bin", url: "http://x/a" }),
          { status: 200 },
        ),
    };
    wrapUploadCompletePipeline(handler, {
      storage,
      basePath: "/ui-view-upload",
    });
    const res = await handler.handle(
      new Request("http://x/ui-view-upload/complete", { method: "POST" }),
    );
    expect(res?.ok).toBe(true);
    expect(storage.downloads).toEqual([]);
    const body = JSON.parse(await res!.text()) as { data?: { url?: string } };
    expect(body.data?.url).toBe("http://x/a");
  });

  it("downloads when afterComplete is set", async () => {
    const storage = mockStorage();
    const handler: {
      handle: (
        request: Request,
        basePath?: string,
      ) => Promise<Response | null> | Response | null;
    } = {
      handle: () =>
        new Response(JSON.stringify({ fileId: "files/a.bin" }), {
          status: 200,
        }),
    };
    wrapUploadCompletePipeline(handler, {
      storage,
      basePath: "/ui-view-upload",
      afterComplete: async () => {},
    });
    await handler.handle(
      new Request("http://x/ui-view-upload/complete", { method: "POST" }),
    );
    expect(storage.downloads).toEqual(["files/a.bin"]);
  });

  it("does not download for dual when the key is clearly not an image", async () => {
    const storage = mockStorage();
    const handler: {
      handle: (
        request: Request,
        basePath?: string,
      ) => Promise<Response | null> | Response | null;
    } = {
      handle: () =>
        new Response(JSON.stringify({ fileId: "files/notes.txt" }), {
          status: 200,
        }),
    };
    wrapUploadCompletePipeline(handler, {
      storage,
      basePath: "/ui-view-upload",
      image: { dual: true },
    });
    await handler.handle(
      new Request("http://x/ui-view-upload/complete", { method: "POST" }),
    );
    expect(storage.downloads).toEqual([]);
  });
});
