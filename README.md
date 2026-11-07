# 📦 @dreamer/ui-view

UI component library based on View and Tailwind CSS, with light/dark theme and
desktop + mobile support, for enterprise apps and admin dashboards.

**简体中文:** [README-zh.md](./README-zh.md)

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)

---

## Installation

```bash
# Deno
deno add jsr:@dreamer/ui-view

# Bun
bunx jsr add @dreamer/ui-view

# Node.js 22+
npx jsr add @dreamer/ui-view
```

---

## 🌍 Environment Compatibility

| Environment | Version | Support |
| ----------- | ------- | ------- |
| **Deno**    | 2.9+    | ✅      |
| **Bun**     | 1.3+    | ✅      |
| **Node.js** | 22+     | ✅      |
| Browser     | -       | ✅      |

---

## 📂 Entry points

| Entry | Description |
| ----- | ----------- |
| `@dreamer/ui-view` | Desktop aggregate (default). Prefer **named** imports; avoid `import *`. |
| `@dreamer/ui-view/basic` | Button, Link, Icon, Typography, Badge, Avatar, … |
| `@dreamer/ui-view/form` | Form controls (Input, Select, Upload, …) |
| `@dreamer/ui-view/data-display` | Table, DataPanel, CodeBlock, Tree, … |
| `@dreamer/ui-view/feedback` | Modal, Drawer, Toast/Message helpers, … |
| `@dreamer/ui-view/layout` | Container, Grid, Tabs, Accordion, … |
| `@dreamer/ui-view/navigation` | Menu, Pagination, Dropdown, Anchor, … |
| `@dreamer/ui-view/charts` | Chart.js wrappers |
| `@dreamer/ui-view/config-provider` | Theme / ConfigProvider |
| `@dreamer/ui-view/mobile` / `…/mobile/*` | Mobile aggregate and category entries |
| `@dreamer/ui-view/icons` | Built-in icon barrel (no country-flag `export *`) |
| `@dreamer/ui-view/icons/flags` | Country-flag catalog barrel |
| `@dreamer/ui-view/icons/…` (Node/Bun via `package.json` `./icons/*` only) | **Single icon/flag file** deep path — **not** in `deno.json` (Deno forbids `*` exports) |
| `@dreamer/ui-view/plugin` | Tailwind v4 on-demand `@source` plugin |
| `@dreamer/ui-view/plugin/upload` | Server upload plugin (`localDir` required; default `/ui-view-upload`) |

### Tree-shaking / minimal bundle

Three layers (prefer top → bottom only when needed):

| Style | Example | When |
| ----- | ------- | ---- |
| **Category subpath** | `import { DataPanel } from "@dreamer/ui-view/data-display"` | Everyday components — published via `deno.json` / `package.json` `exports` (`./basic`, `./form`, `./data-display`, …) |
| **Per-file icon/flag** | `import { IconHome } from "@dreamer/ui-view/icons/Home.tsx"` | **npm/Node/Bun only** (`package.json` `./icons/*`). Deno/JSR: use `@dreamer/ui-view/icons` or `/icons/flags`, or vendor the file — do **not** rely on `*` in `deno.json` |
| **Icon / flag barrel** | `import { IconHome } from "@dreamer/ui-view/icons"` or `…/icons/flags` | Icon **catalog** pages only; pulls many icons/flags |

