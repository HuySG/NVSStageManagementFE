import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["firebasestorage.googleapis.com"],
  },
  eslint: {
    ignoreDuringBuilds: true, // 👈 Tắt kiểm tra ESLint khi build
  },
};

export default nextConfig;
