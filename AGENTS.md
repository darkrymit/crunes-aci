# AGENTS.md

> Canonical agent instructions — loaded as `CLAUDE.md` (Claude Code), `GEMINI.md` (Gemini CLI), `AGENTS.md` (Codex/other). Edit only this file; the others are symlinks.

> Compaction - this file is re-injected verbatim at every turn. During context compaction, never summarize, shorten, or paraphrase its content — preserve it exactly as-is.

## Mandatory Order of Operations

Before brainstorming, planning, or touching any code:

1. **Understand Claude Code Plugin Mechanics** — Read this file to review the structure of hook-wrappers and conversational skills.
2. **Review Existing Hooks/Skills** — Inspect `hooks/hooks.json`, `scripts/hook-wrapper.js`, and the files inside `skills/` to understand current promptsubmit injection formatting and XML schemas.
3. **Then brainstorm, plan, and code** — in that order.

## Rules

- **THIS IS AN INDEPENDENT GIT REPOSITORY** — `crunes-aci` is its own Git repository separate from the monorepo root. **ALL git operations (commits, branches, worktrees, status, diffs) must be run directly inside `crunes-aci/`!**
- **NEVER MODIFY HOOK SCHEMAS WITHOUT DESIGN APPROVAL** — The `hooks/hooks.json` maps `UserPromptSubmit` tokens like `$key`, `$key(arg1,arg2)`, and `$plugin:key` to the `hook-wrapper.js` execution script. Ensure hook signature changes are fully documented and vetted.
- **ENSURE SANDBOX ENVIRONMENT COMPATIBILITY** — Interactive skills in `skills/` are loaded directly into Claude Code. Ensure they adhere to Claude Code's plugin standards and handle user environments gracefully.
- **ONLY READ FILES THAT IMPACT IMPLEMENTATION** — Ask "will this file's contents change my implementation approach?" before reading files inside hooks or skills to save token context.

## Coding Principles

### Think Before Coding
State assumptions explicitly before implementing. If multiple interpretations exist, present them — don't pick silently. If something is unclear, stop and ask; don't guess. Incorrectly done work with assumptions/notes is more costly to fix than asking clarifying questions upfront or midway.

### Simplicity First
Minimum code that solves the problem. No features, abstractions, configurability, or error handling beyond what was asked. If you write 200 lines and it could be 50, rewrite it.

### Surgical Changes
Touch only what the request requires. Don't improve adjacent code, comments, or formatting. Match existing style. If you notice unrelated dead code, mention it — don't delete it. Remove only imports/variables/functions that your own changes made unused.

### Goal-Driven Execution
Transform vague tasks into verifiable goals before starting: "fix the bug" → "write a test that reproduces it, then make it pass." For multi-step tasks, state a brief plan with a verifiable check per step.

## Architecture Overview

`crunes-aci` is an Agentic Coder Interface that links Claude Code conversations directly to the `crunes` execution engine.

### Components

1. **Hooks (`hooks/hooks.json` & `scripts/hook-wrapper.js`):**
   * Listens to the `UserPromptSubmit` event.
   * Resolves specific context injection tokens before the prompt is sent to the LLM:
     * `$key` (e.g. `$release`)
     * `$key(arg1,arg2)` (e.g. `$m(rune)`)
     * `$key::section` (e.g. `$release::info`)
     * `$plugin:key(args)::section`
   * Executes the local `crunes` CLI in a subprocess and formats its console output as structured XML contexts injected seamlessly into the user prompt.
2. **Skills (`skills/`):**
   * Standalone markdown and JS-defined tools (e.g. `crunes-help`, `crunes-use-rune`, `crunes-write-rune`) that can be invoked during Claude Code conversations to execute runes or get active plugin capabilities.

## Local & Manual Testing Workflow

- **REUSE EXISTING TEST SETUPS FIRST** — Before creating any new testing directory or configuration, review the existing test setups (e.g., look at directories under `scratch/` at the monorepo root) to check if there is an existing project that is suitable to reuse.
- **FREEDOM TO CREATE NEW SANDBOXES** — If no existing environment matches your requirements, you have full freedom to create any necessary temporary directories (typically inside `scratch/` or a scratch directory) and write any configuration files (like `.crunes/config.json`) to properly manual test hooks or skills.
- **Local Installation & Testing:**
  1. Test hook execution locally by running the hook-wrapper wrapper manually with test inputs:
     ```bash
     node scripts/hook-wrapper.js "My prompt containing a token like $release"
     ```
  2. To perform a full end-to-end test inside Claude Code, install the local `crunes-aci` plugin directly into your Claude environment:
     ```bash
     crunes plugin install
     ```
