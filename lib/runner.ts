import type { QuickJSWASMModule } from "quickjs-emscripten";
export type TestCase = { input: unknown; expected: unknown };
export type TestResult = {
  passed: boolean;
  actual?: unknown;
  expected: unknown;
  error?: string;
};
export function equivalent(a: unknown, b: unknown): boolean {
  if (typeof a === "number" && typeof b === "number")
    return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
  if (a === b) return true;
  if (
    !a ||
    !b ||
    typeof a !== "object" ||
    typeof b !== "object" ||
    Array.isArray(a) !== Array.isArray(b)
  )
    return false;
  const ak = Object.keys(a),
    bk = Object.keys(b);
  return (
    ak.length === bk.length &&
    ak.every(
      (k) =>
        Object.hasOwn(b, k) &&
        equivalent(
          (a as Record<string, unknown>)[k],
          (b as Record<string, unknown>)[k],
        ),
    )
  );
}
export function evaluate(
  module: QuickJSWASMModule,
  code: string,
  cases: TestCase[],
): TestResult[] {
  if (code.length > 30000)
    throw Error("Code exceeds the 30,000 character limit.");
  return cases.map((test) => {
    const runtime = module.newRuntime();
    runtime.setMemoryLimit(16 * 1024 * 1024);
    runtime.setMaxStackSize(256 * 1024);
    const deadline = Date.now() + 600;
    runtime.setInterruptHandler(() => Date.now() > deadline);
    const vm = runtime.newContext();
    try {
      const script = `${code}\n;(() => {const result = solve(${JSON.stringify(test.input)});const text = JSON.stringify(result, (_key, value) => { if (typeof value === "number" && !Number.isFinite(value)) throw Error("Return finite numbers only"); return value; });if(text === undefined) throw Error('solve must return a JSON-compatible value');if(text.length > 100000) throw Error('Output too large');return text;})()`;
      const result = vm.evalCode(script);
      if (result.error) {
        const error = vm.dump(result.error);
        result.error.dispose();
        return {
          passed: false,
          expected: test.expected,
          error: String(error?.message ?? error),
        };
      }
      const encoded = vm.getString(result.value);
      result.value.dispose();
      const actual = JSON.parse(encoded);
      return {
        passed: equivalent(actual, test.expected),
        actual,
        expected: test.expected,
      };
    } catch (e) {
      return {
        passed: false,
        expected: test.expected,
        error: e instanceof Error ? e.message : String(e),
      };
    } finally {
      vm.dispose();
      runtime.dispose();
    }
  });
}
