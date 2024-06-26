import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import toml from "toml";
import { defineConfig, loadEnv } from "vite";
import nodePolyfills from "vite-plugin-node-stdlib-browser";

export default defineConfig(({ mode }) => {
  if (!mode) throw new Error("No mode provided");
  const envDir = path.resolve(__dirname, "../../"); // Adjust the path as necessary
  const env = loadEnv("", envDir, "");

  // Read the corresponding TOML file based on the mode
  const tomlFile = `../../shopify.app.${mode}.toml`;
  const tomlConfig = toml.parse(fs.readFileSync(tomlFile, "utf-8"));
  console.log({ tomlConfig, env: env.UNLOCK_APP_URL });
  if (!process.env.UNLOCK_APP_URL) {
    throw new Error("UNLOCK_APP_URL is not set");
  }
  return {
    plugins: [nodePolyfills(), react()],
    define: {
      global: "globalThis",
      "process.env.SHOPIFY_UNLOCK_BACKEND_URL": JSON.stringify(
        tomlConfig.application_url,
      ),
      "process.env.UNLOCK_APP_URL": JSON.stringify(env.UNLOCK_APP_URL),
    },
    build: {
      target: "esnext",
      assetsDir: "",
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      minify: false,
      emptyOutDir: true,
      rollupOptions: {
        input: "./src/index.jsx",
        output: {
          inlineDynamicImports: true,
          dir: "../offline-connect/assets",
          entryFileNames: "index.js",
          assetFileNames: "index.[ext]",
        },
        external: [],
      },
    },
  };
});
