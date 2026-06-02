---
name: crunes-use-plugin
description: Use when installing a plugin from the marketplace or a local path, enabling or disabling plugins per-project, updating plugins, or using runes that come from an installed plugin.
---

# Using Plugins

## Discover plugins

```bash
crunes -p marketplace browse              # list all plugins from all configured sources
crunes -p marketplace search <query>      # search by name or keyword
crunes -p marketplace list                # list configured marketplace source URLs
```

## Install a plugin

```bash
crunes -p plugin install <source>
```

| Source format | Example |
|---|---|
| Local directory | `crunes -p plugin install ./my-plugin` |
| GitHub shorthand | `crunes -p plugin install owner/repo` |
| Git URL | `crunes -p plugin install https://github.com/owner/repo.git` |
| npm package | `crunes -p plugin install my-package` |

Install adds the plugin to the global registry (`~/.crunes/plugins.json`) and enables it in `.crunes/config.json` for the current project. You will be prompted to review and consent to the plugin's declared permissions.

## Manage installed plugins

```bash
crunes -p plugin list                     # all installed plugins + enabled status per project
crunes -p plugin enable <plugin>          # add to this project's enabled list
crunes -p plugin disable <plugin>         # remove from this project's enabled list
crunes -p plugin update                   # update all installed plugins
crunes -p plugin update <plugin>          # update one plugin
crunes -p plugin uninstall <plugin>       # remove globally
```

On update, only new or escalated permissions trigger re-consent — not the full permission set.

## Use plugin rune keys

```bash
crunes -p use my-plugin:rune-key          # CLI
crunes -p use my-plugin:rune-key arg1     # with positional arg
```

In hook tokens (resolved automatically in prompts):

```
$$my-plugin:rune-key
$$my-plugin:rune-key(arg1,arg2)
$$my-plugin:rune-key::section
$$my-plugin:rune-key(arg1)::section
```

## Permission model

Plugin runes run in an isolated sandbox. Each rune's permissions are declared in the plugin's `plugin.json` and consented to at install time. Plugin runes always get read access to their own plugin directory automatically (`@plugin/**`). Any additional access (project files, network, shell, env) must be declared and consented.
