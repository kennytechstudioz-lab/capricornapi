"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
// Ensure environment variables are loaded
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI;
async function connectDatabase() {
    if (!MONGODB_URI) {
        console.error("✗ MONGODB_URI is undefined in environmental configurations! Check your .env file.");
        process.exit(1);
    }
    try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose_1.default.connect(MONGODB_URI);
        console.log("✓ Connected to MongoDB Atlas successfully!");
    }
    catch (error) {
        console.error("✗ MongoDB Atlas connection failure:", error);
        // Do not crash the entire server immediately, but log failure telemetry
    }
}
