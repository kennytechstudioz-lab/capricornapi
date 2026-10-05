import { Request, Response } from "express";
import { deleteLocalFile, saveBufferToUploads } from "../utils/localUpload";

/**
 * Controller: Handles a single image file upload and stores it in the API upload folder.
 *
 * @param req Express Request object containing the multer-parsed file
 * @param res Express Response object
 */
export async function uploadMedia(req: Request, res: Response) {
  try {
    // 1. Ensure a file exists in the multipart request body
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No image file provided in the upload request payload.",
      });
    }

    let filename = req.file.filename;

    // Fallback if file was uploaded via memory buffer rather than disk
    if (!filename && req.file.buffer) {
      filename = await saveBufferToUploads(req.file.buffer, req.file.originalname);
    }

    // 2. Format public accessible URL
    const protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol || "http";
    const host = req.get("host") || `localhost:${process.env.PORT || 5002}`;
    const baseUrl = process.env.API_BASE_URL || process.env.BASE_URL || `${protocol}://${host}`;

    const publicUrl = `${baseUrl}/uploads/${filename}`;

    // 3. Return public media URL resource
    return res.status(200).json({
      success: true,
      url: publicUrl,
      fileName: req.file.originalname,
      filename: filename,
    });
  } catch (err: any) {
    console.error("API Upload Error: ", err);
    return res.status(500).json({
      success: false,
      error: err.message || "An unexpected error occurred while saving to api upload folder.",
    });
  }
}

/**
 * Controller: Removes an image from the API upload folder given its URL or filename.
 *
 * @param req Express Request containing target URL in body
 * @param res Express Response
 */
export async function deleteMedia(req: Request, res: Response) {
  try {
    const target =
      req.body?.url ||
      req.body?.imageUrl ||
      req.body?.fileName ||
      req.body?.filename;

    if (!target) {
      return res.status(400).json({
        success: false,
        error: "No image URL or filename provided in request payload.",
      });
    }

    // Trigger local upload deletion
    await deleteLocalFile(target);

    return res.status(200).json({
      success: true,
      message: "Media object deleted successfully from upload folder.",
    });
  } catch (err: any) {
    console.error("API Media Deletion Error: ", err);
    return res.status(500).json({
      success: false,
      error: err.message || "An unexpected error occurred while deleting from upload folder.",
    });
  }
}
