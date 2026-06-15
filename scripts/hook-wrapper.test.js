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
  [{ key: 'docs', rawBracket: '', rawArgs: '' }],
  'bare key'
)
assert.deepEqual(
  parseTokens('$$api(v2)'),
  [{ key: 'api', rawBracket: '', rawArgs: 'v2' }],
  'key with args'
)
assert.deepEqual(
  parseTokens('$$api()'),
  [{ key: 'api', rawBracket: '', rawArgs: '' }],
  'empty parens treated as no args'
)
assert.deepEqual(
  parseTokens('$$api(v2)::endpoints'),
  [{ key: 'api', rawBracket: '', rawArgs: 'v2' }],
  'legacy :: section syntax is ignored — only args captured'
)
assert.deepEqual(
  parseTokens('$$api::endpoints,errors'),
  [{ key: 'api', rawBracket: '', rawArgs: '' }],
  'legacy :: section-only syntax is ignored'
)
assert.deepEqual(
  parseTokens('$$search(hello world,src,--count,5)'),
  [{ key: 'search', rawBracket: '', rawArgs: 'hello world,src,--count,5' }],
  'space-containing arg captured whole'
)
assert.deepEqual(
  parseTokens('$$docs $$api(v2)'),
  [
    { key: 'docs', rawBracket: '', rawArgs: '' },
    { key: 'api', rawBracket: '', rawArgs: 'v2' },
  ],
  'two tokens'
)
assert.deepEqual(
  parseTokens('fetch $$my-plugin:rune-key(arg) for context'),
  [{ key: 'my-plugin:rune-key', rawBracket: '', rawArgs: 'arg' }],
  'plugin-namespaced key'
)
assert.deepEqual(
  parseTokens('$$m(foo(bar))'),
  [{ key: 'm', rawBracket: '', rawArgs: 'foo(bar)' }],
  'nested parentheses'
)
assert.deepEqual(
  parseTokens('$$m(foo(bar(baz)))'),
  [{ key: 'm', rawBracket: '', rawArgs: 'foo(bar(baz))' }],
  'deeply nested parentheses'
)

// ─── buildCliArgs ─────────────────────────────────────────────────────────────

assert.deepEqual(
  buildCliArgs([{ key: 'docs', rawBracket: '', rawArgs: '' }]),
  ['run', '--format', 'jsonl', 'docs'],
  'single bare key'
)
assert.deepEqual(
  buildCliArgs([{ key: 'api', rawBracket: '', rawArgs: 'v2' }]),
  ['run', '--format', 'jsonl', 'api', 'v2'],
  'single arg'
)
assert.deepEqual(
  buildCliArgs([{ key: 'api', rawBracket: '-s endpoints', rawArgs: 'v2' }]),
  ['run', '--format', 'jsonl', 'api[-s endpoints]', 'v2'],
  'bracket flag + arg'
)
assert.deepEqual(
  buildCliArgs([{ key: 'search', rawBracket: '', rawArgs: 'hello world,src,--count,5' }]),
  ['run', '--format', 'jsonl', 'search', 'hello world', 'src', '--count', '5'],
  'comma-split args including space-containing value'
)
assert.deepEqual(
  buildCliArgs([
    { key: 'docs', rawBracket: '', rawArgs: '' },
    { key: 'api', rawBracket: '', rawArgs: 'v2' },
  ]),
  ['run', '--format', 'jsonl', '-b', 'docs', '+', 'api', 'v2'],
  'two tokens joined with + and programmatically batched'
)

// ─── checkBatch + readMergedBatchConfig ──────────────────────────────────────

const { checkBatch, readMergedBatchConfig } = require('./hook-wrapper.js')

// readMergedBatchConfig
assert.deepEqual(
  readMergedBatchConfig({}, {}),
  {},
  'both empty → empty'
)
assert.deepEqual(
  readMergedBatchConfig({ runes: { m: { batch: { allow: ['*'] } } } }, {}),
  { m: { batch: { allow: ['*'] } } },
  'shared only → returns shared runes'
)
assert.deepEqual(
  readMergedBatchConfig(
    { runes: { release: { batch: { allow: ['info*'] } } } },
    { runes: { release: { batch: { allow: ['*'] } } } }
  ),
  { release: { batch: { allow: ['*'] } } },
  'local batch block fully replaces shared'
)
assert.deepEqual(
  readMergedBatchConfig(
    { runes: { m: { batch: { allow: ['*'] } } } },
    { runes: { release: { batch: { allow: ['info*'] } } } }
  ),
  { m: { batch: { allow: ['*'] } }, release: { batch: { allow: ['info*'] } } },
  'local adds new rune entry'
)

// checkBatch
assert.equal(
  checkBatch([{ key: 'm', rawArgs: 'rune' }], { m: { batch: { allow: ['*'] } } }),
  null,
  'allowed → null'
)
assert.equal(
  typeof checkBatch([{ key: 'deploy', rawArgs: '' }], {}),
  'string',
  'no batch block → returns error string'
)
assert.ok(
  checkBatch([{ key: 'deploy', rawArgs: '' }], {}).includes('deploy'),
  'error string mentions the denied rune key'
)
assert.equal(
  checkBatch([{ key: 'release', rawArgs: 'info' }], { release: { batch: { allow: ['info*'] } } }),
  null,
  'allow prefix matches → null'
)
assert.equal(
  typeof checkBatch([{ key: 'release', rawArgs: 'bump --minor' }], { release: { batch: { allow: ['info*'] } } }),
  'string',
  'allow prefix does not match → error string'
)
assert.equal(
  typeof checkBatch(
    [{ key: 'm', rawArgs: '' }, { key: 'deploy', rawArgs: '' }],
    { m: { batch: { allow: ['*'] } } }
  ),
  'string',
  'first denied token in multi-token batch returns error string'
)

console.log('All tests passed.')
