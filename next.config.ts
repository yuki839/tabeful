import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
    logging: {
      fetches:{ fullUrl: true },
  },
  experimental: {
    useCache: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'places.googleapis.com',
      },
    ],
  },
};

export default nextConfig;
