import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log("[Cloudinary Initialize]", {
  cloud_name: cloudName || "NOT SET",
  api_key: apiKey ? apiKey.substring(0, 5) + "..." : "NOT SET",
  api_secret: apiSecret ? apiSecret.substring(0, 5) + "..." : "NOT SET",
});

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  console.log("[Cloudinary] ✓ Configured successfully");
} else {
  console.error("[Cloudinary] ✗ Missing required environment variables");
  console.error(
    `[Cloudinary] Missing: ${!cloudName ? "CLOUDINARY_CLOUD_NAME" : ""} ${
      !apiKey ? "CLOUDINARY_API_KEY" : ""
    } ${!apiSecret ? "CLOUDINARY_API_SECRET" : ""}`
  );
}

export { cloudinary };
