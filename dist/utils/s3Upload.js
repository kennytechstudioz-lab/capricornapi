"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToS3 = uploadToS3;
exports.deleteFromS3 = deleteFromS3;
const localUpload_1 = require("./localUpload");
/**
 * Legacy S3 upload adapter - now redirects all uploads to the local API uploads folder.
 */
async function uploadToS3(fileBuffer, fileName, _mimeType) {
    const savedFilename = await (0, localUpload_1.saveBufferToUploads)(fileBuffer, fileName);
    const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5002}`;
    return `${baseUrl}/uploads/${savedFilename}`;
}
/**
 * Legacy S3 deletion adapter - now redirects deletion to the local API uploads folder.
 */
async function deleteFromS3(fileUrl) {
    await (0, localUpload_1.deleteLocalFile)(fileUrl);
}
