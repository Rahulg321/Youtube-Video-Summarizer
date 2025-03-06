/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["ytpl"], // Allow ytpl in server components
  },
};

export default nextConfig;
