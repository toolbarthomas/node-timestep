import path, { extname } from "node:path";
import { unlinkSync } from "node:fs";

import esbuild from "esbuild";

import { sync } from "glob";

import config from "./esbuild.config.mjs";
(async () => {
  const defaults = {
    ...config,
    entryPoints: [...sync(["src/tests/*.test.ts"])],
    external: ["mocha"],
    minify: false,
    outdir: "dist/tests",
    outExtension: { ".js": ".js" },
  };

  await esbuild.build(defaults);

  sync("./dist/tests/*.d.ts").forEach((path) => {
    unlinkSync(path);
  });

  console.info(`Test suite compiled...`);
})();
