/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  
  // Static export for Cloudflare Pages
  output: 'export',
  trailingSlash: true,
  
  // Cloudflare Pages compatible configuration
  images: {
    unoptimized: true, // Required for static export
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Environment variables exposed to client
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Note: redirects and headers are not supported with static export
  // Use _redirects file or Cloudflare Pages rules instead
};

export default nextConfig;
