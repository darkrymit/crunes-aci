---
name: crunes-use-rune
description: Use when fetching or consuming rune output — listing what runes exist, running them via CLI, or understanding $token syntax for prompts. Do NOT invoke manually if the user's prompt already contains $key or $key(args) tokens — those are resolved automatically by the UserPromptSubmit hook before the message arrives.
---

# Consuming Runes

## Setup (first time in a project)

```bash
crunes init    # creates .crunes/config.json if it doesn't exist
```

## Discover available runes

```bash
crunes list                       # table: key, name, description, path
crunes -p list                    # plain tab-separated (AI-friendly)
crunes -p list --format json      # JSON array
```

## Inspect a rune's args before calling

```bash
crunes docs rune <key>
```

## Run a rune — CLI syntax

```
crunes [global-flags] use [--section s1,s2] <key> [rune-args...] [+ [--section s] <key> [rune-args...]]...
```

Examples:

```bash
crunes use docs                              # all sections, markdown output
crunes -p use docs                           # no ANSI (plain)
crunes use api v2                            # positional arg "v2"
crunes use -s endpoints api v2               # section filter
crunes use -b docs + api v2                  # batch: two runes in one call (requires -b)
crunes use --format json docs                # JSON Section[] array
crunes use my-plugin:rune-key                # plugin rune
crunes use my-plugin:rune-key arg1           # plugin rune with arg
```

## ⚠️ The Strict 3-Tier Boundary
`crunes` enforces a strict parsing boundary:
1. **Global Flags** (e.g. `--cwd`, `-p`) MUST precede `use`.
2. **Command Flags** (e.g. `-b`, `--format`) MUST immediately follow `use`.
3. **Rune Args** MUST follow the `<key>`.

Example: `crunes --cwd ./project -p use -b --format json docs`
*If you place a global flag after `use` (e.g. `crunes use --cwd`), the CLI will instantly throw an error and exit.*

`local:<key>` forces resolution from project config only. `plugin:<key>` forces a specific plugin. Bare `<key>` auto-resolves: project config first, then enabled plugins.

## Hook token syntax

Tokens in the user's prompt are resolved automatically by the `UserPromptSubmit` hook — no manual `crunes use` needed.

```
$key                           all sections
$key(arg1,arg2)                positional args (comma-separated)
$key::section1,section2        section filter
$key(arg1,arg2)::section       args + section filter
my-plugin:rune-key             plugin rune
my-plugin:rune-key(arg1)       plugin rune with arg
my-plugin:rune-key(arg)::sec   plugin rune, args + section filter
```

Args inside `()` are comma-separated. Values containing spaces work naturally: `$search(hello world,src)` passes `hello world` as the first arg and `src` as the second.

## When to use CLI vs hook

| Situation | Approach |
|---|---|
| Token already in the user's prompt | Hook resolves automatically — do nothing |
| Need live context mid-conversation before planning or coding | `crunes -p use <key>` |
| Want to inspect raw JSON structure | `crunes use --format json <key>` |
| Unsure what args a rune accepts | `crunes docs rune <key>` |
