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
import { fs, md, tree, section, env, vars, rune, http, ws, json, yaml, xml, shell, cache, sqlite, archive, crypto } from '@utils'

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

For full function signatures, parameter types, and return-object method lists, run:

```bash
crunes docs utils                      # all namespaces
crunes docs utils <ns>                 # one namespace (e.g. ws, fs, cache)
crunes docs utils <ns> --format json   # machine-readable
```

Quick reference:

| Import | Key methods |
|---|---|
| `fs` | `fs.read(path, opts?)` · `fs.write(path, content)` · `fs.readAsBytes(path, opts?)` · `fs.writeAsBytes(path, bytes)` · `fs.exists(path)` · `fs.glob(pattern, opts?)` · `fs.copy(src, dest)` · `fs.move(src, dest)` · `fs.remove(path, opts?)` · `fs.mkdir(path)` · `fs.stat(path)` · `fs.replace(path, regex, replacement)` · `fs.cwd()` |
| `md` | `md.h1/h2/h3(text)` · `md.bold(text)` · `md.italic(text)` · `md.code(text)` · `md.codeBlock(text, lang?)` · `md.ul(items)` · `md.ol(items)` · `md.p(text)` · `md.table(headers, rows)` · `md.link(text, url)` · `md.blockquote(text)` |
| `tree` | `tree.node(name, description, children?)` · `tree.format(root, { style? })` |
| `section` | `section.create(name, data, { title, attrs })` |
| `env` | `env.read(key, fallback?)` · `env.has(key)` |
| `vars` | `vars.read(key, fallback?)` · `vars.has(key)` — reads rune config vars |
| `rune` | `rune.use(key, args[])` — call another rune · `rune.spawn(key, args[])` → `{ id }` — background · `rune.kill(id)` · `rune.exists(id)` → `boolean`  |
| `http` | `http.fetch(url, { method?, headers?, body?, timeout? })` — `body` can be `string | MultipartEntry[]` for ordered upload; returns `FetchResponse` with `.ok`, `.status`, `.text()`, `.json()` |
| `ws` | `ws.client(url, opts?)` — returns `WsHandle` with `open()`, `sendText(msg)`, `sendBinary(data)`, `close()`, `on(event, fn)` |
| `time` | `time.after(ms)` — resolve after ms milliseconds; always `await` (no global setTimeout in isolate) |
| `json` | `json.read(path)` · `json.write(path, data)` · `json.readPath(path, jsonPath)` · `json.readPathAll(path, jsonPath)` · `json.modify(path, fn)` |
| `yaml` | `yaml.read(path)` · `yaml.write(path, data)` · `yaml.modify(path, fn)` |
| `xml` | `xml.read(path)` · `xml.write(path, data)` · `xml.modify(path, fn)` |
| `shell` | `shell.exec(cmd, { throw?, trim?, timeout?, env? })` / `shell.execInSession(cmd, { env? })` |
| `cache` | `cache.open(location, name?)` — returns `CacheHandle` with `set(key, value, ttl?)`, `get(key)`, `delete(key)`, `clear()` |
| `sqlite` | `sqlite.open(location, name?)` — returns `SqliteHandle` with `query/get/exec/transaction/close` |
| `archive` | `archive.unzip(src, dest)` · `archive.zip(src, dest)` · `archive.untar(src, dest, {gzip?})` · `archive.tar(src, dest, {gzip?})` — `tar` defaults to `gzip:true`; `untar` auto-detects compression |
| `crypto` | `crypto.uuid()` · `crypto.randomHex(size)` · `crypto.randomBase64(size)` · `crypto.hash(algo, data)` · `crypto.hashAsHex(algo, data)` · `crypto.hashAsBase64(algo, data)` · `crypto.hmac(algo, key, data)` · `crypto.hmacAsHex(algo, key, data)` · `crypto.hmacAsBase64(algo, key, data)` · `crypto.encrypt(algo, key, iv, data)` · `crypto.decrypt(algo, key, iv, cipher)` · `crypto.toHex(data)` · `crypto.fromHex(hex)` · `crypto.toBase64(data)` · `crypto.fromBase64(b64)` |

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

`name` and `description` are shown in `crunes list` and `crunes docs rune`. Edit them directly in config — no re-scaffolding needed.

## Test the rune

```bash
crunes -p use <key>                    # render output (plain)
crunes -p use <key> arg1 arg2          # test with args
crunes check <key>                     # validate output shape
crunes bench <key>                     # check execution time
```
