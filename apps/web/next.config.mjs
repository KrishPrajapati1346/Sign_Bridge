/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@signbridge/shared-types'],
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
