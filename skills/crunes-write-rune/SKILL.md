---
name: crunes-write-rune
description: Use when creating a new rune or editing an existing one — scaffolding with crunes create or crunes template apply, implementing the rune function, using @utils helpers, or validating output with crunes check.
---

# Writing Runes

## Scaffold a new rune

```bash
# Interactive (prompts for name, description)
crunes -p create <key>

# Non-interactive
crunes -p -y create <key> --format markdown
crunes -p -y create <key> --format tree
crunes -p -y create <key> --format markdown --name "API Overview" --description "Public API endpoints"
```

Creates `.crunes/runes/<key>.js` and registers it in `.crunes/config.json`.

## Scaffold from a template (faster)

```bash
crunes -p template list                              # see available templates
crunes -p template apply <template>                    # copy + register
crunes -p template apply <template> --as <new-key>     # register under different key
crunes -p template apply plugin-name:template-name     # from a specific plugin
```

## Rune file structure

Rune files are ESM modules. All I/O goes through `@utils` — no Node.js builtins.

```js
import { fs, md, tree, section, env, vars, rune, http, ws, json, yaml, xml, shell, cache, sqlite, archive, crypto } from '@utils'

// Optional: declare the args schema
export async function args(b) {
  return b
    // Root options/positionals
    .option('--verbose', 'Verbose logging', false)
    // Commands are registered recursively
    .command('remote', 'Git remote commands', remote => {
      remote
        .command('add', 'Add a remote Repository', add => {
          add
            .positional('<name>', 'Remote name')
            .positional('<url>', 'Remote URL')
            .option('--fetch', 'Fetch immediately', true)
        })
        .command('remove', 'Remove remote repository', remove => {
          remove.positional('<name>', 'Remote name')
        })
    })
}

// Required: produce context output
export async function run(args) {
  // Parsing is extremely developer friendly:
  // - args.$command     — space-separated matched command path string (e.g. 'remote add')
  // - args.$commands    — array of matched command levels (e.g. ['remote', 'add'])
  // - args._            — all data positionals (command tokens stripped)
  // - args.$rest        — data positionals not mapped to named parameters
  // - args.name         — automatically mapped positional parameter '<name>'
  // - args.url          — automatically mapped positional parameter '<url>'
  // - args.verbose      — boolean option parsed from the root command
  // - args.$raw         — raw unparsed string[]

  if (args.$command === 'remote add') {
    return section.create('git-add', { 
      type: 'markdown', 
      content: `Adding remote ${args.name} at ${args.url} (Fetch: ${args.fetch})` 
    })
  }
}
```

If `args()` is omitted, `args._` contains the positional strings passed to the rune (command tokens are always stripped).

## `@utils` reference

For full function signatures, parameter types, and return-object method lists, run:

```bash
crunes -p docs utils                      # all namespaces
crunes -p docs utils <ns>                 # one namespace (e.g. ws, fs, cache)
```

For the `run(args)` lifecycle contract and what `args` contains:

```bash
crunes -p docs run    # run(args) export: args structure, $command, $commands, args._, named params
crunes -p docs args   # args(builder) export: option/positional/command declarations
```

