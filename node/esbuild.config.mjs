import { parse } from "@toolbarthomas/argumentje";

const { suffix, minify } = parse();
const ext = suffix || ".js";
const extension = minify ? `.min${ext}` : ext;

export default {
  bundle: true,
  external: [],
  format: suffix === ".cjs" ? "cjs" : "esm",
  keepNames: true,
  metafile: false,
  minify,
  outdir: "dist",
  outExtension: { ".js": extension },
  platform: "node",
  plugins: [],
};
