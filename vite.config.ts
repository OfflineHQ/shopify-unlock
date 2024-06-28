import { vitePlugin as remix } from "@remix-run/dev";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Related: https://github.com/remix-run/remix/issues/2835#issuecomment-1144102176
// Replace the HOST env var with SHOPIFY_APP_URL so that it doesn't break the remix server. The CLI will eventually
// stop passing in HOST, so we can remove this workaround after the next major release.
if (
  process.env.HOST &&
  (!process.env.SHOPIFY_APP_URL ||
    process.env.SHOPIFY_APP_URL === process.env.HOST)
) {
  process.env.SHOPIFY_APP_URL = process.env.HOST;
  delete process.env.HOST;
}

const host = new URL(process.env.SHOPIFY_APP_URL || "http://localhost")
  .hostname;

let hmrConfig;
if (host === "localhost") {
  hmrConfig = {
    protocol: "ws",
    host: "localhost",
    port: 64999,
    clientPort: 64999,
  };
} else {
  hmrConfig = {
    protocol: "wss",
    host: host,
    port: parseInt(process.env.FRONTEND_PORT!) || 8002,
    clientPort: 443,
  };
}

export default defineConfig(({ mode }) => {
  // Load environment variables based on the current mode
  const env = loadEnv(mode, process.cwd(), "");
  if (!env.SHOPIFY_API_KEY) throw new Error("SHOPIFY_API_KEY is required");

  if (!env.OFFLINE_WEB_API_URL)
    throw new Error("OFFLINE_WEB_API_URL is required");

  if (!env.OFFLINE_GATES_HANDLE)
    throw new Error("OFFLINE_GATES_HANDLE is required");
  return {
    server: {
      port: Number(process.env.PORT || 3000),
      hmr: hmrConfig,
      fs: {
        // See https://vitejs.dev/config/server-options.html#server-fs-allow for more information
        allow: ["app", "node_modules"],
      },
    },
    plugins: [
      remix({
        ignoredRouteFiles: ["**/.*"],
      }),
      tsconfigPaths(),
    ],
    resolve: {
      alias: {
        "@types": path.resolve(__dirname, "./types.d.ts"),
      },
      extensions: [".js", ".ts", ".d.ts", ".jsx", ".tsx", ".json"],
    },
    define: {
      "process.env.SHOPIFY_API_KEY": env.SHOPIFY_API_KEY
        ? JSON.stringify(env.SHOPIFY_API_KEY)
        : process.env.SHOPIFY_API_KEY,
      "process.env.OFFLINE_WEB_API_URL": JSON.stringify(
        env.OFFLINE_WEB_API_URL,
      ),
      "process.env.OFFLINE_GATES_HANDLE": JSON.stringify(
        env.OFFLINE_GATES_HANDLE,
      ),
    },
    build: {
      assetsInlineLimit: 0,
    },
  };
});
