export type ActionKind = "quickfix" | "refactor" | "source";

export interface RawAction {
  command?: unknown;
  title?: unknown;
  when?: unknown;
  kind?: unknown;
  order?: unknown;
}

export interface ActionSpec {
  command: string;
  title: string;
  when: string;
  kind: ActionKind;
  order: number;
}

export interface ActionContext {
  hasSelection: boolean;
  languageId: string;
}

export interface Settings {
  actions: RawAction[];
  showWhenNoSelection: boolean;
  preferredKind: ActionKind;
}

const DEFAULT_WHEN = "always";

export function normalizeKind(value: unknown, fallback: ActionKind): ActionKind {
  return value === "quickfix" || value === "refactor" || value === "source"
    ? value
    : fallback;
}

/** Drop malformed entries; fill defaults for the rest. */
export function parseActions(raw: RawAction[], preferredKind: ActionKind): ActionSpec[] {
  const result: ActionSpec[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry.command !== "string" || entry.command.length === 0) {
      continue;
    }
    result.push({
      command: entry.command,
      title: typeof entry.title === "string" && entry.title.length > 0
        ? entry.title
        : entry.command,
      when: typeof entry.when === "string" && entry.when.length > 0
        ? entry.when
        : DEFAULT_WHEN,
      kind: normalizeKind(entry.kind, preferredKind),
      order: typeof entry.order === "number" && Number.isFinite(entry.order)
        ? entry.order
        : 0,
    });
  }
  return result;
}

/**
 * Supported `when` values (RFC §4.2):
 *   always | editorHasSelection | !editorHasSelection | editorLangId == <id>
 * Unknown expressions never match.
 */
export function matchesWhen(when: string, ctx: ActionContext): boolean {
  const expr = when.trim();
  if (expr === "always" || expr === "") {
    return true;
  }
  if (expr === "editorHasSelection") {
    return ctx.hasSelection;
  }
  if (expr === "!editorHasSelection") {
    return !ctx.hasSelection;
  }
  const langMatch = /^editorLangId\s*==\s*([\w#+.-]+)$/.exec(expr);
  if (langMatch) {
    return ctx.languageId === langMatch[1];
  }
  return false;
}

export function filterActions(
  actions: ActionSpec[],
  ctx: ActionContext,
  showWhenNoSelection: boolean,
): ActionSpec[] {
  return actions.filter((action) => {
    if (!ctx.hasSelection && !showWhenNoSelection && action.when === DEFAULT_WHEN) {
      return false;
    }
    return matchesWhen(action.when, ctx);
  });
}

/** Lower `order` first; stable for equal values. */
export function sortActions(actions: ActionSpec[]): ActionSpec[] {
  return [...actions].sort((a, b) => a.order - b.order);
}

export function resolveActions(
  settings: Settings,
  ctx: ActionContext,
): ActionSpec[] {
  const parsed = parseActions(settings.actions, settings.preferredKind);
  return sortActions(filterActions(parsed, ctx, settings.showWhenNoSelection));
}
