import { Router } from "express";
import { upload } from "../middlewares/upload";
import { uploadMedia, deleteMedia } from "../controllers/uploadController";

const router = Router();

// Route: POST /api/upload - Accepts "file" field, processes it and stores in the API upload folder
router.post("/", upload.single("file"), uploadMedia);

// Route: DELETE /api/upload - Deletes an image from the API upload folder given its public URL or filename
router.delete("/", deleteMedia);

export default router;
