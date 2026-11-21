/** WRITTEN-UNRUN. Eight live Chart.js examples: canvas ink, data, and a physical legend or element click. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, example, open } from "./driver.ts";

type ChartSpec = {
  route: string;
  title: string;
  type: string;
  labels: string[] | null;
  datasets: { label?: string; data: unknown[] }[];
  legend: boolean;
};

const SPECS: ChartSpec[] = [
  {
    route: "/desktop/charts/bar",
    title: "基础",
    type: "bar",
    labels: ["红", "绿", "蓝", "黄", "紫", "橙"],
    datasets: [{ label: "数量", data: [12, 19, 6, 14, 8, 11] }],
    legend: false,
  },
  {
    route: "/desktop/charts/pie",
    title: "基础",
    type: "pie",
    labels: ["A", "B", "C", "D", "E"],
    datasets: [{ data: [30, 25, 20, 15, 10] }],
    legend: true,
  },
  {
    route: "/desktop/charts/line",
    title: "多系列 + 面积填充",
    type: "line",
    labels: ["1月", "2月", "3月", "4月", "5月", "6月"],
    datasets: [
      { label: "系列 A", data: [12, 19, 8, 15, 22, 18] },
      { label: "系列 B", data: [2, 9, 14, 11, 6, 12] },
    ],
    legend: true,
  },
  {
    route: "/desktop/charts/doughnut",
    title: "基础",
    type: "doughnut",
    labels: ["A", "B", "C", "D"],
    datasets: [{ data: [35, 30, 20, 15] }],
    legend: true,
  },
  {
    route: "/desktop/charts/bubble",
    title: "多系列",
    type: "bubble",
    labels: null,
    datasets: [
      {
        label: "系列 A",
        data: [
          { x: 20, y: 30, r: 15 },
          { x: 40, y: 10, r: 10 },
          { x: 50, y: 45, r: 20 },
          { x: 70, y: 25, r: 12 },
        ],
      },
      {
        label: "系列 B",
        data: [
          { x: 25, y: 45, r: 8 },
          { x: 55, y: 20, r: 18 },
          { x: 60, y: 55, r: 10 },
        ],
      },
    ],
    legend: true,
  },
  {
    route: "/desktop/charts/polar-area",
    title: "基础",
    type: "polarArea",
    labels: ["红", "绿", "蓝", "黄", "紫"],
    datasets: [{ data: [11, 16, 7, 14, 9] }],
    legend: true,
  },
  {
    route: "/desktop/charts/radar",
    title: "多系列",
    type: "radar",
    labels: ["速度", "力量", "耐力", "技巧", "防守", "进攻"],
    datasets: [
      { label: "系列 A", data: [65, 59, 90, 81, 56, 55] },
      { label: "系列 B", data: [28, 48, 40, 19, 96, 27] },
    ],
    legend: true,
  },
  {
    route: "/desktop/charts/scatter",
    title: "多系列",
    type: "scatter",
    labels: null,
    datasets: [
      {
        label: "系列 A",
        data: [
          { x: 10, y: 20 },
          { x: 25, y: 35 },
          { x: 40, y: 15 },
          { x: 55, y: 45 },
          { x: 70, y: 30 },
        ],
      },
      {
        label: "系列 B",
        data: [
          { x: 15, y: 40 },
          { x: 35, y: 25 },
          { x: 50, y: 50 },
          { x: 65, y: 10 },
        ],
      },
    ],
    legend: true,
  },
];

type ChartHost = HTMLCanvasElement & {
  _chart?: {
    config: { type: string };
    data: {
      labels?: string[];
      datasets: { label?: string; data: unknown[]; hidden?: boolean }[];
    };
    legend?: {
      legendHitBoxes?: {
        left: number;
        top: number;
        width: number;
        height: number;
      }[];
    };
    getDatasetMeta: (i: number) => {
      hidden?: boolean;
      data: { getCenterPoint: () => { x: number; y: number } }[];
    };
    getDataVisibility: (i: number) => boolean;
    getActiveElements: () => unknown[];
    tooltip?: { opacity?: number };
  };
};

async function waitChart(canvas: Locator) {
  await eventually(async () =>
    await canvas.evaluate((el) => !!(el as ChartHost)._chart)
  );
}

async function readChart(canvas: Locator) {
  return await canvas.evaluate((el) => {
    const host = el as ChartHost;
    const chart = host._chart;
    if (!chart) return null;
    const ctx = host.getContext("2d");
    const width = host.width;
    const height = host.height;
    let ink = 0;
    if (ctx && width && height) {
      const img = ctx.getImageData(0, 0, width, height).data;
      for (let i = 0; i < img.length; i += 4) {
        if (
          img[i + 3] > 0 &&
          (img[i] < 250 || img[i + 1] < 250 || img[i + 2] < 250)
        ) {
          ink++;
        }
      }
    }
    return {
      type: chart.config.type,
      labels: chart.data.labels && chart.data.labels.length > 0
        ? chart.data.labels
        : null,
      datasets: chart.data.datasets.map((d) => ({
        label: d.label,
        data: d.data,
      })),
      ink,
      width,
      height,
    };
  });
}

async function clickChart(
  p: Page,
  canvas: Locator,
  kind: "legend" | "point",
) {
  await canvas.evaluate((el) => {
    el.scrollIntoView({ block: "center", inline: "nearest" });
    document.querySelector("main")?.dispatchEvent(
      new Event("scroll", { bubbles: true }),
    );
  });
  const pos = await canvas.evaluate((el, mode) => {
    const host = el as ChartHost;
    const chart = host._chart;
    if (!chart) return null;
    const rect = host.getBoundingClientRect();
    if (mode === "legend") {
      const box = chart.legend?.legendHitBoxes?.[0];
      if (!box) return null;
      return {
        x: rect.left + box.left + box.width / 2,
        y: rect.top + box.top + box.height / 2,
      };
    }
    const pt = chart.getDatasetMeta(0).data[0]?.getCenterPoint();
    if (!pt) return null;
    return { x: rect.left + pt.x, y: rect.top + pt.y };
  }, kind);
  expect(pos != null).toBe(true);
  await p.mouse.click(pos!.x, pos!.y);
}

async function hiddenState(canvas: Locator) {
  return await canvas.evaluate((el) => {
    const chart = (el as ChartHost)._chart;
    if (!chart) return { dataset: false, index: true, active: 0 };
    return {
      dataset: !!chart.getDatasetMeta(0).hidden,
      index: chart.getDataVisibility(0),
      active: chart.getActiveElements().length,
    };
  });
}

describe("Charts physical written", () => {
  for (const width of [390, 1280]) {
    for (const spec of SPECS) {
      it(
        `Chart ${spec.type} ${spec.title} @${width}：画布有墨，数据与示例一致，并真实点击`,
        async (t) => {
          const p = await open(t, spec.route);
          await p.setViewportSize({ width, height: 900 });
          const canvas = example(p, spec.title).locator("canvas");
          await waitChart(canvas);
          await eventually(async () => {
            const snap = await readChart(canvas);
            return !!snap && snap.ink > 50 && snap.width > 0 && snap.height > 0;
          });
          const snap = await readChart(canvas);
          expect(snap != null).toBe(true);
          expect(snap!.type).toBe(spec.type);
          expect(snap!.labels).toEqual(spec.labels);
          expect(snap!.datasets.map((d) => ({
            label: d.label,
            data: d.data,
          }))).toEqual(spec.datasets.map((d) => ({
            label: d.label,
            data: d.data,
          })));
          expect(snap!.ink > 50).toBe(true);
          if (spec.legend) {
            const before = await hiddenState(canvas);
            await clickChart(p, canvas, "legend");
            await eventually(async () => {
              const after = await hiddenState(canvas);
              return after.dataset !== before.dataset ||
                after.index !== before.index;
            });
            const after = await hiddenState(canvas);
            expect(
              after.dataset !== before.dataset || after.index !== before.index,
            ).toBe(true);
          } else {
            await clickChart(p, canvas, "point");
            await eventually(async () =>
              (await hiddenState(canvas)).active > 0
            );
            expect((await hiddenState(canvas)).active > 0).toBe(true);
          }
        },
        DOCS_BROWSER_CONFIG,
      );
    }
  }
});
