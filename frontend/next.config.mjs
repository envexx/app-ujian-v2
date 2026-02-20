/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip type checking during build (faster builds)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Images configuration
  images: {
    unoptimized: true,
  },
  
  // Environment variables exposed to client
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

export default nextConfig;
