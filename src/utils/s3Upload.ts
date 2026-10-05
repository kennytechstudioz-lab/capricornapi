import { saveBufferToUploads, deleteLocalFile } from "./localUpload";

/**
 * Legacy S3 upload adapter - now redirects all uploads to the local API uploads folder.
 */
export async function uploadToS3(
  fileBuffer: Buffer,
  fileName: string,
  _mimeType?: string
): Promise<string> {
  const savedFilename = await saveBufferToUploads(fileBuffer, fileName);
  const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5002}`;
  return `${baseUrl}/uploads/${savedFilename}`;
}

/**
 * Legacy S3 deletion adapter - now redirects deletion to the local API uploads folder.
 */
export async function deleteFromS3(fileUrl: string): Promise<void> {
  await deleteLocalFile(fileUrl);
}
