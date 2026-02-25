import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  reactCompiler: true,
  serverSourceMaps: false,
    logging: {
      fetches:{ fullUrl: true },
  },
  experimental: {
    useCache: true,
    externalDir: true,
    turbopackSourceMaps: false,
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'places.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

export default nextConfig;