```ts
// ✅ Category subpath (recommended for components)
import { DataPanel, CodeBlock } from "@dreamer/ui-view/data-display";
import { Paragraph, Title, Button } from "@dreamer/ui-view/basic";

// ✅ Single icon / single flag (smallest) — npm/Node/Bun (`package.json` `./icons/*`)
import { IconHome } from "@dreamer/ui-view/icons/Home.tsx";
import { IconBrandGithub } from "@dreamer/ui-view/icons/brands/GitHub.tsx";
import { IconFlagCN } from "@dreamer/ui-view/icons/flags/standalone/IconFlagCN.tsx";
// Deno/JSR: use barrels below (or category subpaths); no `./icons/*` in deno.json
import { IconHome } from "@dreamer/ui-view/icons";
import { IconFlagCN } from "@dreamer/ui-view/icons/flags";

// ⚠️ Root `@dreamer/ui-view` named import is OK for apps, but never
//    `import * as Uv from "@dreamer/ui-view"` + `Object.keys(Uv)` (pins the whole barrel into a shared chunk).

// ❌ Country flags are NOT re-exported from the root / basic / icons barrels anymore.
//    Use `icons/flags` catalog, or (npm/Node/Bun) per-file `icons/flags/…` via package.json `./icons/*`.
//    Deno/JSR: prefer `@dreamer/ui-view/icons` / `/icons/flags` — no `*` export in deno.json.
```

> **Form deep paths:** Prefer `@dreamer/ui-view/form/select` (etc.) over the `./form` barrel when you want a single widget. `MobilePortalHostScope` is `@dreamer/ui-view/mobile/portal` (not the fat `./mobile` aggregate).

> **Publish note:** Category entries (`./data-display`, …) and `./icons` / `./icons/flags` are in both `deno.json` and `package.json`. Per-file `./icons/*` lives **only** in `package.json` (Node/Bun/npm). Deno rejects `*` in `deno.json` exports — do not add it back. For Deno/JSR consumers: import from `@dreamer/ui-view/icons`, `@dreamer/ui-view/icons/flags`, or a category subpath; do not depend on wildcard deep paths.

## 🎨 Using with Tailwind

Components are styled with Tailwind utility classes. After publishing to JSR,
your project’s Tailwind does not scan dependency packages by default; without
configuration, those classes are not included in the final CSS and component
styles will be missing.

There is also a **bundle size** issue: if you add this package’s **entire
source** to Tailwind’s content, the build will keep **every** component’s
classes, so even if you only use one Button, the final CSS can be large.

**We recommend the provided plugin** to collect only the classes you use and
generate an @source file for minimal output size.

### Plugin-based styling

Register the plugin in your app; during initialization (onInit) it scans for
imports from `@dreamer/ui-view`, writes the used component source paths into a
CSS file, and you `@import` that file in your main Tailwind entry. Single build,
**single CSS**, no duplicate theme, smallest size.

**1. Register the plugin in your app entry (before tailwindPlugin):**

```ts
import { App } from "@dreamer/dweb";
import { uiViewTailwindPlugin } from "@dreamer/ui-view/plugin";
import { tailwindPlugin } from "@dreamer/plugins/tailwindcss";

const app = new App();

app.registerPlugin(uiViewTailwindPlugin({
  outputPath: "src/assets/ui-view-sources.css", // output file path
  scanPath: "src", // directory to scan
  // packageRoot optional; defaults to plugin package root (e.g. node_modules/@dreamer/ui-view)
}));

app.registerPlugin(tailwindPlugin({
  output: "dist/client/assets",
  cssEntry: "src/assets/tailwind.css",
  assetsPath: "/assets",
}));

app.start();
```

**2. In your main Tailwind CSS entry, import the generated file:**

```css
@import "./ui-view-sources.css"; /* generated by plugin, contains only @source "path"; paths are relative to this CSS file */
@source "./src/**/*.{ts,tsx}"; /* your app source; adjust path to your project */

@import "tailwindcss";
```

If your Tailwind entry or app source paths differ from the example, adjust the
`@import` and `@source` paths accordingly.

The plugin scans all `.ts`/`.tsx` under `scanPath` for named imports from
`@dreamer/ui-view` (or `jsr:@dreamer/ui-view`), collects component names, and
writes a CSS file that only contains `@source "path";`. Tailwind then scans only
those paths, so the final CSS includes only the classes you use and the theme
appears once.

---

## dweb + View: `compileSource` for package `.tsx`

By default, **dweb** runs `@dreamer/view`’s **`compileSource` (jsx-compiler)**
only on your app **`src/`** tree. **JSR / workspace** dependencies such as
`@dreamer/ui-view` usually live **outside** that tree, so their `.tsx` is
bundled as plain **jsx-runtime VNode** code (same caveats as `checked={getter}`
on native inputs unless you use boolean props or enable the compiler for those
paths).

From **@dreamer/dweb** versions that support `render.compiler`, list **source
roots** for packages whose `.tsx` should go through **jsx-compiler** (e.g.
`@dreamer/ui-view`’s `src` folder), as **cwd-relative strings** or absolute
paths.

**This does not “compile every file under those directories” into the bundle.**
esbuild still follows the **import graph** from the client entry: only modules
that are **actually imported** (transitively) get loaded, and **then**—if their
path falls under one of these roots—`compileSource` runs on that file. Unused
components are typically never loaded, so they are not compiled into the output.
**Barrel files** that re-export many components can widen the graph, same as
usual tree-shaking behavior.

```ts
// config/main.ts (Deno)
import type { AppConfig } from "@dreamer/dweb/types";

