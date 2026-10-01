---
title: "Command to Quick Fix"
status: done
completed: 2026-10-01
rfc: ../rfc/mvp/rfc.md
---

# Spec: Command to Quick Fix

A VS Code extension that shows arbitrary existing commands (primarily AI agent commands) in the Quick Fix menu (`Ctrl+.`).

## What was done

- A single global `CodeActionProvider` for all languages (`{ scheme: "file" }`), declaring the `quickfix` / `refactor` / `source` kinds — [src/extension.ts](../../src/extension.ts).
- `commandToQuickFix.actions` setting: an array of entries with `command` (required), `title`, `when`, `kind`, `order`.
- `commandToQuickFix.showWhenNoSelection` (default `false`) and `commandToQuickFix.preferredKind` (default `quickfix`) settings.
- Supported `when` conditions: `always` (default), `editorHasSelection`, `!editorHasSelection`, `editorLangId == <id>`. Unknown expressions never match.
- Own items are sorted by `order` (lower = higher); ties keep the config order (stable sort).
- All logic (parsing, filtering, sorting) is extracted into the pure module [src/actions.ts](../../src/actions.ts) with no dependency on the VS Code API — covered by `node:test` unit tests.
- Commands, build and verification: `npm install`, `npm test`, manual check via the Extension Development Host (`F5`) — see [README.md](../../README.md).

## Key decisions

- Activation via `onStartupFinished` instead of `onLanguage` — the provider is global, so lazy per-language activation is unnecessary.
- The config is read on every `provideCodeActions` call — `settings.json` changes are picked up without reloading the window.
- `title` defaults to the command id; `order` defaults to `0`.
- Entries with an invalid `command` are silently skipped.

## Deviations from the RFC

- In addition to the MVP (RFC plan §8), the full simple set of `when` conditions from RFC §4.2 was implemented (`always`, `editorHasSelection`, `!editorHasSelection`, `editorLangId == <id>`) — it's one and the same parser code path.
- The `hideOtherQuickFixes` setting from the RFC was not implemented: hiding third-party Code Actions is impossible with the current API, so the setting would be useless.

## Known limitations / next steps

- Third-party Code Actions cannot be hidden — the VS Code API does not allow it (documented in the README).
- The order of your own items relative to third-party ones is not controllable.
- Nice to Have items from the RFC were not included: command `args` support, item grouping, list management UI (QuickPick), full VS Code `when` expressions.
- No integration tests in the Extension Host — manual verification per the "Test Instructions" in the archived RFC.
