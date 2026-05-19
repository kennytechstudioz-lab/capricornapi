"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToS3 = uploadToS3;
exports.deleteFromS3 = deleteFromS3;
const client_s3_1 = require("@aws-sdk/client-s3");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Initialize the Amazon S3 Client with security credentials from environmental keys
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
});
/**
 * Uploads a raw file buffer directly to the configured AWS S3 bucket.
 *
 * @param fileBuffer The binary file buffer from multer memory storage
 * @param fileName Original file name to append to the S3 bucket path key
 * @param mimeType Targeted file mimetype (e.g. image/jpeg, image/png)
 * @returns The fully qualified, public-accessible HTTPS S3 URL on success
 */
async function uploadToS3(fileBuffer, fileName, mimeType) {
    const bucketName = process.env.AWS_S3_BUCKET_NAME || "kenny-tech";
    const region = process.env.AWS_REGION || "us-east-1";
    // Format clean bucket key under capricorn/ directory folder to avoid collision
    const cleanFileName = fileName.replace(/\s+/g, "_");
    const key = `capricorn/${Date.now()}-${cleanFileName}`;
    const command = new client_s3_1.PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
        ACL: "public-read", // Requests public read permissions for standard assets
    });
    await s3Client.send(command);
    // Return the public HTTPS URL for the uploaded media asset
    return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}
/**
 * Deletes an object from the S3 bucket given its public URL link.
 *
 * @param fileUrl The fully qualified public HTTPS S3 URL of the asset
 */
async function deleteFromS3(fileUrl) {
    try {
        const bucketName = process.env.AWS_S3_BUCKET_NAME || "kenny-tech";
        // Extract key after the AWS domain link endpoint
        const urlParts = fileUrl.split(".amazonaws.com/");
        if (urlParts.length < 2)
            return;
        const key = decodeURIComponent(urlParts[1]);
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
        });
        await s3Client.send(command);
    }
    catch (err) {
        console.error("AWS S3 Deletion Error: ", err);
        throw err;
    }
}
