# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
