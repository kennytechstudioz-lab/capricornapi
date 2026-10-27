"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveBufferToUploads = exports.uploadToLocal = exports.UPLOAD_DIR = void 0;
exports.uploadToS3 = uploadToS3;
exports.extractR2Key = extractR2Key;
exports.deleteFromS3 = deleteFromS3;
exports.deleteLocalFile = deleteLocalFile;
const client_s3_1 = require("@aws-sdk/client-s3");
const node_http_handler_1 = require("@smithy/node-http-handler");
const https_1 = __importDefault(require("https"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const PROJECT_NAME = "capricorn";
// Resolve R2 endpoint, bucket, and public base URL
const R2_ENDPOINT = (() => {
    const api = process.env.CLOUDFLARE_S3_API || "";
    try {
        const url = new URL(api);
        return `${url.protocol}//${url.hostname}`;
    }
    catch {
        return process.env.CLOUDFLARE_ACCOUNT_ID
            ? `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`
            : "";
    }
})();
const R2_BUCKET = (() => {
    const api = process.env.CLOUDFLARE_S3_API || "";
    try {
        return new URL(api).pathname.replace(/^\//, "").split("/")[0] || "schooling-social";
    }
    catch {
        return "schooling-social";
    }
})();
const PUBLIC_BASE_URL = (process.env.CLOUDFLARE_PUBLIC_URL || "").replace(/\/+$/, "");
// Resolve local uploads directory at api project root
exports.UPLOAD_DIR = process.env.UPLOAD_DIR
    ? path_1.default.resolve(process.env.UPLOAD_DIR)
    : path_1.default.resolve(process.cwd(), "uploads");
if (!fs_1.default.existsSync(exports.UPLOAD_DIR)) {
    fs_1.default.mkdirSync(exports.UPLOAD_DIR, { recursive: true });
}
// Lazy-initialize S3 client
let s3Client = null;
function getS3Client() {
    if (!s3Client) {
        const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID;
        const secretAccessKey = process.env.CLOUDFLARE_SECRETE_ACCESS_KEY || process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
        if (accessKeyId && secretAccessKey && R2_ENDPOINT) {
            s3Client = new client_s3_1.S3Client({
                region: "auto",
                endpoint: R2_ENDPOINT,
                credentials: {
                    accessKeyId,
                    secretAccessKey,
                },
                requestHandler: new node_http_handler_1.NodeHttpHandler({
                    httpsAgent: new https_1.default.Agent({ autoSelectFamily: false }),
                }),
            });
        }
    }
    return s3Client;
}
function getMimeType(ext) {
    const cleanExt = ext.toLowerCase().replace(/^\./, "");
    switch (cleanExt) {
        case "png":
            return "image/png";
        case "jpg":
        case "jpeg":
            return "image/jpeg";
        case "webp":
            return "image/webp";
        case "svg":
            return "image/svg+xml";
        case "gif":
            return "image/gif";
        case "pdf":
            return "application/pdf";
        default:
            return "application/octet-stream";
    }
}
/**
 * Uploads a file buffer directly to Cloudflare R2 (or fallback to local disk).
 */
async function uploadToS3(fileBuffer, originalName, mimeType, hostUrl) {
    const ext = path_1.default.extname(originalName).toLowerCase();
    const baseName = path_1.default
        .basename(originalName, ext)
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .substring(0, 50);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const cleanFilename = `${baseName || "media"}-${uniqueSuffix}${ext || ".png"}`;
    const client = getS3Client();
    // 1. Upload to Cloudflare R2 if credentials are provided
    if (client && PUBLIC_BASE_URL) {
        const key = `${PROJECT_NAME}/uploads/${cleanFilename}`;
        const contentType = mimeType || getMimeType(ext);
        await client.send(new client_s3_1.PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            Body: fileBuffer,
            ContentType: contentType,
            CacheControl: "public, max-age=31536000",
        }));
        const publicUrl = `${PUBLIC_BASE_URL}/${key}`;
        console.log(`✓ [R2 Upload] File uploaded to Cloudflare R2: ${publicUrl}`);
        return publicUrl;
    }
    // 2. Fallback to local uploads directory
    if (!fs_1.default.existsSync(exports.UPLOAD_DIR)) {
        fs_1.default.mkdirSync(exports.UPLOAD_DIR, { recursive: true });
    }
    const targetPath = path_1.default.join(exports.UPLOAD_DIR, cleanFilename);
    await fs_1.default.promises.writeFile(targetPath, fileBuffer);
    const baseUrl = process.env.API_BASE_URL ||
        process.env.BASE_URL ||
        hostUrl ||
        `http://localhost:${process.env.PORT || 5002}`;
    const localUrl = `${baseUrl.replace(/\/+$/, "")}/uploads/${cleanFilename}`;
    console.log(`✓ [Local Upload] File saved to disk: ${localUrl}`);
    return localUrl;
}
/**
 * Extract R2 object key from URL or key string
 */
function extractR2Key(urlOrKey) {
    if (!urlOrKey || typeof urlOrKey !== "string")
        return null;
    let clean = urlOrKey.trim();
    if (clean.startsWith("http://") || clean.startsWith("https://")) {
        try {
            const u = new URL(clean);
            clean = u.pathname;
        }
        catch {
            clean = clean.replace(/^https?:\/\/[^\/]+/, "");
        }
    }
    clean = clean.split("?")[0].split("#")[0].replace(/^\/+/, "");
    if (R2_BUCKET && clean.startsWith(`${R2_BUCKET}/`)) {
        clean = clean.slice(R2_BUCKET.length + 1);
    }
    return clean || null;
}
/**
 * Deletes an object from Cloudflare R2 (or fallback local disk).
 */
async function deleteFromS3(fileUrlOrKey) {
    if (!fileUrlOrKey || typeof fileUrlOrKey !== "string")
        return false;
    const client = getS3Client();
    // If it's a Cloudflare R2 URL or key
    if (client &&
        (fileUrlOrKey.includes(".r2.dev") ||
            fileUrlOrKey.includes("r2.cloudflarestorage.com") ||
            fileUrlOrKey.includes(`${PROJECT_NAME}/uploads/`))) {
        const key = extractR2Key(fileUrlOrKey);
        if (key) {
            try {
                await client.send(new client_s3_1.DeleteObjectCommand({
                    Bucket: R2_BUCKET,
                    Key: key,
                }));
                console.log(`✓ [R2 Delete] Object deleted from Cloudflare R2: ${key}`);
                return true;
            }
            catch (err) {
                console.error(`✗ [R2 Delete] Error deleting key ${key}:`, err);
                return false;
            }
        }
    }
    // Fallback to local cleanup
    return deleteLocalFile(fileUrlOrKey);
}
/**
 * Deletes a file safely from local uploads directory if present.
 */
async function deleteLocalFile(fileUrlOrName) {
    if (!fileUrlOrName || typeof fileUrlOrName !== "string")
        return false;
    if (fileUrlOrName.includes(".r2.dev") || fileUrlOrName.includes("r2.cloudflarestorage.com")) {
        return deleteFromS3(fileUrlOrName);
    }
    try {
        let filename = fileUrlOrName;
        if (filename.includes("/uploads/")) {
            filename = filename.substring(filename.lastIndexOf("/uploads/") + "/uploads/".length);
        }
        filename = path_1.default.basename(filename.split("?")[0].split("#")[0]);
        if (!filename || filename === "." || filename === "..")
            return false;
        const filePath = path_1.default.join(exports.UPLOAD_DIR, filename);
        if (fs_1.default.existsSync(filePath)) {
            await fs_1.default.promises.unlink(filePath);
            console.log(`✓ [Local Delete] Deleted local file: ${filename}`);
            return true;
        }
        return false;
    }
    catch (err) {
        console.error("Local file deletion error:", err);
        return false;
    }
}
// Backwards-compatible aliases
exports.uploadToLocal = uploadToS3;
const saveBufferToUploads = async (buffer, originalName) => {
    return uploadToS3(buffer, originalName);
};
exports.saveBufferToUploads = saveBufferToUploads;
