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
crunes [global-flags] run [--section s1,s2] <key> [rune-args...] [+ [--section s] <key> [rune-args...]]...
```

Examples:

```bash
crunes -p run docs                              # all sections, plain output
crunes -p run api v2                            # positional arg "v2"
crunes -p run -s endpoints api v2               # section filter
crunes -p run -b docs + api v2                  # batch: two runes in one call (requires -b)
crunes -p run my-plugin:rune-key                # plugin rune
crunes -p run my-plugin:rune-key arg1           # plugin rune with arg
```

## ⚠️ The Strict 3-Tier Boundary
`crunes` enforces a strict parsing boundary:
1. **Global Flags** (e.g. `--cwd`, `-p`) MUST precede `run`.
2. **Command Flags** (e.g. `-b`) MUST immediately follow `run`.
3. **Rune Args** MUST follow the `<key>`.

Example: `crunes --cwd ./project -p run -b docs`
*If you place a global flag after `run` (e.g. `crunes run --cwd`), the CLI will instantly throw an error and exit.*

`local:<key>` forces resolution from project config only. `plugin:<key>` forces a specific plugin. Bare `<key>` auto-resolves: project config first, then enabled plugins.

## Hook token syntax

Tokens in the user's prompt are resolved automatically by the `UserPromptSubmit` hook — no manual `crunes run` needed.

```
$$key                           all sections
$$key(arg1,arg2)                positional args (comma-separated)
$$key::section1,section2        section filter
$$key(arg1,arg2)::section       args + section filter
$$my-plugin:rune-key             plugin rune
$$my-plugin:rune-key(arg1)       plugin rune with arg
$$my-plugin:rune-key(arg)::sec   plugin rune, args + section filter
```

Args inside `()` are comma-separated. Values containing spaces work naturally: `$$search(hello world,src)` passes `hello world` as the first arg and `src` as the second.

## When to use CLI vs hook

- **If the token is already in the user's prompt**: The hook resolves automatically — you do nothing.
- **If you need live context mid-conversation before planning or coding**: Run `crunes -p run <key>`.
- **If you want to inspect a structured event stream**: Run `crunes -p run --format jsonl <key>`.
- **If you are unsure what arguments a rune accepts**: Run `crunes -p docs rune <key>`.
