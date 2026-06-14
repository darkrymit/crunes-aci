---
name: crunes-use-rune
description: Use when fetching or consuming rune output — listing what runes exist, running them via CLI, or understanding $$token syntax for prompts. Do NOT invoke manually if the user's prompt already contains $$key or $$key(args) tokens — those are resolved automatically by the UserPromptSubmit hook before the message arrives.
---

# Consuming Runes

## Setup (first time in a project)

```bash
crunes -p init    # creates .crunes/config.json if it doesn't exist
```

## Discover available runes

```bash
crunes -p list                    # table: key, name, description, path
```

## Inspect a rune's CLI arguments

```bash
crunes -p docs rune <key>
```

## Learn about developer exports (run & args)

```bash
crunes -p docs run                        # how the run(args) export works and what args contains
crunes -p docs args                       # how to declare the args(builder) export
```

## Run a rune — CLI syntax

```
crunes [global-flags] run <key>[-s s1,s2] [rune-args...]
```

Section filter and other per-rune flags go inside `[...]` attached to the key. Global run flags (`--format`, `-b`, `--fail-fast`) go before the key.

Examples:

```bash
crunes -p run docs                              # all sections, plain output
crunes -p run api v2                            # positional arg "v2"
crunes -p run api[-s endpoints] v2              # section filter + arg
crunes -p run api[--section endpoints]          # section filter, long form
crunes -p run --format jsonl api[-s endpoints]  # jsonl output
crunes -p run -b docs + api[-s endpoints] v2    # batch: two runes in one call (requires -b)
crunes -p run my-plugin:rune-key                # plugin rune
crunes -p run my-plugin:rune-key[-s foo] arg1   # plugin rune with section + arg
```

## ⚠️ The Strict 3-Tier Boundary
`crunes` enforces a strict parsing boundary:
1. **Global Flags** (e.g. `--cwd`, `-p`) MUST precede `run`.
2. **Command Flags** (e.g. `-b`, `--format`, `--fail-fast`) MUST immediately follow `run`.
3. **Per-Rune Bracket Flags** (e.g. `-s section`) go inside `key[...]`.
4. **Rune Args** follow the key token.

Example: `crunes --cwd ./project -p run --format jsonl api[-s endpoints] v2`

`local:<key>` forces resolution from project config only. `plugin:<key>` forces a specific plugin. Bare `<key>` auto-resolves: project config first, then enabled plugins.

## Hook token syntax

Tokens in the user's prompt are resolved automatically by the `UserPromptSubmit` hook — no manual `crunes run` needed.

```
$$key                              all sections, no args
$$key[-s s1,s2]                    section filter
$$key(arg1,arg2)                   positional args (comma-separated)
$$key[-s s1,s2](arg1,arg2)         section filter + args
$$my-plugin:rune-key               plugin rune
$$my-plugin:rune-key[-s foo](arg1) plugin rune with section filter + arg
```

Section filter uses `-s` (short) or `--section` (long) inside `[...]`. The `::section` syntax is no longer supported.

Args inside `()` are comma-separated. Values containing spaces work naturally: `$$search(hello world,src)` passes `hello world` as the first arg and `src` as the second.

## When to use CLI vs hook

- **If the token is already in the user's prompt**: The hook resolves automatically — you do nothing.
- **If you need live context mid-conversation before planning or coding**: Run `crunes -p run <key>`.
- **If you want to inspect a structured event stream**: Run `crunes -p run --format jsonl <key>[-s section]`.
- **If you are unsure what arguments a rune accepts**: Run `crunes -p docs rune <key>`.
