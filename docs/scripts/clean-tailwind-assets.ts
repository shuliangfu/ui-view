/**
 * 构建前清除 dist 内带 hash 的旧 Tailwind CSS。
 *
 * @dreamer/plugins tailwind 在生产 onResponse 里 `findCssFile` 会
 * `readdir` 后返回**第一个** `tailwind.<hash>.css`，不会按 mtime 选最新。
 * 多份旧产物并存时，可能注入迁 Tailwind 之前的 CSS（缺 dark:/hover:! 等），
 * 表现为「dev OK、build+start 深色行底／字色不对」。
 */
const assetsDir = new URL("../dist/client/assets/", import.meta.url);

try {
  for await (const entry of Deno.readDir(assetsDir)) {
    if (!entry.isFile) continue;
    if (!/^tailwind\.[a-f0-9]+\.css$/.test(entry.name)) continue;
    const path = new URL(entry.name, assetsDir);
    await Deno.remove(path);
    console.log(`[clean-tailwind-assets] removed ${entry.name}`);
  }
} catch (err) {
  if (err instanceof Deno.errors.NotFound) {
    console.log("[clean-tailwind-assets] assets dir missing, skip");
    Deno.exit(0);
  }
  throw err;
}
