import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  transpilePackages: ["react-cytoscapejs"],
  async rewrites() {
    const backendUrl = (
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      'http://host.docker.internal:8001'
    ).replace(/\/+$/, '');

    return [
      {
        source: '/api/backend/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
