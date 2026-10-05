"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const localUpload_1 = require("../utils/localUpload");
// Configure disk storage to store uploaded files directly in the api uploads folder
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        if (!fs_1.default.existsSync(localUpload_1.UPLOAD_DIR)) {
            fs_1.default.mkdirSync(localUpload_1.UPLOAD_DIR, { recursive: true });
        }
        cb(null, localUpload_1.UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        const baseName = path_1.default
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
exports.upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/") ||
            file.mimetype === "application/pdf" ||
            /\.(jpe?g|png|webp|svg|gif|ico|pdf)$/i.test(file.originalname)) {
            cb(null, true);
        }
        else {
            cb(new Error("Only image files (jpeg, png, webp, svg, gif) and PDF documents are allowed."));
        }
    },
});
