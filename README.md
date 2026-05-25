# crunes-aci

ACI (Agentic Coder Interface) integrations for [crunes](https://github.com/darkrymit/context-runes). Connects the [crunes-cli](https://github.com/darkrymit/context-runes-cli) to AI coding tools, providing skills for manual rune access and — where native hook systems are available — automatic context injection.

Currently supported: **Claude Code** (full native integration via `UserPromptSubmit` hook + skills). Other AI tools with skill or prompt-injection support may use the included skills directly against the CLI.

## Prerequisites

All rune logic is delegated to the CLI. Install it first:

```bash
npm install -g @darkrymit/crunes-cli
crunes --version
```

## Installation

### Claude Code

```bash
/plugin marketplace add https://github.com/darkrymit/crunes-aci
/plugin install crunes-aci
```

Run `/reload-plugins` to activate in the current session.

### Other AI tools

Copy or reference the skills from the `skills/` directory. As long as your tool supports invoking CLI commands, the skills work against `crunes` directly.

## Skills

| Skill | Use when |
|---|---|
| `crunes-help` | Orienting in a project, querying rune or utils API docs, troubleshooting |
| `crunes-use-rune` | Discovering and fetching rune output, understanding `$token` syntax |
| `crunes-write-rune` | Creating or editing a rune, using `@utils` helpers |
| `crunes-use-plugin` | Installing plugins, enabling/disabling per-project |
| `crunes-write-plugin` | Scaffolding and publishing a plugin |

### Key commands

```bash
crunes list                            # what runes exist in this project
crunes docs rune <key>                 # args schema + examples for a rune
crunes docs utils                      # list all @utils namespaces
crunes docs utils <ns>                 # function signatures for one namespace (e.g. ws, fs, cache)
crunes docs utils <ns> --format json   # machine-readable, for code generation
crunes doctor                          # verify environment health
```

## Automatic context injection (Claude Code)

The `UserPromptSubmit` hook automatically resolves `$key(args)` tokens and injects rune output as XML context before Claude sees your prompt:

```xml
<context title="Setup Guide" id="setup">
### Install
1. Clone the repo
2. npm install
</context>
```

Token syntax:

| Token | Meaning |
|---|---|
| `$key` | All sections |
| `$key(arg1,arg2)` | With positional args |
| `$key::section1,section2` | Section filter |
| `$key(arg1)::section` | Args + section filter |
| `$my-plugin:rune-key` | Plugin rune |
| `$my-plugin:rune-key(arg)::sec` | Plugin rune, args + section |

## Project Setup

Runes live in your project, not in this repo. In each project you want to use crunes:

```bash
crunes init
crunes create docs --format markdown
```

See [crunes-cli](https://github.com/darkrymit/context-runes-cli) for the full rune authoring guide.

## How It Works (Claude Code)

```
UserPromptSubmit
  → hook-wrapper.js reads stdin JSON { prompt: "..." }
  → parses `$key(args)[::sections]` tokens
  → runs `crunes use <keys...> --format json`
  → iterates Section[] JSON output
  → builds <name title="..." ...>content</name> XML per section
  → emits { hookSpecificOutput: { additionalContext: "..." } }
```

## License

MIT — [Tamerlan Hurbanov (DarkRymit)](https://github.com/darkrymit)
