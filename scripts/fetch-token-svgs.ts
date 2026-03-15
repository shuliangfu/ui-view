/**
 * 从 @web3icons/core (unpkg) 拉取代币 branded SVG，解析 path 并写入 token TSX 组件。
 * 用法: deno run -A scripts/fetch-token-svgs.ts
 * 来源: https://www.npmjs.com/package/@web3icons/core (MIT)
 */
const BASE =
  "https://unpkg.com/@web3icons/core@4.0.51/dist/svgs/tokens/branded";

const TICKERS = [
  "ADA",
  "ALGO",
  "ARB",
  "ATOM",
  "AVAX",
  "BNB",
  "BTC",
  "CRO",
  "DAI",
  "DOGE",
  "DOT",
  "ETH",
  "FIL",
  "FTM",
  "LINK",
  "LTC",
  "MATIC",
  "NEAR",
  "OP",
  "PEPE",
  "SHIB",
  "SOL",
  "SUI",
  "TRX",
  "UNI",
  "USDC",
  "USDT",
  "WBTC",
  "XRP",
];

/** Ticker -> 组件文件名 (Pascal) */
const TICKER_TO_FILE: Record<string, string> = Object.fromEntries(
  TICKERS.map((t) => [t, t.charAt(0) + t.slice(1).toLowerCase()]),
);

/** Ticker -> 注释用代币名 */
const TICKER_TO_LABEL: Record<string, string> = {
  ADA: "Cardano (ADA)",
  ALGO: "Algorand (ALGO)",
  ARB: "Arbitrum (ARB)",
  ATOM: "Cosmos (ATOM)",
  AVAX: "Avalanche (AVAX)",
  BNB: "BNB",
  BTC: "比特币 (BTC)",
  CRO: "Cronos (CRO)",
  DAI: "Dai (DAI)",
  DOGE: "Dogecoin (DOGE)",
  DOT: "Polkadot (DOT)",
  ETH: "以太坊 (ETH)",
  FIL: "Filecoin (FIL)",
  FTM: "Fantom (FTM)",
  LINK: "Chainlink (LINK)",
  LTC: "Litecoin (LTC)",
  MATIC: "Polygon (MATIC)",
  NEAR: "NEAR",
  OP: "Optimism (OP)",
  PEPE: "Pepe (PEPE)",
  SHIB: "Shiba Inu (SHIB)",
  SOL: "Solana (SOL)",
  SUI: "Sui (SUI)",
  TRX: "TRON (TRX)",
  UNI: "Uniswap (UNI)",
  USDC: "USD Coin (USDC)",
  USDT: "Tether (USDT)",
  WBTC: "Wrapped Bitcoin (WBTC)",
  XRP: "XRP",
};

function extractPathAttrs(pathTag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const fillMatch = pathTag.match(/fill="([^"]*)"/);
  if (fillMatch) attrs.fill = fillMatch[1];
  const dMatch = pathTag.match(/\sd="([^"]*)"/);
  if (dMatch) attrs.d = dMatch[1];
  const fillRuleMatch = pathTag.match(/fill-rule="([^"]*)"/);
  if (fillRuleMatch) attrs.fillRule = fillRuleMatch[1];
  const clipRuleMatch = pathTag.match(/clip-rule="([^"]*)"/);
  if (clipRuleMatch) attrs.clipRule = clipRuleMatch[1];
  const fillOpacityMatch = pathTag.match(/fill-opacity="([^"]*)"/);
  if (fillOpacityMatch) attrs.fillOpacity = fillOpacityMatch[1];
  return attrs;
}

function pathAttrsToJsxLine(attrs: Record<string, string>): string {
  const parts: string[] = [];
  if (attrs.fill != null) parts.push(`fill="${attrs.fill}"`);
  if (attrs.d != null) parts.push(`d="${attrs.d}"`);
  if (attrs.fillRule != null) parts.push(`fill-rule="${attrs.fillRule}"`);
  if (attrs.clipRule != null) parts.push(`clip-rule="${attrs.clipRule}"`);
  if (attrs.fillOpacity != null) {
    parts.push(`fill-opacity="${attrs.fillOpacity}"`);
  }
  return `<path ${parts.join(" ")} />`;
}

async function fetchSvgJs(ticker: string): Promise<string | null> {
  const url = `${BASE}/${ticker}.svg.js`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const text = await res.text();
    const match = text.match(/=\s*['"]([\s\S]*?)['"]\s*[\n\r]/);
    if (!match) return null;
    return match[1].replace(/\\n/g, "\n").replace(/\\'/g, "'");
  } catch {
    return null;
  }
}

function svgStringToPathJsxLines(svgInner: string): string[] {
  const pathTags = svgInner.match(/<path\s[^>]*\/?>/g) ?? [];
  return pathTags.map((tag) => {
    const attrs = extractPathAttrs(tag);
    return pathAttrsToJsxLine(attrs);
  });
}

function toPascal(ticker: string): string {
  return TICKER_TO_FILE[ticker] ??
    ticker.charAt(0) + ticker.slice(1).toLowerCase();
}

function generateTsx(ticker: string, pathLines: string[]): string {
  const name = toPascal(ticker);
  const label = TICKER_TO_LABEL[ticker] ?? ticker;
  const pathBlock = pathLines.map((p) => `    ${p}`).join("\n");
  return `/**
 * ${label} 代币 Logo，24×24，来源 @web3icons/core (MIT)。
 */
import { Icon } from "../../Icon.tsx";
import type { IconComponentProps } from "../../Icon.tsx";

const svg = (
  <svg viewBox="0 0 24 24" fill="none" class="w-full h-full" aria-hidden>
${pathBlock}
  </svg>
);

export function IconToken${name}(props?: IconComponentProps) {
  return () => <Icon size={props?.size} class={props?.class}>{svg}</Icon>;
}
`;
}

async function main() {
  const outDir = new URL("../src/shared/basic/icons/tokens/", import.meta.url)
    .pathname;
  let ok = 0;
  let fail = 0;
  for (const ticker of TICKERS) {
    const raw = await fetchSvgJs(ticker);
    if (!raw) {
      console.error(`# ${ticker}: fetch failed`);
      fail++;
      continue;
    }
    const inner = raw
      .replace(/^[\s\S]*?<svg[^>]*>/, "")
      .replace(/<\/svg>[\s\S]*$/, "");
    const pathLines = svgStringToPathJsxLines(inner);
    if (pathLines.length === 0) {
      console.error(`# ${ticker}: no paths`);
      fail++;
      continue;
    }
    const name = toPascal(ticker);
    const tsx = generateTsx(ticker, pathLines);
    const filePath = `${outDir}/${name}.tsx`;
    await Deno.writeTextFile(filePath, tsx);
    console.log(`wrote ${name}.tsx (${pathLines.length} paths)`);
    ok++;
  }
  console.log(`\ndone: ${ok} ok, ${fail} fail`);
}

main();
