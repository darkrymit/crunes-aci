---
name: crunes-use-plugin
description: Use when installing a plugin from the marketplace or a local path, enabling or disabling plugins per-project, updating plugins, or using runes that come from an installed plugin.
---

# Using Plugins

## Discover plugins

```bash
crunes marketplace browse              # list all plugins from all configured sources
crunes marketplace search <query>      # search by name or keyword
crunes marketplace list                # list configured marketplace source URLs
```

## Install a plugin

```bash
crunes plugin install <source>
```

| Source format | Example |
|---|---|
| Local directory | `crunes plugin install ./my-plugin` |
| GitHub shorthand | `crunes plugin install owner/repo` |
| Git URL | `crunes plugin install https://github.com/owner/repo.git` |
| npm package | `crunes plugin install my-package` |

Install adds the plugin to the global registry (`~/.crunes/plugins.json`) and enables it in `.crunes/config.json` for the current project. You will be prompted to review and consent to the plugin's declared permissions.

## Manage installed plugins

```bash
crunes plugin list                     # all installed plugins + enabled status per project
crunes plugin enable <plugin>          # add to this project's enabled list
crunes plugin disable <plugin>         # remove from this project's enabled list
crunes plugin update                   # update all installed plugins
crunes plugin update <plugin>          # update one plugin
crunes plugin uninstall <plugin>       # remove globally
```

On update, only new or escalated permissions trigger re-consent — not the full permission set.

## Use plugin rune keys

```bash
crunes use my-plugin:rune-key          # CLI
crunes use my-plugin:rune-key arg1     # with positional arg
crunes -p use my-plugin:rune-key       # plain output
```

In hook tokens (resolved automatically in prompts):

```
$my-plugin:rune-key
$my-plugin:rune-key(arg1,arg2)
$my-plugin:rune-key::section
$my-plugin:rune-key(arg1)::section
```

## Permission model

Plugin runes run in an isolated sandbox. Each rune's permissions are declared in the plugin's `plugin.json` and consented to at install time. Plugin runes always get read access to their own plugin directory automatically (`@plugin/**`). Any additional access (project files, network, shell, env) must be declared and consented.
