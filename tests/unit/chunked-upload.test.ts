/**
 * runChunkedUpload：分片数量、进度回调、中止行为。
 */

import { describe, expect, it } from "@dreamer/test";
import {
  DEFAULT_UPLOAD_CHUNK_SIZE,
  runChunkedUpload,
} from "../../src/shared/form/chunked-upload.ts";

describe("chunked-upload", () => {
  it("空文件仍调用一次 uploadChunk", async () => {
    const file = new File([], "empty.dat");
    let calls = 0;
    await runChunkedUpload({
      file,
      chunkSize: 1024,
      uploadChunk: () => {
        calls++;
        return Promise.resolve(null);
      },
    });
    expect(calls).toBe(1);
  });

  it("按 chunkSize 切片并累计进度", async () => {
    const data = new Uint8Array(2500);
    const file = new File([data], "b.bin");
    const sizes: number[] = [];
    await runChunkedUpload({
      file,
      chunkSize: 1000,
      onProgress: (loaded) => sizes.push(loaded),
      uploadChunk: ({ chunk, chunkIndex, chunkCount }) => {
        if (chunkIndex === 0) expect(chunk.size).toBe(1000);
        if (chunkIndex === 1) expect(chunk.size).toBe(1000);
        if (chunkIndex === 2) expect(chunk.size).toBe(500);
        expect(chunkCount).toBe(3);
        return Promise.resolve(chunkIndex);
      },
    });
    expect(sizes).toEqual([1000, 2000, 2500]);
  });

  it("默认单片为 DEFAULT_UPLOAD_CHUNK_SIZE", async () => {
    const n = DEFAULT_UPLOAD_CHUNK_SIZE + 1;
    const file = new File([new Uint8Array(n)], "big.bin");
    let count = 0;
    await runChunkedUpload({
      file,
      uploadChunk: () => {
        count++;
        return Promise.resolve(count);
      },
    });
    expect(count).toBe(2);
  });

  it("complete 收到按序 parts", async () => {
    const file = new File([new Uint8Array(100)], "c.bin");
    let partsOut: unknown[] = [];
    await runChunkedUpload({
      file,
      chunkSize: 40,
      uploadChunk: ({ chunkIndex }) => Promise.resolve(`p${chunkIndex}`),
      complete: async ({ parts }) => {
        partsOut = parts;
      },
    });
    expect(partsOut).toEqual(["p0", "p1", "p2"]);
  });

  it("AbortSignal 中止后抛出 AbortError", async () => {
    const file = new File([new Uint8Array(10_000)], "d.bin");
    const ac = new AbortController();
    let err: unknown;
    try {
      await runChunkedUpload({
        file,
        chunkSize: 1000,
        signal: ac.signal,
        uploadChunk: async ({ chunkIndex }) => {
          if (chunkIndex === 1) ac.abort();
          await Promise.resolve();
          return chunkIndex;
        },
      });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(DOMException);
    expect((err as DOMException).name).toBe("AbortError");
  });
});
