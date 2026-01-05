import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "anodesfypwifqxpsqmpt.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Configuration Turbopack vide (les exclusions sont gérées par tsconfig.json)
  turbopack: {},
};

export default nextConfig;
