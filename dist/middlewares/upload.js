"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
// Utilize memory storage to hold files in buffer before streaming to Cloudflare R2
const storage = multer_1.default.memoryStorage();
/**
 * Configure multer middleware limits, storage type, and filter guidelines.
 */
exports.upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 25 * 1024 * 1024, // 25MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/") ||
            file.mimetype === "application/pdf" ||
            /\.(jpe?g|png|webp|svg|gif|ico|pdf|docx?)$/i.test(file.originalname)) {
            cb(null, true);
        }
        else {
            cb(new Error("Only image files (jpeg, png, webp, svg, gif) and documents (pdf, doc, docx) are allowed."));
        }
    },
});
