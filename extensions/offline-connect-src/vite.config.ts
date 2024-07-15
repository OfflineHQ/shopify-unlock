import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";
import path from "path";
import tailwindcss from "tailwindcss";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  if (!mode) throw new Error("No mode provided");
  const envDir = path.resolve(__dirname, "../../"); // Adjust the path as necessary
  const env = loadEnv("", envDir, "");
  if (!env.UNLOCK_APP_URL) {
    throw new Error("UNLOCK_APP_URL is not set");
  }
  return {
    plugins: [react()],
    define: {
      global: "globalThis",
      "process.env.UNLOCK_APP_URL": JSON.stringify(env.UNLOCK_APP_URL),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "~": path.resolve(__dirname, "../../src"),
      },
      extensions: [".js", ".ts", ".d.ts", ".jsx", ".tsx", ".json"],
    },
    css: {
      postcss: {
        plugins: [
          tailwindcss({
            config: path.resolve(__dirname, "./tailwind.config.extension.ts"),
          }),
          autoprefixer(),
        ],
      },
    },
    build: {
      target: "esnext",
      assetsDir: "",
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      minify: true,
      emptyOutDir: true,
      rollupOptions: {
        input: {
          unlock: "./src/unlock.tsx",
          "connect-modal": "./src/connect-modal.tsx",
          globals: "../../src/styles/globals.css",
        },
        output: {
          dir: "../offline-connect/assets",
          entryFileNames: "[name].js",
          assetFileNames: "[name].[ext]",
        },
        plugins: [],
        external: [],
      },
    },
  };
});
