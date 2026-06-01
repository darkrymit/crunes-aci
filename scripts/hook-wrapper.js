'use strict'

const { spawnSync } = require('child_process')

// ─── Pure functions (exported for testing) ────────────────────────────────────

// Matches: $key  $key(args)  $key::sections  $key(args)::sections
// key may contain a single colon for plugin namespacing (my-plugin:rune-key)
// Key must start with a lowercase letter [a-z].
function parseTokens(prompt) {
  const tokens = []
  let i = 0
  while (i < prompt.length) {
    if (prompt[i] === '$' && i + 1 < prompt.length && /[a-z]/.test(prompt[i + 1])) {
      const startIdx = i
      i++ // skip '$'
      
      let key = ''
      while (i < prompt.length) {
        const char = prompt[i]
        if (/[\w@-]/.test(char)) {
          key += char
          i++
        } else if (char === ':') {
          if (i + 1 < prompt.length && prompt[i + 1] === ':') {
            break
          }
          key += char
          i++
        } else {
          break
        }
      }

      if (!/^[a-z][\w@-]*(?::[\w@-]+)*$/.test(key)) {
        i = startIdx + 1
        continue
      }
      
      let rawArgs = ''
      if (i < prompt.length && prompt[i] === '(') {
        i++ // skip '('
        let parenCount = 1
        let argStart = i
        while (i < prompt.length && parenCount > 0) {
          const char = prompt[i]
          if (char === '(') {
            parenCount++
          } else if (char === ')') {
            parenCount--
          }
          if (parenCount > 0) {
            i++
          }
        }
        if (parenCount === 0) {
          rawArgs = prompt.substring(argStart, i)
          i++ // skip ')'
        } else {
          i = startIdx + 1
          continue
        }
      }
      
      let rawSections = ''
      if (i + 1 < prompt.length && prompt[i] === ':' && prompt[i + 1] === ':') {
        i += 2
        while (i < prompt.length) {
          const char = prompt[i]
          if (/\s|\$/.test(char)) {
            break
          }
          rawSections += char
          i++
        }
      }
      
      tokens.push({ key, rawArgs, rawSections })
    } else {
      i++
    }
  }
  return tokens
}

function parseRawArgs(str) {
  const args = []
  const regex = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|([^,]+)/g
  let match
  while ((match = regex.exec(str)) !== null) {
    const val = (match[1] !== undefined ? match[1] : (match[2] !== undefined ? match[2] : match[3])).trim()
    if (val !== undefined && val !== '') {
      args.push(val)
    }
  }
  return args
}

function buildCliArgs(tokens) {
  const cliArgs = ['use', '--format', 'jsonl']
  if (tokens.length > 1) {
    cliArgs.push('-b')
  }
  for (let i = 0; i < tokens.length; i++) {
    if (i > 0) cliArgs.push('+')
    const { key, rawArgs, rawSections } = tokens[i]
    if (rawSections) cliArgs.push('--section', rawSections)
    cliArgs.push(key)
    if (rawArgs) {
      const args = parseRawArgs(rawArgs)
      cliArgs.push(...args)
    }
  }
  return cliArgs
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main(raw) {
  let prompt = ''
  try {
    const input = JSON.parse(raw)
    prompt = input.prompt || ''
  } catch {
    // stdin not JSON or empty — no tokens to parse
  }

  const tokens = parseTokens(prompt)

  if (tokens.length === 0) {
    emit('')
    return
  }

  const cliArgs = buildCliArgs(tokens)
  const cmd = process.platform === 'win32' ? 'crunes.cmd' : 'crunes'

  const result = spawnSync(cmd, cliArgs, {
    encoding: 'utf8',
    cwd: process.cwd(),
  })

  if (result.error || result.status !== 0) {
    process.stderr.write(
      `[crunes] Query failed: ${result.stderr || (result.error && result.error.message) || 'unknown error'}\n`
    )
    emit('')
    return
  }

  const allSections = []
  const lines = result.stdout.split('\n').map(l => l.trim()).filter(Boolean)
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line)
      if (parsed.type === 'section') {
        allSections.push(parsed.section)
      }
    } catch (err) {
      process.stderr.write(`[crunes] Query returned invalid JSON: ${err.message} (Line: ${line})\n`)
    }
  }

  const xmlBlocks = []
  for (const section of allSections) {
    const block = renderSectionToXml(section)
    if (block) xmlBlocks.push(block)
  }

  emit(xmlBlocks.join('\n\n'))
}

// ─── Rendering ────────────────────────────────────────────────────────────────

function renderSectionToXml(section) {
  const content = renderData(section.data)
  const trimmed = content && content.replace(/^(\r?\n)+|(\r?\n)+$/g, '')
  if (!trimmed) return null

  const allAttrs = {}
  if (section.title) allAttrs.title = section.title
  if (section.attrs) Object.assign(allAttrs, section.attrs)

  const attrStr = Object.entries(allAttrs)
    .map(([k, v]) => `${k}="${String(v).replace(/"/g, '&quot;')}"`)
    .join(' ')

  const name = section.name || 'context'
  const openTag = attrStr ? `<${name} ${attrStr}>` : `<${name}>`
  return `${openTag}\n${trimmed}\n</${name}>`
}

function renderData(data) {
  if (!data) return null
  if (data.type === 'markdown') return data.content ?? null
  if (data.type === 'tree') return renderTree(data.root)
  return null
}

function renderTree(root) {
  if (!root) return null
  const lines = [`${root.name.padEnd(12)}${root.description}`]
  appendChildren(root.children || [], '', lines)
  return lines.join('\n')
}

function appendChildren(children, prefix, lines) {
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    const isLast = i === children.length - 1
    const connector = isLast ? '└── ' : '├── '
    const childPrefix = prefix + (isLast ? '    ' : '│   ')
    lines.push(`${prefix}${connector}${child.name.padEnd(12)}${child.description}`)
    appendChildren(child.children || [], childPrefix, lines)
  }
}

function emit(additionalContext) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext,
    },
  }))
}

// ─── Entrypoint ───────────────────────────────────────────────────────────────

if (require.main === module) {
  let stdinData = ''
  process.stdin.on('data', chunk => (stdinData += chunk))
  process.stdin.on('end', () => {
    try {
      main(stdinData)
    } catch (err) {
      process.stderr.write(`[crunes] Fatal: ${err.message}\n`)
      emit('')
    }
  })
}

module.exports = { parseTokens, buildCliArgs, parseRawArgs }
