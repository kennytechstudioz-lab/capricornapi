"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UPLOAD_DIR = void 0;
exports.saveBufferToUploads = saveBufferToUploads;
exports.deleteLocalFile = deleteLocalFile;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Resolve local uploads directory at api project root
exports.UPLOAD_DIR = process.env.UPLOAD_DIR
    ? path_1.default.resolve(process.env.UPLOAD_DIR)
    : path_1.default.resolve(process.cwd(), "uploads");
// Ensure the directory exists upon initialization
if (!fs_1.default.existsSync(exports.UPLOAD_DIR)) {
    fs_1.default.mkdirSync(exports.UPLOAD_DIR, { recursive: true });
}
/**
 * Saves a file buffer locally into the uploads directory.
 *
 * @param buffer Raw file buffer
 * @param originalName Original file name
 * @returns The saved filename in uploads directory
 */
async function saveBufferToUploads(buffer, originalName) {
    if (!fs_1.default.existsSync(exports.UPLOAD_DIR)) {
        fs_1.default.mkdirSync(exports.UPLOAD_DIR, { recursive: true });
    }
    const ext = path_1.default.extname(originalName).toLowerCase();
    const baseName = path_1.default
        .basename(originalName, ext)
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .substring(0, 50);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${baseName || "media"}-${uniqueSuffix}${ext || ".png"}`;
    const targetPath = path_1.default.join(exports.UPLOAD_DIR, filename);
    await fs_1.default.promises.writeFile(targetPath, buffer);
    return filename;
}
/**
 * Deletes a media file from the local uploads directory given its URL, path, or filename.
 *
 * @param fileUrlOrName Public URL, relative path, or filename of the asset to delete
 * @returns Promise<boolean> True if file was found and deleted, false otherwise
 */
async function deleteLocalFile(fileUrlOrName) {
    try {
        if (!fileUrlOrName || typeof fileUrlOrName !== "string") {
            return false;
        }
        // Ignore remote third-party URLs that are not hosted locally (e.g. legacy S3 or external cdns)
        if (fileUrlOrName.includes("amazonaws.com") || fileUrlOrName.startsWith("blob:") || fileUrlOrName.startsWith("data:")) {
            return false;
        }
        let filename = fileUrlOrName;
        // Handle full URL or relative path with /uploads/
        if (filename.includes("/uploads/")) {
            filename = filename.substring(filename.lastIndexOf("/uploads/") + "/uploads/".length);
        }
        // Strip URL query parameters or hashes
        filename = filename.split("?")[0].split("#")[0];
        // Strip directory traversal characters to ensure safe filename only
        const safeFilename = path_1.default.basename(filename);
        if (!safeFilename || safeFilename === "." || safeFilename === "..") {
            return false;
        }
        const filePath = path_1.default.join(exports.UPLOAD_DIR, safeFilename);
        if (fs_1.default.existsSync(filePath)) {
            await fs_1.default.promises.unlink(filePath);
            console.log(`✓ Deleted local upload: ${safeFilename}`);
            return true;
        }
        return false;
    }
    catch (err) {
        console.error("Local file deletion error:", err);
        return false;
    }
}
