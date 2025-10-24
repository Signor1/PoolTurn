/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Fix for @react-native-async-storage/async-storage in MetaMask SDK
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
      'react-native': false,
    };

    // Ignore warnings for these modules
    config.ignoreWarnings = [
      { module: /@metamask\/sdk/ },
      { module: /@react-native-async-storage/ },
    ];

    return config;
  },
};

export default nextConfig;
