import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Cloudinary and ImgBB images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "i.ibb.co",
      },
      {
        protocol: "https",
        hostname: "*.ibb.co",
      },
    ],
  },
};

export default nextConfig;
