import type { NextConfig } from "next";

/**
 * Static export for GitHub Pages.
 *
 * - `output: "export"` writes a fully static site to `out/` (no Node server).
 * - `NEXT_PUBLIC_BASE_PATH` is the sub-path the site is served from, e.g.
 *   "/smartplant-calendar" for https://hammammusa.github.io/smartplant-calendar/.
 *   Leave it empty for local development or a custom domain.
 * - `trailingSlash` makes every route a folder with index.html, so opening or
 *   refreshing any page directly works on GitHub Pages.
 * - Images are served as-is (GitHub Pages cannot run the image optimizer).
 *
 * The previous server-rendered version (Server Actions, Route Handlers, Proxy)
 * is preserved on the `server-version` branch.
 */
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

const nextConfig: NextConfig = {
  output: "export",
  basePath: basePath || undefined,
  trailingSlash: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
