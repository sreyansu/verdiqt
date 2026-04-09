import dotenv from "dotenv";
import path from "path";

const envPath = path.resolve(__dirname, "../../../.env");
console.log(`[Dotenv] Loading .env from: ${envPath}`);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error(`[Dotenv] Error loading .env: ${result.error.message}`);
} else {
  console.log(`[Dotenv] ✓ Successfully loaded .env file`);
}
