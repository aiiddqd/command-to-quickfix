import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import {
  matchesWhen,
  parseActions,
  filterActions,
  sortActions,
  resolveActions,
  Settings,
} from "../actions";

const selection = { hasSelection: true, languageId: "typescript" };
const noSelection = { hasSelection: false, languageId: "typescript" };

function settings(partial: Partial<Settings>): Settings {
  return {
    actions: [],
    showWhenNoSelection: false,
    preferredKind: "quickfix",
    ...partial,
  };
}

describe("parseActions", () => {
  it("skips entries without a string command", () => {
    const parsed = parseActions(
      [{}, { command: 42 }, { command: "" }, { command: "a.b" }],
      "quickfix",
    );
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].command, "a.b");
  });

  it("fills defaults: title=command, when=always, order=0", () => {
    const [a] = parseActions([{ command: "x.y" }], "quickfix");
    assert.deepEqual(a, {
      command: "x.y",
      title: "x.y",
      when: "always",
      kind: "quickfix",
      order: 0,
    });
  });

  it("uses preferredKind as fallback and rejects unknown kinds", () => {
    const [a, b] = parseActions(
      [{ command: "a", kind: "refactor" }, { command: "b", kind: "nope" }],
      "source",
    );
    assert.equal(a.kind, "refactor");
    assert.equal(b.kind, "source");
  });
});

describe("matchesWhen", () => {
  it("always matches", () => {
    assert.equal(matchesWhen("always", noSelection), true);
    assert.equal(matchesWhen("", noSelection), true);
  });

  it("editorHasSelection requires a selection", () => {
    assert.equal(matchesWhen("editorHasSelection", selection), true);
    assert.equal(matchesWhen("editorHasSelection", noSelection), false);
  });

  it("!editorHasSelection requires no selection", () => {
    assert.equal(matchesWhen("!editorHasSelection", noSelection), true);
    assert.equal(matchesWhen("!editorHasSelection", selection), false);
  });

  it("editorLangId == <id> matches the document language", () => {
    assert.equal(matchesWhen("editorLangId == typescript", selection), true);
    assert.equal(matchesWhen("editorLangId==python", selection), false);
  });

  it("unknown expressions never match", () => {
    assert.equal(matchesWhen("resourceExtname == .ts", selection), false);
  });
});

describe("filterActions", () => {
  const actions = parseActions(
    [
      { command: "a" },
      { command: "b", when: "editorHasSelection" },
      { command: "c", when: "always" },
    ],
    "quickfix",
  );

  it("hides default-when entries without selection unless showWhenNoSelection", () => {
    const shown = filterActions(actions, noSelection, false).map((a) => a.command);
    assert.deepEqual(shown, []);
    const shownWithFlag = filterActions(actions, noSelection, true).map(
      (a) => a.command,
    );
    assert.deepEqual(shownWithFlag, ["a", "c"]);
  });

  it("shows everything matching with a selection", () => {
    const shown = filterActions(actions, selection, false).map((a) => a.command);
    assert.deepEqual(shown, ["a", "b", "c"]);
  });
});

describe("sortActions", () => {
  it("sorts by order ascending, stable for ties", () => {
    const sorted = sortActions(
      parseActions(
        [
          { command: "late", order: 50 },
          { command: "first", order: 1 },
          { command: "tieA" },
          { command: "tieB" },
        ],
        "quickfix",
      ),
    ).map((a) => a.command);
    assert.deepEqual(sorted, ["tieA", "tieB", "first", "late"]);
  });
});

describe("resolveActions", () => {
  it("end-to-end: parse, filter, sort", () => {
    const result = resolveActions(
      settings({
        actions: [
          { command: "z", order: 10 },
          { command: "bad" },
          { order: 1 },
          { command: "a", when: "editorHasSelection", order: 1 },
        ],
      }),
      selection,
    );
    assert.deepEqual(
      result.map((a) => a.command),
      ["bad", "a", "z"],
    );
  });
});
