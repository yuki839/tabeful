import type * as NodeModuleType from "module";

type ModuleWithSourceMap = NodeModuleType & {
  findSourceMap?: (source: string) => { payload?: unknown } | undefined;
  setSourceMapsEnabled?: (enabled: boolean) => void;
};

const patchFindSourceMap = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Module = require("module") as ModuleWithSourceMap;

    if (!Module.findSourceMap) {
      return;
    }

    if (typeof Module.setSourceMapsEnabled === "function") {
      Module.setSourceMapsEnabled(false);
    }

    const originalFindSourceMap = Module.findSourceMap.bind(Module);
    Module.findSourceMap = (source: string) => {
      try {
        const map = originalFindSourceMap(source);
        if (!map) return map;
        if (map.payload == null || typeof map.payload !== "object") {
          return undefined;
        }
        return map;
      } catch {
        return undefined;
      }
    };
  } catch {
    // ignore: "module" may be unavailable in some Node runtimes
  }
};

patchFindSourceMap();

export async function register() {
  patchFindSourceMap();
}
