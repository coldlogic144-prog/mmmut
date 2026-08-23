/**
 * Next.js configuration for "The Ledger" — a student dashboard.
 * App Router with enhanced security headers for a production-grade feel.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force App Router semantics — client-side nav uses the app/ directory
  // purely. Nothing extra required here, but we keep a stable config file so
  // Tailwind + plugins are picked up consistently.
      // (typedRoutes left off so plain string hrefs keep working across the app)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ];
  },
};

export default nextConfig;