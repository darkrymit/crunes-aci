# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.1] - 2026-08-11

### Changed
- Deprecated. Skills have moved to [crunes-skills](https://github.com/darkrymit/crunes-skills), which installs into Claude Code, Codex, and other agents. The `UserPromptSubmit` hook and `$$key(args)` token injection are discontinued with no replacement.

## [0.8.0] - 2026-06-16

### Added
- **Batch permission pre-flight**: ACI hook-wrapper now issues a single batch permission check for all plugin rune tokens in a prompt before execution
- **Auto-test on release**: Test suite runs automatically during `release bump`

### Changed
- **`run-repl` → `repl`**: Skill docs, hook references, and test fixtures updated for the renamed CLI subcommand and `repl` lifecycle export
- **Bracket token syntax**: Hook-wrapper updated to `$$key[-s section](args)` syntax; `::section` suffix removed
- **Skill docs for bracket syntax and new token format**: `crunes-use-rune`, `crunes-write-rune`, `crunes-write-plugin` updated for `v0.7.2+` API (`help` global, `logger`, bracket syntax, new token format)
- **`check` removed from skill docs**: `crunes-help` troubleshooting and `crunes-write-rune` updated to remove stale `check` command references
- **README and AGENTS stale syntax fixed**: `::section` token syntax corrected to current format

### Fixed
- **Hook-wrapper `--` insertion**: Always inserts `--` after the rune key in `buildCliArgs` to protect rune args from being parsed as CLI flags
- **TextDecoder reference in shell.spawn example**: Removed — `chunk` is already a string in text mode
- **Hook-wrapper bracket syntax tests**: Updated for the new bracket token format

---

## [0.7.1] - 2026-06-08

### Added
- Dedicated `release` rune for `crunes-aci` version bump and tag automation.

### Changed
- Updated `crunes-write-rune` skill documentation to include `args.$rest`.
- Updated `crunes-use-rune` skill documentation for cache and sqlite handle APIs.

## [0.7.0] - 2026-06-05

### Changed
- Renamed skill hooks and references from `use` to `run` and `template use` to `template apply`.
- Updated hook-wrapper to execute the `run` subcommand.
- Converted markdown tables to lists in all skills to prevent agent context drops.
- Updated skill documents to cover `shell.spawn`, `shell.run`, `rune.exec`, and `rune.job.*` APIs.

### Fixed
- Fixed token matching pattern in prompt-submit hook to require `$$` prefix.

## [0.6.0] - 2026-06-02

### Added
- Documented `args.$command`, `args.$commands`, and `args._` slicing in `crunes-write-rune` skill.

### Changed
- Enforced `-p` on all commands, fixed `$$` token usage, and added `docs run/args` support.

## [0.5.5] - 2026-05-26

### Changed
- Synchronized with crunes-cli v0.5.5 features and permissions.

## [0.5.2] - 2026-05-25

### Changed
- Updated skill documents and guidelines to extend the "Think Before Coding" principle.

## [0.5.1] - 2026-05-25

### Changed
- Updated skills to document recursive commands, parameter mapping, and routing.
- Aligned `crunes-use-rune` filter syntax with the core CLI parser.

## [0.5.0] - 2026-05-25

### Added
- Introduced specialized skills: `crunes-use-rune`, `crunes-write-rune`, `crunes-use-plugin`, `crunes-write-plugin`.
- Added support for programmatic batch flag (`-b`) and lowercase-restricted token regex.
- Updated WebSocket helper documentation to specify `sendText` and `sendBinary`.

### Changed
- Completed `utils` namespace refactor (http, env, ws, vars).
- Renamed `help` command references to `docs`.

## [0.4.6] - 2026-05-02

### Changed
- Renamed plugin package from `crunes` / `context-runes` to `crunes-aci`.
- Config folder renamed from `.context-runes/` to `.crunes/`.
