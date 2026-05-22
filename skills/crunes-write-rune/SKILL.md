---
name: crunes-write-rune
description: Use when creating a new rune or editing an existing one — scaffolding with crunes create or crunes template use, implementing the rune function, using @utils helpers, or validating output with crunes check.
---

# Writing Runes

## Scaffold a new rune

```bash
# Interactive (prompts for name, description)
crunes create <key>

# Non-interactive
crunes -y create <key> --format markdown
crunes -y create <key> --format tree
crunes -y create <key> --format markdown --name "API Overview" --description "Public API endpoints"
```

Creates `.crunes/runes/<key>.js` and registers it in `.crunes/config.json`.

## Scaffold from a template (faster)

```bash
crunes template list                              # see available templates
crunes template use <template>                    # copy + register
crunes template use <template> --as <new-key>     # register under different key
crunes template use plugin-name:template-name     # from a specific plugin
```

## Rune file structure

Rune files are ESM modules. All I/O goes through `@utils` — no Node.js builtins.

```js
import { fs, md, tree, section, env, rune, fetch, cache, shell, json, archive } from '@utils'

// Optional: declare the args schema
export async function args(b) {
  return b
    .positional('<query>', 'Required positional arg')
    .positional('[scope]', 'Optional positional arg (default: "all")')
    .option('-c, --count <n>', 'Max results', 10)
    .option('--strict', 'Exact match only', false)
    .example('crunes use myrune hello', 'Basic usage')
    .example('crunes use myrune hello src -c 5', 'With scope and limit')
    .build()
}

// Required: produce context output
export async function use(args) {
  // args._          — positional args array (args._[0], args._[1], ...)
  // args.count      — named option value
  // args.strict     — boolean flag
  // args.$raw       — raw unparsed string[] (before builder parsing)
  return section.create('name', { type: 'markdown', content: '...' })
}
```

If `args()` is omitted, `args._` contains the raw positional strings passed to the rune.

## `@utils` reference

| Import | Key methods |
|---|---|
| `fs` | `fs.read(path, { throw: false })` · `fs.exists(path)` · `fs.glob(pattern, { onlyDirectories })` · `fs.readDir(path)` |
| `md` | `md.h1/h2/h3(text)` · `md.bold(text)` · `md.code(text)` · `md.ul(items)` · `md.ol(items)` · `md.p(text)` · `md.table(headers, rows)` · `md.fence(code, lang)` |
| `tree` | `tree.node(name, description, children[])` |
| `section` | `section.create(name, data, { title, attrs })` |
| `env` | `env.get(key)` — returns `null` if not set |
| `rune` | `rune.use(key, args[])` — call another rune from within this rune |
| `fetch` | `fetch.get(url)` · `fetch.post(url, body)` |
| `cache` | `cache.get(key)` · `cache.set(key, value, ttlMs)` — per-project cache |
| `shell` | `shell.exec(cmd, args[])` — run shell commands |
| `json` | `json.read(path)` · `json.write(path, data)` |
| `archive` | `archive.read(zipPath, entryPath)` |

All `fs` paths are relative to the project root (the directory containing `.crunes/`).

## Return formats

```js
// Single markdown section
return section.create('overview', {
  type: 'markdown',
  content: md.ul(['item one', 'item two']),
})

// Single tree section
return section.create('layout', {
  type: 'tree',
  root: tree.node('root', 'root description', [
    tree.node('child', 'child description'),
    tree.node('other', 'other description', [
      tree.node('nested', 'nested description'),
    ]),
  ]),
})

// Multiple sections (return array)
return [
  section.create('summary', { type: 'markdown', content: md.p('Summary here') }),
  section.create('details', { type: 'markdown', content: md.ul(['a', 'b']) }, {
    title: 'Details',
    attrs: { id: 'details-section' },
  }),
]

// Return null or undefined to emit nothing
return null
```

## Config entry (`.crunes/config.json`)

```json
{
  "runes": {
    "docs": ".crunes/runes/docs.js",
    "api": {
      "path": ".crunes/runes/api.js",
      "name": "API Overview",
      "description": "Public API endpoints and their signatures"
    }
  }
}
```

`name` and `description` are shown in `crunes list` and `crunes help rune`. Edit them directly in config — no re-scaffolding needed.

## Test the rune

```bash
crunes -p use <key>                    # render output (plain)
crunes -p use <key> arg1 arg2          # test with args
crunes check <key>                     # validate output shape
crunes bench <key>                     # check execution time
```
