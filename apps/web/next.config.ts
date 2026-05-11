import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimized standalone output for Vercel
  output: "standalone",

  // Allow Cloudinary images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/dqltyvave/**",
      },
    ],
  },
};

export default nextConfig;
