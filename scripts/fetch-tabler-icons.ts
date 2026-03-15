/**
 * 从 Tabler Icons 官方仓库拉取全部 SVG 图标到本地。
 * 来源: https://github.com/tabler/tabler-icons (MIT)
 * 用法: deno run -A scripts/fetch-tabler-icons.ts
 *
 * 会克隆 tabler/tabler-icons（仅最新 commit），将 icons/outline 与 icons/filled
 * 复制到 assets/tabler-icons/outline 与 assets/tabler-icons/filled，然后删除克隆目录。
 */

const TABLER_REPO = "https://github.com/tabler/tabler-icons.git";
const CLONE_DIR = "tabler-icons-clone";
const OUT_BASE = "assets/tabler-icons";

async function run(cmd: string[], cwd?: string): Promise<{ ok: boolean; stderr: string }> {
  const p = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    cwd: cwd ?? undefined,
    stdout: "piped",
    stderr: "piped",
  });
  const { code, stderr } = await p.output();
  return { ok: code === 0, stderr: new TextDecoder().decode(stderr) };
}

async function main() {
  const scriptDir = new URL(".", import.meta.url).pathname;
  const projectRoot = new URL("../", import.meta.url).pathname;

  console.log("Cloning tabler/tabler-icons (depth 1)...");
  const clonePath = `${projectRoot}${CLONE_DIR}`;
  const { ok: cloneOk, stderr: cloneErr } = await run([
    "git",
    "clone",
    "--depth",
    "1",
    TABLER_REPO,
    CLONE_DIR,
  ], projectRoot);

  if (!cloneOk) {
    console.error("Clone failed:", cloneErr);
    Deno.exit(1);
  }

  const iconsDir = `${clonePath}/icons`;
  const outlineSrc = `${iconsDir}/outline`;
  const filledSrc = `${iconsDir}/filled`;
  const outlineDst = `${projectRoot}${OUT_BASE}/outline`;
  const filledDst = `${projectRoot}${OUT_BASE}/filled`;

  try {
    const outlineExists = await Deno.stat(outlineSrc).then(() => true).catch(() => false);
    const filledExists = await Deno.stat(filledSrc).then(() => true).catch(() => false);

    await Deno.mkdir(outlineDst, { recursive: true });
    await Deno.mkdir(filledDst, { recursive: true });

    if (outlineExists) {
      for await (const e of Deno.readDir(outlineSrc)) {
        if (e.isFile && e.name.endsWith(".svg")) {
          const src = `${outlineSrc}/${e.name}`;
          const dst = `${outlineDst}/${e.name}`;
          await Deno.copyFile(src, dst);
        }
      }
      const count = [...await Array.fromAsync(Deno.readDir(outlineDst))].filter((e) => e.name.endsWith(".svg")).length;
      console.log(`Outline: ${count} SVGs -> ${OUT_BASE}/outline/`);
    }

    if (filledExists) {
      for await (const e of Deno.readDir(filledSrc)) {
        if (e.isFile && e.name.endsWith(".svg")) {
          const src = `${filledSrc}/${e.name}`;
          const dst = `${filledDst}/${e.name}`;
          await Deno.copyFile(src, dst);
        }
      }
      const count = [...await Array.fromAsync(Deno.readDir(filledDst))].filter((e) => e.name.endsWith(".svg")).length;
      console.log(`Filled:  ${count} SVGs -> ${OUT_BASE}/filled/`);
    }
  } finally {
    console.log("Removing clone...");
    try {
      await Deno.remove(clonePath, { recursive: true });
    } catch (e) {
      console.warn("Cleanup warning:", e);
    }
  }

  console.log("Done. Icons are under " + OUT_BASE + "/");
}

main();
