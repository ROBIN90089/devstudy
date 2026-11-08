import { test } from "node:test";
import assert from "node:assert/strict";
import { getQuickJS } from "quickjs-emscripten";
import challenges from "../lib/challenges.json";
import { evaluate, equivalent } from "../lib/runner";
const module = await getQuickJS();
test("100 distinct challenges with at least three acceptance cases", () => {
  assert.equal(challenges.length, 100);
  assert.equal(new Set(challenges.map((c) => c.title)).size, 100);
  assert.equal(new Set(challenges.map((c) => c.id)).size, 100);
  assert.ok(challenges.every((c) => c.tests.length >= 3));
});
for (const c of challenges)
  test(`${c.id}: ${c.title}`, () => {
    const r = evaluate(module, c.solution, c.tests);
    assert.ok(
      r.every((x) => x.passed),
      JSON.stringify(r),
    );
    assert.ok(
      evaluate(module, c.starter, c.tests).some((x) => !x.passed),
      "Starter must require work",
    );
  });
test("sandbox denies host APIs", () => {
  const results = evaluate(
    module,
    "function solve(){ return [typeof fetch, typeof process, typeof require, typeof document, typeof localStorage, typeof WebSocket] }",
    [{ input: null, expected: Array(6).fill("undefined") }],
  );
  assert.equal(results[0].passed, true);
});
test("infinite loops are interrupted", () => {
  const start = Date.now();
  const result = evaluate(module, "function solve(){while(true){}}", [
    { input: null, expected: null },
  ]);
  assert.equal(result[0].passed, false);
  assert.match(result[0].error ?? "", /interrupted/);
  assert.ok(Date.now() - start < 3000);
});
test("prototype and global mutations cannot cross test contexts", () => {
  const r = evaluate(
    module,
    "function solve(){globalThis.count=(globalThis.count||0)+1;return count}",
    [
      { input: 1, expected: 1 },
      { input: 2, expected: 1 },
    ],
  );
  assert.ok(r.every((x) => x.passed));
});
test("invalid syntax returns an actionable error", () =>
  assert.ok(
    evaluate(module, "function solve( {", [{ input: 0, expected: 0 }])[0].error,
  ));
test("undefined return does not complete a challenge", () =>
  assert.equal(
    evaluate(module, "function solve(){}", [{ input: 0, expected: null }])[0]
      .passed,
    false,
  ));
test("oversized code rejected", () =>
  assert.throws(() => evaluate(module, " ".repeat(30001), [])));
test("object key order does not affect grading", () =>
  assert.ok(equivalent({ x: 1, y: [2] }, { y: [2], x: 1 })));
test("array order affects grading", () =>
  assert.equal(equivalent([1, 2], [2, 1]), false));

test("non-finite output cannot masquerade as JSON null", () => {
  const result = evaluate(module, "function solve(){return Infinity}", [
    { input: null, expected: null },
  ]);
  assert.equal(result[0].passed, false);
  assert.match(result[0].error ?? "", /finite/);
});
test("guest heap exhaustion becomes a failed test", () => {
  const result = evaluate(
    module,
    "function solve(){const a=[];for(let i=0;i<20000000;i++)a.push(i);return a.length}",
    [{ input: null, expected: 20000000 }],
  );
  assert.equal(result[0].passed, false);
  assert.ok(result[0].error);
});
