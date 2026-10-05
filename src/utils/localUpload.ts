import fs from "fs";
import path from "path";

// Resolve local uploads directory at api project root
export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(process.cwd(), "uploads");

// Ensure the directory exists upon initialization
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Saves a file buffer locally into the uploads directory.
 *
 * @param buffer Raw file buffer
 * @param originalName Original file name
 * @returns The saved filename in uploads directory
 */
export async function saveBufferToUploads(
  buffer: Buffer,
  originalName: string
): Promise<string> {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  const ext = path.extname(originalName).toLowerCase();
  const baseName = path
    .basename(originalName, ext)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .substring(0, 50);
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const filename = `${baseName || "media"}-${uniqueSuffix}${ext || ".png"}`;
  const targetPath = path.join(UPLOAD_DIR, filename);

  await fs.promises.writeFile(targetPath, buffer);
  return filename;
}

/**
 * Deletes a media file from the local uploads directory given its URL, path, or filename.
 *
 * @param fileUrlOrName Public URL, relative path, or filename of the asset to delete
 * @returns Promise<boolean> True if file was found and deleted, false otherwise
 */
export async function deleteLocalFile(fileUrlOrName: string): Promise<boolean> {
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
    const safeFilename = path.basename(filename);

    if (!safeFilename || safeFilename === "." || safeFilename === "..") {
      return false;
    }

    const filePath = path.join(UPLOAD_DIR, safeFilename);

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      console.log(`✓ Deleted local upload: ${safeFilename}`);
      return true;
    }

    return false;
  } catch (err) {
    console.error("Local file deletion error:", err);
    return false;
  }
}
