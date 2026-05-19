"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMedia = uploadMedia;
exports.deleteMedia = deleteMedia;
const s3Upload_1 = require("../utils/s3Upload");
/**
 * Controller: Handles a single image file upload and stores it on AWS S3.
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
                error: "No image file provided in the upload request payload.",
            });
        }
        const { buffer, originalname, mimetype } = req.file;
        // 2. Dispatch file stream buffer to AWS S3 bucket
        const publicUrl = await (0, s3Upload_1.uploadToS3)(buffer, originalname, mimetype);
        // 3. Return secure S3 URL resource
        return res.status(200).json({
            success: true,
            url: publicUrl,
            fileName: originalname,
        });
    }
    catch (err) {
        console.error("AWS S3 Upload Error: ", err);
        return res.status(500).json({
            success: false,
            error: err.message || "An unexpected error occurred while uploading to Amazon S3.",
        });
    }
}
/**
 * Controller: Removes an image from AWS S3 bucket given its public URL link.
 *
 * @param req Express Request containing target S3 URL in body
 * @param res Express Response
 */
async function deleteMedia(req, res) {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({
                success: false,
                error: "No image public URL provided in request payload.",
            });
        }
        // Trigger central S3 deletion
        await (0, s3Upload_1.deleteFromS3)(url);
        return res.status(200).json({
            success: true,
            message: "Media object deleted successfully from AWS S3 bucket.",
        });
    }
    catch (err) {
        console.error("AWS S3 Deletion Error: ", err);
        return res.status(500).json({
            success: false,
            error: err.message || "An unexpected error occurred while deleting from Amazon S3.",
        });
    }
}
