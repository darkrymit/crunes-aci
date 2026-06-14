---
name: crunes-write-rune
description: Use when creating a new rune or editing an existing one — scaffolding with crunes create or crunes template apply, implementing the rune function, using @utils helpers, or inspecting the output with crunes docs rune.
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

## Rune file structure — `run` mode

Rune files are ESM modules. All I/O goes through `@utils` — no Node.js builtins.

```js
import { fs, md, tree, section, help, env, vars, rune, http, ws, json, yaml, xml, shell, cache, sqlite, archive, crypto } from '@utils'

// Optional: cleanup after run() resolves or throws (close connections, release handles)
// Errors thrown here are swallowed.
export async function dispose() {}

// Optional: declare the args schema
export async function args(b) {
  return b
    // Root options/positionals
    .option('--verbose', 'Verbose logging', false)
    .option('--help', 'Show help')
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
    .build()
}

// Required: produce context output
export async function run(args) {
  if (args.help) return help.section()

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

## Rune file structure — `run-repl` mode

Interactive REPL runes keep the isolate alive across inputs. Module-level variables are session state.

```js
import { sqlite, section, md, help } from '@utils'

let db = null

// Optional: separate args schema for the REPL session.
// Does NOT fall back to args() if absent — runRepl(args) receives an empty args object.
export async function argsRepl(b) {
  return b
    .option('--db <path>', 'Database path', './state')
    .option('--help', 'Show help')
    .example('crunes run-repl my-rune', 'Start session')
    .build()
}

// Session initializer. Called once at start. Opens connections, sets up state.
// Returns the initial prompt string (default: "> ").
// Requires a separate "runRepl" permission block in config.json — does not inherit "run".
export async function runRepl(args) {
  if (args.help) return help.section()
  db = await sqlite.open(args.db, 'data')
  return 'db> '
}

// Welcome banner printed once after runRepl(), before the first prompt.
export function bannerRepl(args) {
  return `Connected to ${args.db} — type /exit to quit`
}

// Declare slash commands. Only .command() at root is used.
// Matched commands arrive in inputRepl() as { type: 'command', args: ParsedArgs }.
export function commandsRepl(b) {
  return b
    .command('exit', 'Quit the session')
    .command('schema', 'Show table schema', sub => sub.positional('<table>', 'Table name'))
}

// Per-input handler. Called once per InputEvent. Return a ReplSignal or void to continue.
export async function inputRepl(input) {
  if (input.type === 'eof' || input.type === 'interrupt') {
    return { type: 'done', message: 'Bye.' }
  }
  if (input.type === 'command' && input.args.$command === 'exit') {
    return { type: 'done' }
  }
  if (input.type === 'line') {
    const rows = await db.query(input.text.trim())
    section.emit(section.create('result', { type: 'markdown', content: md.table(Object.keys(rows[0] ?? {}), rows.map(r => Object.values(r).map(String))) }))
    // Return { type: 'prompt', value: 'new> ' } to change the prompt for the next turn
  }
}

// Tab completion — last element of tokens is the partial word being typed.
export async function completeInputRepl(tokens) {
  return ['SELECT', 'FROM', 'WHERE'].filter(k => k.startsWith((tokens.at(-1) ?? '').toUpperCase()))
}

