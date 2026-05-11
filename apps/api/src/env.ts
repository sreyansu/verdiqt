import dotenv from "dotenv";
import path from "path";

// In production (Render, etc.), env vars are injected by the platform.
// Only load from .env file in development.
if (process.env.NODE_ENV !== "production") {
  const envPath = path.resolve(__dirname, "../../../.env");
  console.log(`[Dotenv] Loading .env from: ${envPath}`);
  const result = dotenv.config({ path: envPath });

  if (result.error) {
    console.error(`[Dotenv] Error loading .env: ${result.error.message}`);
  } else {
    console.log(`[Dotenv] ✓ Successfully loaded .env file`);
  }
} else {
  console.log(`[Env] Running in production mode — using platform env vars`);
}
