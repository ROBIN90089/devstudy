import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeProgress } from "../lib/progress";
test("deduplicates completions and rejects fake challenge IDs", () =>
  assert.deepEqual(
    sanitizeProgress({
      completed: ["challenge-001", "challenge-001", "challenge-101", "nope"],
    }).completed,
    ["challenge-001"],
  ));
test("preserves notes and valid drafts", () =>
  assert.equal(
    sanitizeProgress({
      notes: "hello",
      drafts: { "challenge-001": "function solve(){}" },
    }).drafts["challenge-001"],
    "function solve(){}",
  ));
test("caps note length", () =>
  assert.equal(
    sanitizeProgress({ notes: "a".repeat(60000) }).notes.length,
    50000,
  ));
test("drops invalid activity", () =>
  assert.deepEqual(
    sanitizeProgress({
      activity: { "2026-11-08": 2, bad: 9, "2026-11-09": -1 },
    }).activity,
    { "2026-11-08": 2 },
  ));
