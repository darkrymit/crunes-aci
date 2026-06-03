'use strict'

const assert = require('node:assert/strict')
const { parseTokens, buildCliArgs } = require('./hook-wrapper.js')

// ─── parseTokens ─────────────────────────────────────────────────────────────

assert.deepEqual(parseTokens(''), [], 'empty prompt')
assert.deepEqual(parseTokens('no tokens here'), [], 'no tokens')
assert.deepEqual(parseTokens('$PATH'), [], 'uppercase env variable ignored')
assert.deepEqual(parseTokens('$100'), [], 'numeric value ignored')
assert.deepEqual(parseTokens('$docs'), [], 'single dollar not a token')
assert.deepEqual(
  parseTokens('$$docs'),
  [{ key: 'docs', rawArgs: '', rawSections: '' }],
  'bare key'
)
assert.deepEqual(
  parseTokens('$$api(v2)'),
  [{ key: 'api', rawArgs: 'v2', rawSections: '' }],
  'key with args'
)
assert.deepEqual(
  parseTokens('$$api()'),
  [{ key: 'api', rawArgs: '', rawSections: '' }],
  'empty parens treated as no args'
)
assert.deepEqual(
  parseTokens('$$api(v2)::endpoints'),
  [{ key: 'api', rawArgs: 'v2', rawSections: 'endpoints' }],
  'args + section filter'
)
assert.deepEqual(
  parseTokens('$$api::endpoints,errors'),
  [{ key: 'api', rawArgs: '', rawSections: 'endpoints,errors' }],
  'section filter only, multiple sections'
)
assert.deepEqual(
  parseTokens('$$search(hello world,src,--count,5)'),
  [{ key: 'search', rawArgs: 'hello world,src,--count,5', rawSections: '' }],
  'space-containing arg captured whole'
)
assert.deepEqual(
  parseTokens('$$docs $$api(v2)::endpoints'),
  [
    { key: 'docs', rawArgs: '', rawSections: '' },
    { key: 'api', rawArgs: 'v2', rawSections: 'endpoints' },
  ],
  'two tokens'
)
assert.deepEqual(
  parseTokens('fetch $$my-plugin:rune-key(arg) for context'),
  [{ key: 'my-plugin:rune-key', rawArgs: 'arg', rawSections: '' }],
  'plugin-namespaced key'
)
assert.deepEqual(
  parseTokens('$$m(foo(bar))'),
  [{ key: 'm', rawArgs: 'foo(bar)', rawSections: '' }],
  'nested parentheses'
)
assert.deepEqual(
  parseTokens('$$m(foo(bar(baz)))'),
  [{ key: 'm', rawArgs: 'foo(bar(baz))', rawSections: '' }],
  'deeply nested parentheses'
)

// ─── buildCliArgs ─────────────────────────────────────────────────────────────

assert.deepEqual(
  buildCliArgs([{ key: 'docs', rawArgs: '', rawSections: '' }]),
  ['run', '--format', 'jsonl', 'docs'],
  'single bare key'
)
assert.deepEqual(
  buildCliArgs([{ key: 'api', rawArgs: 'v2', rawSections: '' }]),
  ['run', '--format', 'jsonl', 'api', 'v2'],
  'single arg'
)
assert.deepEqual(
  buildCliArgs([{ key: 'api', rawArgs: 'v2', rawSections: 'endpoints' }]),
  ['run', '--format', 'jsonl', '--section', 'endpoints', 'api', 'v2'],
  'arg + section filter'
)
assert.deepEqual(
  buildCliArgs([{ key: 'api', rawArgs: '', rawSections: 'endpoints,errors' }]),
  ['run', '--format', 'jsonl', '--section', 'endpoints,errors', 'api'],
  'section filter only'
)
assert.deepEqual(
  buildCliArgs([{ key: 'search', rawArgs: 'hello world,src,--count,5', rawSections: '' }]),
  ['run', '--format', 'jsonl', 'search', 'hello world', 'src', '--count', '5'],
  'comma-split args including space-containing value'
)
assert.deepEqual(
  buildCliArgs([
    { key: 'docs', rawArgs: '', rawSections: '' },
    { key: 'api', rawArgs: 'v2', rawSections: 'endpoints' },
  ]),
  ['run', '--format', 'jsonl', '-b', 'docs', '+', '--section', 'endpoints', 'api', 'v2'],
  'two tokens joined with + and programmatically batched'
)

console.log('All tests passed.')
