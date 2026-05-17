import mongoose from "mongoose";
import dotenv from "dotenv";

// Ensure environment variables are loaded
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

export async function connectDatabase(): Promise<void> {
  if (!MONGODB_URI) {
    console.error("✗ MONGODB_URI is undefined in environmental configurations! Check your .env file.");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGODB_URI);
    console.log("✓ Connected to MongoDB Atlas successfully!");
  } catch (error) {
    console.error("✗ MongoDB Atlas connection failure:", error);
    // Do not crash the entire server immediately, but log failure telemetry
  }
}
