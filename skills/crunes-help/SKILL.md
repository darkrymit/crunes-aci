---
name: crunes-help
description: Use when orienting yourself in a crunes project — which skill to invoke for a task, how to inspect a rune's API before calling it, how to query utils.* function docs, how to verify the environment is working, or when you're stuck and need to know where to look.
---

# crunes Help

## Which skill to use

| I want to… | Skill |
|---|---|
| See what runes exist / fetch rune output | `crunes-use-rune` |
| Create or edit a rune | `crunes-write-rune` |
| Install a plugin or use runes from a plugin | `crunes-use-plugin` |
| Build and publish a plugin | `crunes-write-plugin` |

## Inspect a rune's API before calling it

```bash
crunes docs rune <key>                 # arg schema + examples
crunes docs rune <key> <key2>          # multiple runes
crunes docs rune <key> --format json   # JSON output
```

## Query utils.* API docs

```bash
crunes docs utils                      # list all 17 namespaces with one-line descriptions
crunes docs utils <ns>                 # full function signatures for one namespace
crunes docs utils <ns1> <ns2>          # multiple namespaces
crunes docs utils --format json        # machine-readable, all namespaces
crunes docs utils <ns> --format json   # machine-readable, one namespace
```

Available namespaces: `archive` `cache` `crypto` `env` `fs` `http` `json` `md` `rune` `shell` `sqlite` `time` `tree` `vars` `ws` `xml` `yaml`

Use `--format json` when you need parameter types and return object method lists for code generation.

## Verify the environment

```bash
crunes doctor    # checks Node version, config presence, plugin registry integrity
```

## Global flags

Available on every `crunes` command:

| Flag | Meaning |
|---|---|
| `-p, --plain` | No ANSI — plain text, optimised for AI/pipe use |
| `-y, --yes` | Skip all interactive prompts (auto-detected in non-TTY environments too) |
| `--cwd <path>` | Override the project root |
| `--verbose` | Full stack traces and debug output |

## Common troubleshooting

| Symptom | Fix |
|---|---|
| Don't know what runes exist | `crunes list` |
| Rune output looks wrong | `crunes -p use <key>` to see raw output; `crunes check <key>` to validate shape |
| Command not found / unexpected error | `crunes doctor` |
| Want to see a rune's args before calling | `crunes docs rune <key>` |
| Need plain output for piping or AI context | Add `-p` global flag: `crunes -p use <key>` |
| Don't know what `utils.ws` / `utils.fs` functions look like | `crunes docs utils ws` or `crunes docs utils ws --format json` |
