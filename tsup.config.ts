import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["cjs", "esm"],
  outDir: "dist",
  clean: true,
  dts: true,
  sourcemap: true,
  target: "node20",
});
