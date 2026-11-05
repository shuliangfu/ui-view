/**
 * @module shared/data-display/qrcode-matrix
 * @description 最小二维码矩阵生成（字节模式、纠错 M、版本自选）；供 {@link QRCode} 使用，无第三方依赖。
 * 算法源自仓内自研实现（ISO/IEC 18004）。
 */

// 纠错等级 M: 每块纠错码字数、块数, 下标 = 版本号。
const ECC_PER_BLOCK = [
  -1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26,
  26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
];
const NUM_BLOCKS = [
  -1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16,
  17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49,
];
const FORMAT_BITS_M = 0;

function bit(x: number, i: number): boolean {
  return ((x >>> i) & 1) !== 0;
}

function rawModules(ver: number): number {
  let result = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const n = Math.floor(ver / 7) + 2;
    result -= (25 * n - 10) * n - 55;
    if (ver >= 7) result -= 36;
  }
  return result;
}

function dataCodewords(ver: number): number {
  return Math.floor(rawModules(ver) / 8) - ECC_PER_BLOCK[ver] * NUM_BLOCKS[ver];
}

function gfMul(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}

function rsDivisor(degree: number): number[] {
  const result = new Array(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = gfMul(result[j], root);
      if (j + 1 < degree) result[j] ^= result[j + 1];
    }
    root = gfMul(root, 0x02);
  }
  return result;
}

function rsRemainder(data: number[], divisor: number[]): number[] {
  const result = new Array(divisor.length).fill(0);
  for (const b of data) {
    const factor = b ^ (result.shift() as number);
    result.push(0);
    divisor.forEach((coef, i) => result[i] ^= gfMul(coef, factor));
  }
  return result;
}

/** 把文字编码成二维码矩阵。true = 黑块。 */
export function qrMatrix(text: string): boolean[][] {
  const bytes = Array.from(new TextEncoder().encode(text));

  // 1. 选最小能装下的版本
  let ver = 1;
  for (; ver <= 40; ver++) {
    const ccBits = ver < 10 ? 8 : 16;
    if (4 + ccBits + bytes.length * 8 <= dataCodewords(ver) * 8) break;
  }
  if (ver > 40) throw new Error("二维码内容太长");

  // 2. 数据位流: 模式 0100 + 长度 + 数据 + 结束符 + 补齐
  const bits: number[] = [];
  const push = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
  };
  push(0b0100, 4);
  push(bytes.length, ver < 10 ? 8 : 16);
  for (const b of bytes) push(b, 8);
  const capBits = dataCodewords(ver) * 8;
  push(0, Math.min(4, capBits - bits.length));
  push(0, (8 - bits.length % 8) % 8);
  for (let pad = 0xec; bits.length < capBits; pad ^= 0xec ^ 0x11) push(pad, 8);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0;
    for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j];
    data.push(v);
  }

  // 3. 分块加纠错码并交错
  const numBlocks = NUM_BLOCKS[ver];
  const eccLen = ECC_PER_BLOCK[ver];
  const rawCodewords = Math.floor(rawModules(ver) / 8);
  const numShort = numBlocks - rawCodewords % numBlocks;
  const shortLen = Math.floor(rawCodewords / numBlocks);
  const divisor = rsDivisor(eccLen);
  const blocks: number[][] = [];
  for (let i = 0, k = 0; i < numBlocks; i++) {
    const dat = data.slice(k, k + shortLen - eccLen + (i < numShort ? 0 : 1));
    k += dat.length;
    const ecc = rsRemainder(dat, divisor);
    if (i < numShort) dat.push(0);
    blocks.push(dat.concat(ecc));
  }
  const codewords: number[] = [];
  for (let i = 0; i < blocks[0].length; i++) {
    blocks.forEach((block, j) => {
      if (i !== shortLen - eccLen || j >= numShort) codewords.push(block[i]);
    });
  }

  // 4. 画功能图形
  const size = ver * 4 + 17;
  const mod: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));
  const fn: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));
  const setFn = (x: number, y: number, dark: boolean) => {
    mod[y][x] = dark;
    fn[y][x] = true;
  };
  for (let i = 0; i < size; i++) {
    setFn(6, i, i % 2 === 0);
    setFn(i, 6, i % 2 === 0);
  }
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        const x = cx + dx, y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) setFn(x, y, d !== 2 && d !== 4);
      }
    }
  }
  const align: number[] = [];
  if (ver > 1) {
    const n = Math.floor(ver / 7) + 2;
    const step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2;
    align.push(6);
    for (let pos = size - 7; align.length < n; pos -= step) align.splice(1, 0, pos);
  }
  for (let i = 0; i < align.length; i++) {
    for (let j = 0; j < align.length; j++) {
      const last = align.length - 1;
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) continue;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          setFn(align[i] + dx, align[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
      }
    }
  }
  const drawFormat = (mask: number) => {
    const d = (FORMAT_BITS_M << 3) | mask;
    let rem = d;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const f = ((d << 10) | rem) ^ 0x5412;
    for (let i = 0; i <= 5; i++) setFn(8, i, bit(f, i));
    setFn(8, 7, bit(f, 6));
    setFn(8, 8, bit(f, 7));
    setFn(7, 8, bit(f, 8));
    for (let i = 9; i < 15; i++) setFn(14 - i, 8, bit(f, i));
    for (let i = 0; i < 8; i++) setFn(size - 1 - i, 8, bit(f, i));
    for (let i = 8; i < 15; i++) setFn(8, size - 15 + i, bit(f, i));
    setFn(8, size - 8, true);
  };
  drawFormat(0);
  if (ver >= 7) {
    let rem = ver;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const v = (ver << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const a = size - 11 + i % 3, b = Math.floor(i / 3);
      setFn(a, b, bit(v, i));
      setFn(b, a, bit(v, i));
    }
  }

  // 5. 填数据(之字形)
  let idx = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const up = ((right + 1) & 2) === 0;
        const y = up ? size - 1 - vert : vert;
        if (!fn[y][x] && idx < codewords.length * 8) {
          mod[y][x] = bit(codewords[idx >>> 3], 7 - (idx & 7));
          idx++;
        }
      }
    }
  }

  // 6. 8 种掩码挑扣分最少的(提高扫码成功率)
  const maskHit = (m: number, x: number, y: number): boolean => {
    switch (m) {
      case 0: return (x + y) % 2 === 0;
      case 1: return y % 2 === 0;
      case 2: return x % 3 === 0;
      case 3: return (x + y) % 3 === 0;
      case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
      case 5: return (x * y) % 2 + (x * y) % 3 === 0;
      case 6: return ((x * y) % 2 + (x * y) % 3) % 2 === 0;
      default: return ((x + y) % 2 + (x * y) % 3) % 2 === 0;
    }
  };
  const applyMask = (m: number) => {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (!fn[y][x] && maskHit(m, x, y)) mod[y][x] = !mod[y][x];
      }
    }
  };
  let best = 0, bestScore = Infinity;
  for (let m = 0; m < 8; m++) {
    applyMask(m);
    drawFormat(m);
    const score = penalty(mod);
    if (score < bestScore) {
      bestScore = score;
      best = m;
    }
    applyMask(m); // 掩码是异或, 再做一次就还原
  }
  applyMask(best);
  drawFormat(best);
  return mod;
}

