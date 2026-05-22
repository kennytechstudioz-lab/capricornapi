"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
// Utilize memory storage to hold the files as memory buffers before pushing to S3 bucket
const storage = multer_1.default.memoryStorage();
/**
 * Configure multer middleware limits, storage type, and filter guidelines.
 */
exports.upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // Strict 5MB limit for clean uploads
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
            cb(null, true);
        }
        else {
            cb(new Error("Only image files (jpeg, png, webp) and PDF documents are allowed."), false);
        }
    },
});
