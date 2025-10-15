/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    ignoreBuildErrors: true, // empêche l'arrêt du build sur les warnings TS
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
