# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0-beta.4] - 2026-04-22

### Changed

- **plugin** `uiViewTailwindPlugin`: Tailwind `@source` CSS generation logs now
  use `@dreamer/logger` (`Logger.child` with `ui-view-tailwind` tag, or a
  standalone `createLogger` with `level: "debug"`) and emit at **debug** level
  instead of `info`. Added `jsr:@dreamer/logger` as a direct dependency in
  `deno.json`.
- **plugin** `onInit` failure reporting: prefer `Logger.error` on the injected
  `Logger` instance; legacy loggers with only `error` remain supported; no
  longer fall back to `info` for error text.

## [1.0.6] - 2026-04-19

### Changed

- **Dropdown** `placement` is limited to downward-only values (`bottom`,
  `bottomLeft`, `bottomRight`, `bottomAuto`); `top`, `topLeft`, and `topRight`
  are removed.
- **Dropdown** portal `fixed` positioning and arrow alignment for `bottomLeft` /
  `bottomRight` with `arrow` (including trigger `ref` on the button for accurate
  `getBoundingClientRect`).
- Docs: desktop dropdown route API table and `arrow` section updated
  accordingly.

## [1.0.2] - 2026-04-17

### Changed

- Replaced `export *` barrel re-exports with explicit named `export { … }` /
  `export type { … }` in aggregation `mod.ts` files (package root, `shared`,
  `desktop`, `mobile`, and `basic` entry modules) so bundlers can resolve
  imports statically.
- Listed all built-in `Icon*` symbols explicitly in `basic` barrels instead of
  `export * from "./icons/mod.ts"`.
- Desktop and mobile root barrels re-export desktop-only symbols from subpath
  modules without duplicating names already provided by `shared`.
