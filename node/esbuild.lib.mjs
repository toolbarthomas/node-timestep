import esbuild from "esbuild";

import config from "./esbuild.config.mjs";

/**
 * Compiles the mandatory Testing Suite that should not fail during production.
 */
(async () => {
  const defaults = {
    ...config,
    entryPoints: ["./src/index.ts"],
    plugins: [],
  };

  await esbuild.build(defaults);

  console.info(`Library compiled.`);
})();
