"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMedia = uploadMedia;
exports.deleteMedia = deleteMedia;
const s3Upload_1 = require("../utils/s3Upload");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Controller: Handles media file upload directly to Cloudflare R2 (with local fallback).
 *
 * @param req Express Request object containing the multer-parsed file
 * @param res Express Response object
 */
async function uploadMedia(req, res) {
    try {
        // 1. Ensure a file exists in the multipart request body
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "No file provided in the upload request payload.",
            });
        }
        const fileBuffer = req.file.buffer || (req.file.path ? await fs_1.default.promises.readFile(req.file.path) : null);
        if (!fileBuffer) {
            return res.status(400).json({
                success: false,
                error: "Unable to read uploaded file buffer.",
            });
        }
        const hostUrl = `${req.protocol}://${req.get("host")}`;
        // 2. Upload to Cloudflare R2
        const publicUrl = await (0, s3Upload_1.uploadToS3)(fileBuffer, req.file.originalname, req.file.mimetype, hostUrl);
        // 3. Return public media URL resource
        return res.status(200).json({
            success: true,
            url: publicUrl,
            fileName: req.file.originalname,
            filename: path_1.default.basename(publicUrl),
        });
    }
    catch (err) {
        console.error("API Upload Error: ", err);
        return res.status(500).json({
            success: false,
            error: err.message || "An unexpected error occurred while saving the upload.",
        });
    }
}
/**
 * Controller: Removes an image from Cloudflare R2 or local storage given its URL or filename.
 *
 * @param req Express Request containing target URL in body
 * @param res Express Response
 */
async function deleteMedia(req, res) {
    try {
        const target = req.body?.url ||
            req.body?.imageUrl ||
            req.body?.fileName ||
            req.body?.filename;
        if (!target) {
            return res.status(400).json({
                success: false,
                error: "No image URL or filename provided in request payload.",
            });
        }
        await (0, s3Upload_1.deleteFromS3)(target);
        return res.status(200).json({
            success: true,
            message: "Media object deleted successfully.",
        });
    }
    catch (err) {
        console.error("API Media Deletion Error: ", err);
        return res.status(500).json({
            success: false,
            error: err.message || "An unexpected error occurred while deleting media object.",
        });
    }
}