export default {
  render: {
    engine: "view",
    mode: "hybrid",
    // Dependency source root(s), relative to process cwd(); set to a real path in your repo
    compiler: ["./to/path"],
  },
} satisfies AppConfig;
```

Relative entries are resolved from **`cwd()`** when the app runs. The same list
is used for **client bundle**, **prod `Builder` client plugins**, and **SSR
route bundling** (`loadViewRouteModuleViaSsrBundle`).

**Note:** Point at the package’s actual `src` (or equivalent) root; if the path
is wrong, those `.tsx` files won’t get `compileSource`.

---

## 📋 Component overview

### 🧱 Basic

- **Button** button
- **Link** text/icon link
- **Icon** icon wrapper
- **Typography** Title, Paragraph, Text
- **Badge** badge, count
- **Avatar** avatar
- **Skeleton** skeleton
- **Spinner** loading spinner
- **Icons** icon set (e.g. ChevronDown, Close, Calendar)

### 📝 Form

- **Input** single-line input
- **Search** search input
- **Password** password input
- **Textarea** multiline input
- **InputNumber** number input
- **AutoComplete** autocomplete
- **Checkbox / CheckboxGroup** checkbox / group
- **Radio / RadioGroup** radio / group
- **Switch** switch
- **Slider** slider
- **Rate** rating
- **DatePicker** date selection (`single` / `range` / `multiple`)
- **DateTimePicker** date + time (`single` / `range` / `multiple`)
- **TimePicker** time selection (`single` / `range` / `multiple`)
- **Upload** file upload
- **ColorPicker** color picker
- **Mentions** @ mentions
- **Form / FormItem / FormList** form container and items (`FormItem` supports
  `hideRequiredMark` to hide the red asterisk while keeping `required` for
  inputs / validation—see docs **Form → Form 容器**)
- **RichTextEditor** rich text editor

**Desktop only:** Select, MultiSelect, Cascader, TreeSelect, DatePicker,
DateTimePicker, TimePicker

### 💬 Messaging & notification

- **Toast** light hint (ToastContainer + toast)
- **Message** global message (message)
- **Notification** notification (NotificationContainer + notification.open /
  openNotification)

### 💡 Feedback & overlay

- **Alert** static alert bar
- **Drawer** side drawer
- **Progress** progress bar
- **Result** result page

**Desktop only:** Modal (`keepInView` default true), Dialog, Tooltip, Popover, Popconfirm

**Mobile only:** BottomSheet, ActionSheet, PullRefresh, SwipeCell

### 📐 Layout & container

- **Container** max-width container
- **Hero** hero / above-the-fold
- **Grid / GridItem** grid
- **Stack** vertical/horizontal stack
- **Divider** divider
- **Tabs** tabs
- **Accordion** accordion

### 🧭 Navigation

- **NavBar** top bar
- **Sidebar** collapsible sidebar menu
- **Pagination** pagination
- **Menu** menu list
- **Steps** steps
- **PageHeader** page header
- **Affix** affix
- **Anchor** anchor
- **BackTop** back to top

**Desktop only:** Dropdown, Breadcrumb

**Mobile only:** TabBar, NavBar

### 📊 Data display

- **Tag** tag
- **Empty** empty state
- **Statistic** statistic value
- **Segmented** segmented control
- **Descriptions** description list
- **Card** card
- **List** list
- **Image** image
- **ImageViewer** image viewer (multi-image, zoom, rotate, thumbnails, keyboard)
- **Timeline** timeline
- **Collapse** collapse panel
- **Carousel** carousel
- **Tree** tree
- **Transfer** transfer
- **Calendar** calendar
- **Comment** comment
- **CodeBlock** code block

**Desktop only:** Table

### 📈 Charts

Built on Chart.js: ChartLine, ChartBar, ChartPie, ChartDoughnut, ChartRadar,
ChartPolarArea, ChartBubble, ChartScatter.

Import from `@dreamer/ui-view/charts` or `@dreamer/ui-view/mobile/charts` only —
not from the root / `mobile` barrels (keeps Chart.js out of apps that do not use charts).

### ⚙️ Other

- **ConfigProvider** global config (theme, locale, etc.)

---

## Changelog

### 1.1.2 - 2026-08-27

#### Fixed

- **Table** built-in pagination bar: horizontal padding now matches cell padding
  by `size` (`xs`/`sm`/`md`/`lg`), plus bottom padding, so the range summary and
  pager no longer sit flush against the container edges.

Older release notes and migration notes live on the **documentation site**
(`docs/` package; see `docs/README.md`).

---

## Documentation

Version history, migration notes, and full component APIs are maintained on the
**documentation site**. This repository’s **`docs/`** package holds interactive
routes and tables — see **`docs/README.md`** to run it locally.

---

## 📄 License

Apache-2.0. See [LICENSE](./LICENSE).
