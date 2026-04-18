import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    // Exclude @zoom/meetingsdk from webpack bundle - loaded dynamically via CDN in iframe
    config.externals = [...(config.externals || []), '@zoom/meetingsdk'];
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
