import { build } from "esbuild";
import { copyFile } from "node:fs/promises";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
await build({
  entryPoints: ["lib/runner.worker.ts"],
  bundle: true,
  format: "esm",
  platform: "browser",
  outfile: "public/runner.js",
  minify: true,
});
await copyFile(
  require.resolve("@jitl/quickjs-wasmfile-release-sync/wasm"),
  "public/quickjs.wasm",
);
