# Command to Quick Fix

Shows any existing VS Code command (including AI agent commands) in the Quick Fix menu (`Ctrl+.`). No code required — just configuration in `settings.json`.

## Getting Started

### Quick install

```bash
git clone https://github.com/aiiddqd/ddhq.git   # the extension lives in includes/command-to-quickfix
cd ddhq/includes/command-to-quickfix
npm install
npm run compile
npx @vscode/vsce package --no-dependencies  # builds command-to-quickfix-0.1.0.vsix
code --install-extension command-to-quickfix-0.1.0.vsix
```

Alternative without packaging — copy the compiled folder to `~/.vscode/extensions/` and restart VS Code.

### Minimal setup

Add to `settings.json` (`Cmd+Shift+P` → "Preferences: Open User Settings (JSON)"):

```json
"commandToQuickFix.actions": [
  { "command": "editor.action.commentLine", "title": "Toggle Line Comment", "order": 100 }
]
```

Select some code, press `Ctrl+.` — the "Toggle Line Comment" item appears in the menu. From there, plug in any commands — see the examples below.

## Configuration

```json
"commandToQuickFix.actions": [
  {
    "command": "kimi.insertMention",
    "title": "Kimi: Insert Mention",
    "when": "editorHasSelection",
    "order": 1
  },
  {
    "command": "github.copilot.chat.addSelectionToChat",
    "title": "Copilot: Add Selection",
    "when": "editorHasSelection",
    "order": 2
  },
  {
    "command": "editor.action.commentLine",
    "title": "Toggle Line Comment",
    "order": 100
  }
]
```

### Entry fields

| Field     | Default      | Description                                                      |
| --------- | ------------ | ---------------------------------------------------------------- |
| `command` | — (required) | VS Code command id                                               |
| `title`   | = command    | Item title in the menu                                           |
| `when`    | `always`     | `always` \| `editorHasSelection` \| `!editorHasSelection` \| `editorLangId == <id>` |
| `kind`    | `quickfix`   | `quickfix` \| `refactor` \| `source` — group in the actions menu |
| `order`   | `0`          | Order of your own items (lower = higher)                         |

### Additional settings

```json
"commandToQuickFix.showWhenNoSelection": false,
"commandToQuickFix.preferredKind": "quickfix"
```

- `showWhenNoSelection` — show entries without an explicit `when` when there is no selection.
- `preferredKind` — default kind for entries without `kind`.

## Examples for AI agents

```json
"commandToQuickFix.actions": [
  { "command": "kimi.insertMention", "title": "➕ Kimi: Add to Chat", "when": "editorHasSelection", "order": 1 },
  { "command": "cursor.addSelectionToChat", "title": "➕ Cursor: Add to Chat", "when": "editorHasSelection", "order": 2 },
  { "command": "continue.addCodeToContext", "title": "➕ Continue: Add to Context", "when": "editorHasSelection", "order": 3 },
  { "command": "cline.addToContext", "title": "➕ Cline: Add to Context", "when": "editorHasSelection", "order": 4 }
]
```

## Limitations

- Third-party Code Actions cannot be hidden — the VS Code API does not allow it.
- The order of your own items relative to third-party ones is not controllable.

## Development

```bash
npm install
npm test      # compile + unit tests of the logic (node:test)
```

Manual check: `F5` in VS Code (Extension Development Host), add entries to `settings.json`, select code and press `Ctrl+.`.

## License

[MIT](./LICENSE)
