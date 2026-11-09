import { readFile } from "node:fs/promises";
import { getQuickJS } from "quickjs-emscripten";
import challenges from "../lib/challenges.json";
import { evaluate } from "../lib/runner";

async function main() {
  const [command, id, path] = process.argv.slice(2);
  if (command === "list") {
    for (const challenge of challenges)
      console.log(challenge.id, challenge.title);
    return;
  }
  if (!command || command === "--help" || command === "help") {
    console.log(
      "devstudy list | show <challenge-id> | run <challenge-id> <solution.js>",
    );
    return;
  }
  if (command !== "show" && command !== "run")
    throw Error("Unknown command. Use --help.");
  const challenge = challenges.find((item) => item.id === id);
  if (!challenge) throw Error("Unknown challenge. Use list to see IDs.");
  if (command === "show") {
    console.log(
      challenge.title,
      "\n" + challenge.prompt,
      "\n\n" + challenge.starter,
    );
    return;
  }
  if (!path) throw Error("Provide a JavaScript solution file.");
  const results = evaluate(
    await getQuickJS(),
    await readFile(path, "utf8"),
    challenge.tests,
  );
  for (const [index, result] of results.entries()) {
    console.log(
      `Test ${index + 1}: ${result.passed ? "PASS" : (result.error ?? "FAIL")}`,
    );
  }
  if (results.some((result) => !result.passed)) process.exitCode = 1;
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
