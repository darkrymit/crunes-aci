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
crunes -p docs rune <key>                 # arg schema + examples (includes file path for local runes)
crunes -p docs rune <key> <key2>          # multiple runes
crunes -p docs run                        # how the run(args) export works and what args contains
crunes -p docs args                       # how to declare the args(builder) export
```

## Query utils.* API docs

```bash
crunes -p docs utils                      # list all 19 namespaces with one-line descriptions
crunes -p docs utils <ns>                 # full function signatures for one namespace
crunes -p docs utils <ns1> <ns2>          # multiple namespaces
```

Available namespaces: `archive` `cache` `codec` `crypto` `env` `fs` `http` `json` `md` `rune` `section` `shell` `sqlite` `time` `tree` `vars` `ws` `xml` `yaml`

## Verify the environment

```bash
crunes -p doctor    # checks Node version, config presence, plugin registry integrity
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
| Don't know what runes exist | `crunes -p list` |
| Rune output looks wrong | `crunes -p run <key>` to see raw output; `crunes -p check <key>` to validate shape |
| Command not found / unexpected error | `crunes -p doctor` |
| Want to see a rune's args before calling | `crunes -p docs rune <key>` |
| Need plain output for piping or AI context | Add `-p` global flag: `crunes -p run <key>` |
| Don't know what `utils.ws` / `utils.fs` functions look like | `crunes -p docs utils ws` |
