import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["lighthouse", "chrome-launcher", "puppeteer-core"],
};

export default nextConfig;
