---
name: crunes-write-plugin
description: Use when scaffolding or authoring a new crunes plugin — creating the plugin directory structure, manifests, and rune files so the plugin can be installed via crunes plugin install.
---

# Writing a Plugin

## Scaffold a new plugin

```bash
# Interactive
crunes -p plugin create <name>

# Non-interactive
crunes -p -y plugin create <name> \
  --description "What this plugin provides" \
  --author "Your Name" \
  --license MIT \
  --out ./my-plugin-dir
```

`--out` defaults to `./<name>`. Generates 6 files:

```
<name>/
├─ .crunes-plugin/
│   ├─ plugin.json          — runtime manifest (runes, permissions, metadata)
│   └─ marketplace.json     — publishing manifest (self-serves as a one-plugin marketplace)
├─ runes/
│   └─ example.js           — runnable example rune
├─ templates/
│   └─ example-template.js  — example template (same structure as a rune)
├─ README.md
└─ CHANGELOG.md
```

## `plugin.json` structure

Located at `.crunes-plugin/plugin.json` (not the repo root — the validator looks specifically at this subpath).

```json
{
  "format": "1",
  "name": "<name>",
  "version": "1.0.0",
  "description": "...",
  "author": { "name": "..." },
  "license": "MIT",
  "keywords": [],
  "runes": {
    "my-rune": {
      "name": "Human-readable name",
      "permissions": {
        "use": {
          "allow": ["fs.read:./**"],
          "deny": []
        }
      }
    }
  },
  "templates": {
    "my-template": { "name": "Template Name" }
  }
}
```

## Permission declarations

Declared per-rune in `plugin.json`. Adding a new rune to an existing plugin counts as a new permission grant and triggers user re-consent.

Supported permissions:
- **`fs.read:<path-pattern>`**: Read files under the matched path (e.g. `fs.read:./**` or `fs.read:@plugin/**`).
- **`fs.write:<path-pattern>`**: Write files under the matched path (e.g. `fs.write:./**`).
- **`shell.run:<cmd-prefix>`**: Run shell commands matching the given prefix.
- **`http.fetch:<method-and-url-pattern>`**: Make HTTP requests (e.g. `http.fetch:GET::https://api.github.com/**` or wildcard `http.fetch:**`).
- **`env.read:<source>::<key-pattern>`**: Read environment variables (e.g. `env.read:process::GITHUB_TOKEN` or wildcard `env.read:**`).
- **`sqlite.read:<path-pattern>` / `sqlite.write:<path-pattern>`**: Read or write to SQLite databases (e.g. `sqlite.read:./db/**`).
- **`cache.read:<path-pattern>` / `cache.write:<path-pattern>`**: Read or write to cache buckets.
- **`ws.client:<url-pattern>`**: Connect as a WebSocket client to matching URLs.
- **`ws.server:<host-port-path>`**: Bind/run a WebSocket server.
- **`http.server:<host-port>`**: Bind/run an HTTP server.

## Rune files inside a plugin

Same API as project runes. Live in `runes/` and are called as `plugin-name:rune-name`.

```js
import { md, section } from '@utils'

export async function args(b) {
  return b
    .positional('[target]', 'Optional target path')
    .build()
}

export async function run(args) {
  const target = args._[0] ?? '.'
  return section.create('result', {
    type: 'markdown',
    content: md.p(`Running against: ${target}`),
  })
}
```

Templates live in `templates/` and are scaffolded into user projects via `crunes -p template apply plugin-name:template-name`. They have the same file structure as runes.

## Test locally before publishing

```bash
crunes -p plugin install ./<name>         # install from local dir
crunes -p run <name>:example              # run the example rune
crunes -p plugin list                     # confirm it appears as enabled
crunes -p plugin uninstall <name>         # clean up after testing
```

## Publish via marketplace

`marketplace.json` makes this repo its own one-plugin marketplace. To serve it:

```bash
# Add as a local marketplace source
crunes -p marketplace add ./path/to/plugin

# Add as a remote marketplace source
crunes -p marketplace add https://raw.githubusercontent.com/owner/repo/main/.crunes-plugin/marketplace.json

# Install from that source
crunes -p plugin install <name>
```
