import multer from "multer";
import { Request } from "express";

// Utilize memory storage to hold the files as memory buffers before pushing to S3 bucket
const storage = multer.memoryStorage();

/**
 * Configure multer middleware limits, storage type, and filter guidelines.
 */
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Strict 5MB limit for clean uploads
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only image files (jpeg, png, webp) and PDF documents are allowed.") as any, false);
    }
  },
});
