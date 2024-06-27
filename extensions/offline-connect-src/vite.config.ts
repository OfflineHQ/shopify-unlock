import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import nodePolyfills from "vite-plugin-node-stdlib-browser";

export default defineConfig(({ mode }) => {
  if (!mode) throw new Error("No mode provided");
  const envDir = path.resolve(__dirname, "../../"); // Adjust the path as necessary
  const env = loadEnv("", envDir, "");
  if (!env.UNLOCK_APP_URL) {
    throw new Error("UNLOCK_APP_URL is not set");
  }
  return {
    plugins: [nodePolyfills(), react()],
    define: {
      global: "globalThis",
      "process.env.UNLOCK_APP_URL": JSON.stringify(env.UNLOCK_APP_URL),
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
          connect: "./src/connect.tsx",
        },
        output: {
          dir: "../offline-connect/assets",
          entryFileNames: "[name].js",
          assetFileNames: "index.[ext]",
        },
        external: [],
      },
    },
  };
});
