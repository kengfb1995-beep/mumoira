import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@libsql/isomorphic-ws"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
