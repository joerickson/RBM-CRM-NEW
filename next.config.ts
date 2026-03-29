import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  serverActions: {
    allowedOrigins: ["*.app.github.dev", "localhost:3000"],
  },
};

export default nextConfig;
