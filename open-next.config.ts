import { defineConfig } from "@opennextjs/cloudflare";

export default defineConfig({
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
    },
  },
  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
    },
  },
});
