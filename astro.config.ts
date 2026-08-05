import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://vulnbench.com",
  output: "static",
  integrations: [mdx(), react(), sitemap()],
  vite: {
    oxc: {
      jsx: {
        runtime: "automatic",
        development: false,
      },
    },
    build: {
      cssMinify: true,
    },
  },
});
