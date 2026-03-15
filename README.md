# @dreamer/ui

> Cross-framework UI library for the Dreamer ecosystem: View, React, and Preact.
> Desktop and mobile components with shared design tokens.

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)

---

## Structure

| Subpath                     | Description                                        |
| --------------------------- | -------------------------------------------------- |
| `@dreamer/ui`               | Main entry; re-exports shared types/tokens         |
| `@dreamer/ui/shared`        | Framework-agnostic types, design tokens, constants |
| `@dreamer/ui/view`          | View desktop components (default)                  |
| `@dreamer/ui/view/mobile`   | View mobile components                             |
| `@dreamer/ui/react`         | React desktop components (default)                 |
| `@dreamer/ui/react/mobile`  | React mobile components                            |
| `@dreamer/ui/preact`        | Preact desktop components (default)                |
| `@dreamer/ui/preact/mobile` | Preact mobile components                           |

**各框架内部结构**：`view`、`react`、`preact` 下均有
`common/`（桌面与移动共用组件）、`desktop/`（桌面专用）、`mobile/`（移动专用）。入口
`view`、`view/mobile` 等会统一 re-export 对应 `common` +
端专用组件，无需单独引用 `common` 子路径。

**Type check**：view / react / preact 使用不同 JSX 运行时，根目录 `deno check`
只适用于「仅 view 有 .tsx」时。**一旦 react 或 preact 下也有 .tsx，请务必用
`deno task check`**，不要单独跑 `deno check`。

- `deno task check` — **推荐**：按目录用对应配置依次检查
  view、react、preact、shared，保证各层 JSX 正确。
- `deno task check:view` — 仅 view（deno.view.json）
- `deno task check:react` — 仅 react（deno.react.json）
- `deno task check:preact` — 仅 preact（deno.preact.json）
- `deno task check:shared` — 仅 shared 与主入口

---

## Installation

```bash
# Deno
deno add jsr:@dreamer/ui

# Bun
bunx jsr add @dreamer/ui
```

---

## Usage

**Shared types (any framework):**

```ts
import type { ColorVariant, SizeVariant } from "jsr:@dreamer/ui/shared";
```

**View (desktop default):**

```ts
import {/* desktop components */} from "jsr:@dreamer/ui/view";
import {/* mobile components */} from "jsr:@dreamer/ui/view/mobile";
```

**React:**

```ts
import {/* desktop */} from "jsr:@dreamer/ui/react";
import {/* mobile */} from "jsr:@dreamer/ui/react/mobile";
```

**Preact:**

```ts
import {/* desktop */} from "jsr:@dreamer/ui/preact";
import {/* mobile */} from "jsr:@dreamer/ui/preact/mobile";
```

---

## License

Apache-2.0. See [LICENSE](./LICENSE).
