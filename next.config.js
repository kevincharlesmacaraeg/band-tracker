/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['playwright', '@prisma/client', 'prisma'],
  },
};

module.exports = nextConfig;
