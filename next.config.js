/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['playwright', '@prisma/client', 'prisma'],
};

module.exports = nextConfig;
