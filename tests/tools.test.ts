import { test } from "node:test";
import assert from "node:assert/strict";
import { studyTools, runTool } from "../lib/tools";
test("exactly 50 distinct tools", () => {
  assert.equal(studyTools.length, 50);
  assert.equal(new Set(studyTools.map((t) => t.name)).size, 50);
});
for (const tool of studyTools)
  test(`example runs: ${tool.name}`, () => {
    const output = runTool(tool, tool.example);
    assert.ok(output.length > 0);
    assert.ok(!output.includes("undefined"));
    assert.ok(!output.includes("NaN"));
  });
const run = (name: string, input: string) =>
  runTool(
    studyTools.find((t) => t.name === name)!,
    input,
  );
const checks: [string, string, string][] = [
  ["JSON formatter", '{"a":1}', '{\n  "a": 1\n}'],
  ["JSON minifier", '{ "x": 2 }', '{"x":2}'],
  ["URL encoder", "a&b", "a%26b"],
  ["URL decoder", "a%20b", "a b"],
  ["Base64 encoder", "مرحبا", "2YXYsdit2KjYpw=="],
  ["Base64 decoder", "2YXYsdit2KjYpw==", "مرحبا"],
  ["Uppercase converter", "abc", "ABC"],
  ["Lowercase converter", "ABC", "abc"],
  ["Title case converter", "hello WORLD", "Hello World"],
  ["Slug generator", "Café au lait!", "cafe-au-lait"],
  ["Remove duplicate lines", "a\na\nb", "a\nb"],
  ["Sort lines", "c\na\nb", "a\nb\nc"],
  ["Whitespace cleaner", "  a   b  ", "a b"],
  ["Text reverser", "a😀", "😀a"],
  ["Mean calculator", "[2,4,6]", "4"],
  ["Median calculator", "[10,2,3]", "3"],
  ["Percentage calculator", '{"part":1,"whole":4}', "25"],
  ["Percentage change", '{"before":100,"after":80}', "-20"],
  ["Factorial calculator", "0", "1"],
  ["Prime checker", "1", "false"],
  ["Prime checker", "97", "true"],
  ["Binary decoder", "1010", "10"],
  [
    "Weighted grade calculator",
    '[{"grade":50,"weight":1},{"grade":100,"weight":3}]',
    "87.5",
  ],
  ["Length converter", '{"value":1,"from":"km","to":"m"}', "1000"],
  ["Mass converter", '{"value":1,"from":"kg","to":"g"}', "1000"],
];
for (const [name, input, expected] of checks)
  test(`correct output: ${name} ${input}`, () =>
    assert.equal(run(name, input), expected));
for (const [name, input] of [
  ["JSON formatter", "{"],
  ["Mean calculator", "[]"],
  ["Binary decoder", "102"],
  ["Factorial calculator", "-1"],
  ["Prime checker", "1e100"],
  ["Truth table", "BAD"],
  ["Revision schedule", "2026-02-30"],
  ["Required exam grade", '{"current":80,"target":90,"examWeight":0}'],
  ["Weighted grade calculator", '[{"grade":80,"weight":-1}]'],
  ["Flashcard deck builder", "missing separator"],
  ["Reading plan", '{"pages":100,"days":0}'],
])
  test(`invalid input: ${name}`, () => assert.throws(() => run(name, input)));
test("CSV quoting handles commas and quotes", () =>
  assert.equal(run("JSON → CSV", '[{"name":"a,\\\"b"}]'), '"name"\n"a,""b"'));
test("study allocation preserves total", () => {
  const result = JSON.parse(
    run(
      "Study time allocator",
      '{"minutes":100,"subjects":[{"name":"a","weight":2},{"name":"b","weight":3}]}',
    ),
  );
  assert.equal(
    result.reduce((a: number, b: { minutes: number }) => a + b.minutes, 0),
    100,
  );
});
test("reading plan covers all pages", () => {
  const result = JSON.parse(run("Reading plan", '{"pages":125,"days":7}'));
  assert.equal(
    result.reduce((a: number, b: { pages: number }) => a + b.pages, 0),
    125,
  );
  assert.equal(result.length, 7);
});
test("pomodoro omits final break", () => {
  const r = JSON.parse(
    run(
      "Pomodoro session planner",
      '{"sessions":4,"focus":25,"shortBreak":5,"longBreak":15}',
    ),
  );
  assert.equal(r.totalMinutes, 115);
  assert.equal(r.plan.at(-1).type, "Focus");
});
