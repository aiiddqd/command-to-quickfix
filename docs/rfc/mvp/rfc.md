# RFC: Universal Command → Quick Fix Bridge

**Status:** Done  
**Completed:** 2026-10-01  
**Author:** Grok  
**Date:** 2026-10-01  
**Target:** VS Code Extension

---

## 1. Problem

Currently, Quick Fix (`Ctrl+.`) only shows the Code Actions explicitly provided by a Language Server or extensions via a `CodeActionProvider`.

Many useful commands (especially AI agent commands) already exist in the system:

- `kimi.insertMention`
- `cursor.addSelectionToChat`
- `continue.addCodeToContext`
- `cline.addToContext`
- `github.copilot.chat.addSelectionToChat`
- and any other commands that can work with a selection

But they **do not appear** in Quick Fix because nobody registered a `CodeActionProvider` for them.

Desired:

1. Universally add **any** existing command to Quick Fix.
2. Manage the list (add / remove / sort).
3. Where possible, affect third-party Code Actions as well (at least hide them).

---

## 2. Goals

### Must Have

- Ability to specify in `settings.json` a list of commands that should appear in Quick Fix.
- Commands must work with the current selection (or cursor).
- Works for any language (`[*]`).
- Simple configuration without the user writing any code.

### Should Have

- Ability to set a custom title for the menu item.
- Show condition (only with a selection / always / per language).
- Priority / display order of your own items.

### Nice to Have

- Ability to hide third-party Code Actions (as far as technically possible).
- Grouping of items.
- Support for command arguments.

---

## 3. Proposed Solution

### Extension name

`command-to-quickfix`  
or  
`universal-quickfix-commands`

### Configuration (User / Workspace Settings)

```json
"commandToQuickFix.actions": [
  {
    "command": "kimi.insertMention",
    "title": "Kimi: Insert Mention",
    "when": "editorHasSelection",          // optional
    "kind": "quickfix",                   // quickfix | refactor | source
    "order": 10
  },
  {
    "command": "cursor.addSelectionToChat",
    "title": "Cursor: Add to Chat",
    "when": "editorHasSelection",
    "order": 20
  },
  {
    "command": "editor.action.commentLine",
    "title": "Toggle Line Comment",
    "order": 100
  }
]
```

### Additional settings

```json
"commandToQuickFix.showWhenNoSelection": false,   // whether to show items without a selection
"commandToQuickFix.hideOtherQuickFixes": false,   // try to hide third-party ones (see limitations)
"commandToQuickFix.preferredKind": "quickfix"
```

---

## 4. Technical Design

### 4.1 Core mechanism

The extension registers a single global `CodeActionProvider` for all languages:

```ts
vscode.languages.registerCodeActionsProvider(
  { scheme: "file" }, // or a more specific selector
  new UniversalCommandCodeActionProvider(),
  {
    providedCodeActionKinds: [
      vscode.CodeActionKind.QuickFix,
      vscode.CodeActionKind.Refactor,
      vscode.CodeActionKind.Source,
    ],
  },
);
```

In `provideCodeActions` it:

1. Reads the `commandToQuickFix.actions` settings.
2. Checks the `when` condition for each entry (via `vscode.commands.executeCommand('getContext')` or a simple `editorHasSelection` check).
3. Creates a `vscode.CodeAction` with `action.command = { command, title }`.
4. Sorts by `order`.
5. Returns the array.

### 4.2 When conditions

We support a simple set:

| Value                 | Behavior                    |
| --------------------- | --------------------------- |
| `always`              | Always show                 |
| `editorHasSelection`  | Only if there is a selection |
| `!editorHasSelection` | Only if there is no selection |
| `editorLangId == xxx` | Per language                |

This can be extended to full VS Code `when` expressions in the future.

### 4.3 Sorting and priority

- Own items are sorted by the `order` field (lower = higher).
- VS Code shows third-party Code Actions in its own order. Fully controlling their order is **impossible** without hacks.

### 4.4 Hiding third-party Code Actions

**Technical limitation:**

VS Code provides no API for removing third-party Code Actions from the list.

Possible half-measures:

1. **Don't show your own** if the user enabled `hideOtherQuickFixes` — useless.
2. Use `CodeActionKind` so that your own items are grouped separately.
3. Document that fully hiding third-party items is **impossible** with the current API.

Conclusion: the RFC honestly states that hiding third-party Code Actions is **out of scope** / best-effort.

---

## 5. Usage Example

```json
"commandToQuickFix.actions": [
  {
    "command": "kimi.insertMention",
    "title": "➕ Kimi: Add to Chat",
    "when": "editorHasSelection",
    "order": 1
  },
  {
    "command": "github.copilot.chat.addSelectionToChat",
    "title": "➕ Copilot: Add Selection",
    "when": "editorHasSelection",
    "order": 2
  },
  {
    "command": "editor.action.formatSelection",
    "title": "Format Selection",
    "order": 50
  }
]
```

After that, these items appear in `Ctrl+.` in the desired order when code is selected.

---

## 6. Limitations and Risks

| Limitation                             | Comment                                  |
| -------------------------------------- | ---------------------------------------- |
| Cannot remove third-party Code Actions | The VS Code API does not allow it        |
| Order relative to third-party items    | Not controllable                         |
| Some commands require arguments        | `args` support will need to be added     |
| Commands that don't work with selections | The user must verify this themselves   |
| Extension activation                   | Better `onStartupFinished` or `onLanguage` |

---

## 7. Alternatives Considered

1. **My Code Actions** — can only insert/replace text.
2. **Run Commands as Code Actions** — mostly for `codeActionsOnSave`.
3. Writing a separate `CodeActionProvider` per command — inconvenient.
4. Using the `menus` contribution — does not land in Quick Fix.

Conclusion: a small dedicated extension is the cleanest path.

---

## 8. Implementation Plan (MVP)

1. Basic `CodeActionProvider` + settings reading.
2. Support for `command` + `title` + `order`.
3. Simple `editorHasSelection` condition.
4. Documentation + examples for popular AI agents.
5. (Optional) `args` support.

---

## 9. Open Questions

1. Should we support full VS Code `when` expressions right away, or is a simple enum enough?
2. Should we add a UI for managing the command list (QuickPick + saving to settings)?
3. Do we want to try affecting third-party Code Actions, or honestly say "impossible" up front?

---

## Test Instructions

### 1. Automated tests (unit tests of the logic)

- [src/test/actions.test.ts](../../../src/test/actions.test.ts) — configuration parsing, `when` conditions, filtering by selection, sorting by `order`, end-to-end `resolveActions`
- [src/actions.ts](../../../src/actions.ts) — the tested pure module (no dependency on the VS Code API)
- Run: `npm install && npm test` — 12 green tests expected

### 2. Manual check in the Extension Development Host

- Open the extension folder in VS Code, press `F5` — an Extension Development Host starts with the extension active
- Add the example from §5 of this RFC or from [README.md](../../../README.md) to the host's `settings.json`
- [src/extension.ts](../../../src/extension.ts) — the provider that reads the settings and returns Code Actions

### 3. Quick Fix verification scenarios

- Select code in any file and press `Ctrl+.` — items from `commandToQuickFix.actions` are visible in `order` order (lower = higher)
- Clear the selection — items with `when: "editorHasSelection"` disappear
- Pick an item — the specified command executes (`editor.action.commentLine` is convenient for testing)
- Check `when: "editorLangId == typescript"` on `.ts` and `.py` files


---
