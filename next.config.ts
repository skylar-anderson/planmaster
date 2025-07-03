import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow external GitHub avatar images to be optimized by next/image
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
