import type { NextConfig } from "next";

// Build the list of allowed origins for Server Actions CSRF protection.
// Same-origin requests are always allowed by Next.js. These entries cover
// cross-origin scenarios such as GitHub Codespaces (where the browser origin
// differs from the internal localhost host) and other hosting environments.
const allowedOrigins = [
  // GitHub Codespaces – both current and legacy URL formats
  "*.app.github.dev",
  "*.github.dev",
  // Local development
  "localhost:3000",
];

// Vercel deployments expose VERCEL_URL (no protocol, e.g. "foo.vercel.app")
if (process.env.VERCEL_URL) {
  allowedOrigins.push(process.env.VERCEL_URL);
}

// Any explicitly configured app URL (e.g. custom domain)
if (process.env.NEXT_PUBLIC_APP_URL) {
  try {
    const { host } = new URL(process.env.NEXT_PUBLIC_APP_URL);
    if (host) allowedOrigins.push(host);
  } catch {
    // Ignore malformed URLs
  }
}

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

  experimental: {
    serverActions: {
      allowedOrigins,
    },
  },
};

export default nextConfig;
