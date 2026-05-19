import { Router } from "express";
import { upload } from "../middlewares/upload";
import { uploadMedia, deleteMedia } from "../controllers/uploadController";

const router = Router();

// Route: POST /api/upload - Accepts "file" field, processes it to memory and pushes to AWS S3
router.post("/", upload.single("file"), uploadMedia);

// Route: DELETE /api/upload - Deletes an image from S3 bucket given its public URL
router.delete("/", deleteMedia);

export default router;
