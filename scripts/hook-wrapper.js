'use strict'

const { spawnSync } = require('child_process')

// ─── Pure functions (exported for testing) ────────────────────────────────────

// Matches: $key  $key(args)  $key::sections  $key(args)::sections
// key may contain a single colon for plugin namespacing (my-plugin:rune-key)
// Key must start with a lowercase letter [a-z].
const TOKEN_REGEX = /\$([a-z][\w@-]*(?::(?!:)[\w@-]+)*)(?:\(([^)]*)\))?(?:::([^$\s]*))?/g

function parseTokens(prompt) {
  const tokens = []
  let match
  TOKEN_REGEX.lastIndex = 0
  while ((match = TOKEN_REGEX.exec(prompt)) !== null) {
    tokens.push({
      key: match[1],
      rawArgs: match[2] ?? '',
      rawSections: match[3] ?? '',
    })
  }
  return tokens
}

function buildCliArgs(tokens) {
  const cliArgs = ['use', '--format', 'json']
  if (tokens.length > 1) {
    cliArgs.push('-b')
  }
  for (let i = 0; i < tokens.length; i++) {
    if (i > 0) cliArgs.push('+')
    const { key, rawArgs, rawSections } = tokens[i]
    if (rawSections) cliArgs.push('--section', rawSections)
    cliArgs.push(key)
    if (rawArgs) {
      const args = rawArgs.split(',').map(a => a.trim()).filter(Boolean)
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

  const result = spawnSync('crunes', cliArgs, {
    encoding: 'utf8',
    cwd: process.cwd(),
    shell: true,
  })

  if (result.error || result.status !== 0) {
    process.stderr.write(
      `[crunes] Query failed: ${result.stderr || (result.error && result.error.message) || 'unknown error'}\n`
    )
    emit('')
    return
  }

  let allSections
  try {
    allSections = JSON.parse(result.stdout)
  } catch (err) {
    process.stderr.write(`[crunes] Query returned invalid JSON: ${err.message}\n`)
    emit('')
    return
  }

  if (!Array.isArray(allSections)) {
    process.stderr.write(`[crunes] Query returned unexpected JSON shape\n`)
    emit('')
    return
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

module.exports = { parseTokens, buildCliArgs }
