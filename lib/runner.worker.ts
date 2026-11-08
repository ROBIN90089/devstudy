import {
  newQuickJSWASMModuleFromVariant,
  newVariant,
} from "quickjs-emscripten-core";
import variant from "@jitl/quickjs-wasmfile-release-sync";
import { evaluate } from "./runner";
const ready = newQuickJSWASMModuleFromVariant(
  newVariant(variant, { wasmLocation: "/quickjs.wasm" }),
);
self.onmessage = async (event: MessageEvent) => {
  try {
    const module = await ready;
    self.postMessage({
      results: evaluate(module, event.data.code, event.data.tests),
    });
  } catch (e) {
    self.postMessage({ error: e instanceof Error ? e.message : String(e) });
  }
};
