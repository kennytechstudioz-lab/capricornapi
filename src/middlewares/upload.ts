import multer from "multer";
import { Request } from "express";
import path from "path";
import fs from "fs";
import { UPLOAD_DIR } from "../utils/localUpload";

// Configure disk storage to store uploaded files directly in the api uploads folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .substring(0, 50);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${baseName || "media"}-${uniqueSuffix}${ext || ".png"}`);
  },
});

/**
 * Configure multer middleware limits, storage type, and filter guidelines.
 */
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf" ||
      /\.(jpe?g|png|webp|svg|gif|ico|pdf)$/i.test(file.originalname)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (jpeg, png, webp, svg, gif) and PDF documents are allowed."));
    }
  },
});
