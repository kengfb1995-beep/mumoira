import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@libsql/client", "@libsql/isomorphic-ws"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
