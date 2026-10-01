import * as vscode from "vscode";
import {
  ActionKind,
  RawAction,
  Settings,
  normalizeKind,
  resolveActions,
} from "./actions";

const SECTION = "commandToQuickFix";

function readSettings(): Settings {
  const config = vscode.workspace.getConfiguration(SECTION);
  return {
    actions: config.get<RawAction[]>("actions", []),
    showWhenNoSelection: config.get<boolean>("showWhenNoSelection", false),
    preferredKind: normalizeKind(config.get<string>("preferredKind"), "quickfix"),
  };
}

function toCodeActionKind(kind: ActionKind): vscode.CodeActionKind {
  switch (kind) {
    case "refactor":
      return vscode.CodeActionKind.Refactor;
    case "source":
      return vscode.CodeActionKind.Source;
    default:
      return vscode.CodeActionKind.QuickFix;
  }
}

class UniversalCommandCodeActionProvider implements vscode.CodeActionProvider {
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
  ): vscode.CodeAction[] {
    const settings = readSettings();
    const specs = resolveActions(settings, {
      hasSelection: !range.isEmpty,
      languageId: document.languageId,
    });
    return specs.map((spec) => {
      const action = new vscode.CodeAction(spec.title, toCodeActionKind(spec.kind));
      action.command = { command: spec.command, title: spec.title };
      return action;
    });
  }
}

export function activate(context: vscode.ExtensionContext): void {
  const provider = vscode.languages.registerCodeActionsProvider(
    { scheme: "file" },
    new UniversalCommandCodeActionProvider(),
    {
      providedCodeActionKinds: [
        vscode.CodeActionKind.QuickFix,
        vscode.CodeActionKind.Refactor,
        vscode.CodeActionKind.Source,
      ],
    },
  );
  context.subscriptions.push(provider);
}

export function deactivate(): void {}