// Guaranteed cleanup on exit (Ctrl+D, /exit, or error). Errors swallowed.
export async function disposeRepl() {
  if (db) { await db.close(); db = null }
}
```

### InputEvent types

| `type` | When | Fields |
|--------|------|--------|
| `'line'` | Normal input submitted | `text: string` (raw, untrimmed) |
| `'interrupt'` | Ctrl+C on empty prompt | `text: ''` |
| `'eof'` | Ctrl+D or stdin closed | `text: ''` |
| `'command'` | Matched slash command | `args: ParsedArgs` |

### ReplSignal return values

| Value | Effect |
|-------|--------|
| `{ type: 'done', message? }` | End session, optionally print message |
| `{ type: 'prompt', value? }` | Continue; optionally change prompt string |
| `void` / `undefined` | Continue with current prompt |

## Globals (no import needed)

These are injected into every rune sandbox automatically:

- **`logger`**: `logger.info(message, meta?)` · `logger.warn(message, meta?)` · `logger.error(message, meta?)` · `logger.debug(message, meta?)` — emits `{ type: 'log', level, message, meta? }` events. In text mode these write to stderr; in JSONL mode they appear as JSON on stdout. The optional `meta` is a plain object.
- **`console`**: `console.log(...)` · `console.warn(...)` · `console.error(...)` — same unified `{ type: 'log', level }` event shape, without `meta`.
- **`fetch(url, init?)`** — same as `http.fetch()`, available globally.
- **Timers**: `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval`
- **Encoding**: `TextEncoder`, `TextDecoder`
- **Streams**: `ReadableStream`, `WritableStream`, `TransformStream`
- **Web types**: `Blob`, `Headers`, `FormData`, `URLSearchParams`, `Request`, `Response`, `AbortController`, `AbortSignal`

## `@utils` reference

For full function signatures, parameter types, and return-object method lists, run:

```bash
crunes -p docs utils                      # all namespaces
crunes -p docs utils <ns>                 # one namespace (e.g. ws, fs, cache)
```

For the lifecycle contract:

```bash
crunes -p docs run        # run(args) export and args structure
crunes -p docs args       # args(builder) export
crunes -p docs run-repl   # run-repl lifecycle: runRepl, inputRepl, bannerRepl, etc.
crunes -p docs args-repl  # argsRepl(builder) export
```

- **`fs`**: `fs.read(path, opts?)` · `fs.write(path, content)` · `fs.readAsBytes(path, opts?)` · `fs.writeAsBytes(path, bytes)` · `fs.exists(path)` · `fs.glob(pattern, opts?)` · `fs.copy(src, dest)` · `fs.move(src, dest)` · `fs.remove(path, opts?)` · `fs.mkdir(path)` · `fs.stat(path)` · `fs.replace(path, regex, replacement)` · `fs.cwd()`
- **`md`**: `md.h1/h2/h3(text)` · `md.bold(text)` · `md.italic(text)` · `md.code(text)` · `md.codeBlock(text, lang?)` · `md.ul(items)` · `md.ol(items)` · `md.p(text)` · `md.table(headers, rows)` · `md.link(text, url)` · `md.blockquote(text)`
- **`tree`**: `tree.node(name, description, children?)` · `tree.format(root, { style? })`
- **`section`**: `section.create(name, data, opts?)` · `section.emit(section | section[])` — stream section before return · `section.match(name, patterns[])` · `section.selected()`
- **`help`**: `import { help } from '@utils'` — `help.section()` → returns a `Section` named `"help"` rendered from the rune's `args`/`argsRepl` schema · `help.text()` → same content as a raw string
- **`env`**: `env.read(key, fallback?)` · `env.has(key)`
- **`vars`**: `vars.read(key, fallback?)` · `vars.has(key)` — reads rune config vars
- **`rune`**: `rune.exec(key, args[], opts?)` → `RuneResult` · `rune.spawn(key, args[], opts?)` → `RuneSession` (with `write()`, `writeEof()`, `writeInterrupt()`, `stdin.write()` for repl mode) · `rune.job.start(key, args[], opts?)` → `{ id }` · `rune.job.kill(id)` · `rune.job.exists(id)` · `rune.job.stdout(id)` / `rune.job.stderr(id)` · `rune.job.sections(id)` · `rune.job.write(id, text)` / `rune.job.writeEof(id)` (repl mode only)
- **`http`**: `http.fetch(input, { method?, headers?, body?, timeout? })` — `input` is a URL string or `Request`; `body` can be `string \| Uint8Array \| ReadableStream \| Blob \| FormData \| URLSearchParams`; returns `Response` with `.ok`, `.status`, `.headers`, `.text()`, `.json()`, `.blob()`, `.body` (stream). Also available as the global `fetch()`.
- **`ws`**: `ws.client(url, opts?)` — returns `WsHandle` with `open()`, `sendText(msg)`, `sendBinary(data)`, `close()`, `on(event, fn)`
- **`time`**: `time.after(ms)` — resolves after ms milliseconds · global `setTimeout`/`clearTimeout`/`setInterval`/`clearInterval` are also available directly
- **`json`**: `json.read(path)` · `json.write(path, data)` · `json.readPath(path, jsonPath)` · `json.readPathAll(path, jsonPath)` · `json.modify(path, fn)`
- **`yaml`**: `yaml.read(path)` · `yaml.write(path, data)` · `yaml.modify(path, fn)`
- **`xml`**: `xml.read(path)` · `xml.write(path, data)` · `xml.modify(path, fn)`
- **`shell`**: `shell.exec(cmd, { throw?, trim?, timeout?, env?, binary?, stdin? })` → `ShellResult` (destructure `{ stdout }`) · `shell.spawn(cmd, { env?, signal?, binary? })` → `ShellSession` · `shell.job.start(cmd, opts?)` → `{ id }` (pass `repl: true` for stdin-backed jobs) · `shell.job.kill(id)` · `shell.job.exists(id)` · `shell.job.stdout(id)` / `shell.job.stderr(id)` · `shell.job.write(id, text)` / `shell.job.writeEof(id)` (repl mode only)
- **`cache`**: `cache.open(location, name?)` — returns `CacheHandle` with `set(key, value, ttl?)`, `get(key)`, `has(key)`, `delete(key)`, `clear()`
- **`sqlite`**: `sqlite.open(location, name?)` — returns `SqliteHandle` with `query(sql, params?)`, `get(sql, params?)`, `exec(sql, params?)`, `run(sql)`, `close()`
- **`archive`**: `archive.unzip(src, dest)` · `archive.zip(src, dest)` · `archive.untar(src, dest, {gzip?})` · `archive.tar(src, dest, {gzip?})` — `tar` defaults to `gzip:true`; `untar` auto-detects compression
- **`crypto`**: `crypto.uuid()` · `crypto.randomHex(size)` · `crypto.randomBase64(size)` · `crypto.hash(algo, data)` · `crypto.hashAsHex(algo, data)` · `crypto.hashAsBase64(algo, data)` · `crypto.hmac(algo, key, data)` · `crypto.hmacAsHex(algo, key, data)` · `crypto.hmacAsBase64(algo, key, data)` · `crypto.encrypt(algo, key, iv, data)` · `crypto.decrypt(algo, key, iv, cipher)` · `crypto.toHex(data)` · `crypto.fromHex(hex)` · `crypto.toBase64(data)` · `crypto.fromBase64(b64)`
- **`codec`**: encoding/decoding utilities — run `crunes -p docs utils codec` for full API

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
      "description": "Public API endpoints and their signatures",
      "permissions": {
        "run": { "allow": ["fs.read:./**"] },
        "runRepl": { "allow": ["fs.read:./**"] }
      }
    }
  }
}
```

`name` and `description` are shown in `crunes list` and `crunes docs rune`. The `runRepl` permission block is required for `run-repl` mode — it does not inherit from `run`.

## Test the rune

```bash
crunes -p run <key>                    # render output (plain)
crunes -p run <key> arg1 arg2          # test with args
crunes -p run <key> --help             # show help section
crunes -p run-repl <key>               # start interactive REPL session
crunes -p bench <key>                  # check execution time
crunes -p docs rune <key>              # inspect args schema
```
