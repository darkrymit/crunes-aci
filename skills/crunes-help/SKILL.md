---
name: crunes-help
description: Use when orienting yourself in a crunes project — which skill to invoke for a task, how to inspect a rune's API before calling it, how to query utils.* function docs, how to verify the environment is working, or when you're stuck and need to know where to look.
---

# crunes Help

## Which skill to use

- **To see what runes exist or fetch/consume rune output**: Use the `crunes-use-rune` skill.
- **To create or edit a rune**: Use the `crunes-write-rune` skill.
- **To install a plugin or use runes from a plugin**: Use the `crunes-use-plugin` skill.
- **To build and publish a plugin**: Use the `crunes-write-plugin` skill.

## Inspect a rune's CLI arguments

```bash
crunes -p docs rune <key>                 # arg schema + examples (includes file path for local runes)
crunes -p docs rune <key> <key2>          # multiple runes
```

## Learn about developer exports (run & args)

```bash
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

- **`-p, --plain`**: Plain output: no ANSI colors, box-drawing characters, or fancy symbols (optimized for AI/pipe use).
- **`-y, --yes`**: Assume yes to all prompts and skip interactive mode (also auto-detected in non-TTY environments).
- **`--cwd <path>`**: Project root to use instead of the current working directory.
- **`--verbose`**: Print full error stack traces and other verbose output.

## Common troubleshooting

- **If you don't know what runes exist**: Run `crunes -p list`.
- **If rune output looks wrong**: Run `crunes -p run <key>` to see raw output, or run `crunes -p check <key>` to validate its shape.
- **If you get a "command not found" or unexpected error**: Run `crunes -p doctor`.
- **If you want to see a rune's arguments before calling it**: Run `crunes -p docs rune <key>`.
- **If you need plain output for piping or AI context**: Add the `-p` global flag (e.g. `crunes -p run <key>`).
- **If you don't know what `utils.ws` or `utils.fs` (etc.) functions look like**: Run `crunes -p docs utils <namespace>` (e.g. `crunes -p docs utils ws`).
