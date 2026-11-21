import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// SINGLE=1 のときは、プレビュー用に 1つの HTML に まとめる
const single = process.env.SINGLE === "1";

export default defineConfig({
  plugins: [react(), ...(single ? [viteSingleFile()] : [])],
  build: single ? { assetsInlineLimit: 100000000 } : {},
});