/** 掩码扣分: 连续同色、2x2 同色块、类定位图形、黑白比例(标准第 4 种规则全做)。 */
function penalty(m: boolean[][]): number {
  const size = m.length;
  let score = 0;
  const finderLike = (line: boolean[]) => {
    let s = 0;
    const p = [true, false, true, true, true, false, true];
    for (let i = 0; i + 7 <= line.length; i++) {
      if (!p.every((v, k) => line[i + k] === v)) continue;
      const before = line.slice(Math.max(0, i - 4), i);
      const after = line.slice(i + 7, i + 11);
      if ((i < 4 || before.every((v) => !v)) || (i + 11 > line.length || after.every((v) => !v))) s += 40;
    }
    return s;
  };
  for (let pass = 0; pass < 2; pass++) {
    for (let a = 0; a < size; a++) {
      const line = Array.from({ length: size }, (_, b) => pass === 0 ? m[a][b] : m[b][a]);
      let run = 1;
      for (let b = 1; b <= size; b++) {
        if (b < size && line[b] === line[b - 1]) run++;
        else {
          if (run >= 5) score += run - 2;
          run = 1;
        }
      }
      score += finderLike(line);
    }
  }
  let dark = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (m[y][x]) dark++;
      if (x < size - 1 && y < size - 1) {
        const c = m[y][x];
        if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) score += 3;
      }
    }
  }
  const total = size * size;
  score += Math.floor(Math.abs(dark * 20 - total * 10) / total) * 10;
  return score;
}

/** 生成 SVG 文本。四周留 4 格白边(标准要求), 黑块合并成一条 path, 文件小。 */
export function qrSvg(text: string, px = 220): string {
  const m = qrMatrix(text);
  const n = m.length + 8;
  let d = "";
  m.forEach((row, y) => row.forEach((on, x) => {
    if (on) d += `M${x + 4} ${y + 4}h1v1h-1z`;
  }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" width="${px}" height="${px}" shape-rendering="crispEdges"><rect width="${n}" height="${n}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}

/** 给 <img src> 用的 data URL。SVG 内容只有 ASCII, 可以直接 btoa。 */
export function qrDataUrl(text: string, px = 220): string {
  return `data:image/svg+xml;base64,${btoa(qrSvg(text, px))}`;
}


/** 终端可扫的 ASCII 二维码。四周留 4 格白边；半块字(▀▄█)压成约 1/4 面积仍可扫。 */
export function qrAscii(text: string): string {
  const m = qrMatrix(text);
  const pad = 4;
  const n = m.length + pad * 2;
  const at = (x: number, y: number): boolean => {
    const mx = x - pad;
    const my = y - pad;
    return mx >= 0 && my >= 0 && mx < m.length && my < m.length && !!m[my][mx];
  };
  const lines: string[] = [];
  // 两行模块合成一行：宽 1 字/模块、高 1/2 行/模块 → 打印面积约原 1/4
  for (let y = 0; y < n; y += 2) {
    let line = "";
    for (let x = 0; x < n; x++) {
      const top = at(x, y);
      const bottom = y + 1 < n && at(x, y + 1);
      line += top && bottom ? "█" : top ? "▀" : bottom ? "▄" : " ";
    }
    lines.push(line);
  }
  return lines.join("\n");
}