- **`fs`**: `fs.read(path, opts?)` · `fs.write(path, content)` · `fs.readAsBytes(path, opts?)` · `fs.writeAsBytes(path, bytes)` · `fs.exists(path)` · `fs.glob(pattern, opts?)` · `fs.copy(src, dest)` · `fs.move(src, dest)` · `fs.remove(path, opts?)` · `fs.mkdir(path)` · `fs.stat(path)` · `fs.replace(path, regex, replacement)` · `fs.cwd()`
- **`md`**: `md.h1/h2/h3(text)` · `md.bold(text)` · `md.italic(text)` · `md.code(text)` · `md.codeBlock(text, lang?)` · `md.ul(items)` · `md.ol(items)` · `md.p(text)` · `md.table(headers, rows)` · `md.link(text, url)` · `md.blockquote(text)`
- **`tree`**: `tree.node(name, description, children?)` · `tree.format(root, { style? })`
- **`section`**: `section.create(name, data, opts?)` · `section.emit(section)` — stream section before return · `section.match(name, patterns[])` · `section.selected()`
- **`env`**: `env.read(key, fallback?)` · `env.has(key)`
- **`vars`**: `vars.read(key, fallback?)` · `vars.has(key)` — reads rune config vars
- **`rune`**: `rune.exec(key, args[])` → `RuneResult` — call another rune and get its output · `rune.job.start(key, args[])` → `{ id }` — launch as background job · `rune.job.kill(id)` · `rune.job.exists(id)` → `boolean` · `rune.job.stdout(id)` / `rune.job.stderr(id)` — read log output · `rune.job.sections(id)` → `Section[]`
- **`http`**: `http.fetch(input, { method?, headers?, body?, timeout? })` — `input` is a URL string or `Request`; `body` can be `string \| Uint8Array \| ReadableStream \| Blob \| FormData \| URLSearchParams`; returns `Response` with `.ok`, `.status`, `.headers`, `.text()`, `.json()`, `.blob()`, `.body()` (stream). Also available as the global `fetch()`.
- **`ws`**: `ws.client(url, opts?)` — returns `WsHandle` with `open()`, `sendText(msg)`, `sendBinary(data)`, `close()`, `on(event, fn)`
- **`time`**: `time.after(ms)` — resolves after ms milliseconds · global `setTimeout`/`clearTimeout`/`setInterval`/`clearInterval` are also available directly
- **`json`**: `json.read(path)` · `json.write(path, data)` · `json.readPath(path, jsonPath)` · `json.readPathAll(path, jsonPath)` · `json.modify(path, fn)`
- **`yaml`**: `yaml.read(path)` · `yaml.write(path, data)` · `yaml.modify(path, fn)`
- **`xml`**: `xml.read(path)` · `xml.write(path, data)` · `xml.modify(path, fn)`
- **`shell`**: `shell.exec(cmd, { throw?, trim?, timeout?, env?, binary?, stdin? })` → `ShellResult` (destructure `{ stdout }` to capture the output string) · `shell.spawn(cmd, { env?, signal? })` → `ShellSession` · `shell.job.start(cmd, opts?)` → `{ id }` — detached background shell with log-backed I/O
- **`cache`**: `cache.open(location, name?)` — returns `CacheHandle` with `set(key, value, ttl?)`, `get(key)`, `has(key)`, `delete(key)`, `clear()`
- **`sqlite`**: `sqlite.open(location, name?)` — returns `SqliteHandle` with `query(sql, params?)`, `get(sql, params?)`, `exec(sql, params?)`, `run(sql)`, `close()`
- **`archive`**: `archive.unzip(src, dest)` · `archive.zip(src, dest)` · `archive.untar(src, dest, {gzip?})` · `archive.tar(src, dest, {gzip?})` — `tar` defaults to `gzip:true`; `untar` auto-detects compression
- **`crypto`**: `crypto.uuid()` · `crypto.randomHex(size)` · `crypto.randomBase64(size)` · `crypto.hash(algo, data)` · `crypto.hashAsHex(algo, data)` · `crypto.hashAsBase64(algo, data)` · `crypto.hmac(algo, key, data)` · `crypto.hmacAsHex(algo, key, data)` · `crypto.hmacAsBase64(algo, key, data)` · `crypto.encrypt(algo, key, iv, data)` · `crypto.decrypt(algo, key, iv, cipher)` · `crypto.toHex(data)` · `crypto.fromHex(hex)` · `crypto.toBase64(data)` · `crypto.fromBase64(b64)`

All `fs` paths are relative to the project root (the directory containing `.crunes/`).

## Streaming / interactive shell

Use `shell.spawn` for interactive processes or real-time output streaming. Combine with
`AbortController` to impose a limit or timeout, and `section.emit` to stream partial results.

```js
import { shell, section } from '@utils'

export async function run(args) {
  const limit = args._[0] ? parseInt(args._[0]) : 5
  const controller = new AbortController()
  const decoder = new TextDecoder()

  return new Promise((resolve, reject) => {
    const session = shell.spawn('node counter.js', { signal: controller.signal })
    const lines = []

    session.stdout.on('data', (chunk) => {
      const text = decoder.decode(chunk)
      for (const line of text.split('\n').filter(Boolean)) {
        lines.push(line)
        section.emit(
          section.create('progress', { type: 'markdown', content: lines.map(l => `- ${l}`).join('\n') })
        )
        if (lines.length >= limit) controller.abort()
      }
    })

    session.on('exit', (code) => {
      resolve(section.create('result', { type: 'markdown', content: `Finished. Exit: ${code}` }))
    })

    session.on('error', reject)
  })
}
```

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
crunes -p run <key>                    # render output (plain)
crunes -p run <key> arg1 arg2          # test with args
crunes -p check <key>                  # validate output shape
crunes -p bench <key>                  # check execution time
```
