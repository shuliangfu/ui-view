# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
