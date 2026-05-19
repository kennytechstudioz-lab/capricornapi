"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_1 = require("../middlewares/upload");
const uploadController_1 = require("../controllers/uploadController");
const router = (0, express_1.Router)();
// Route: POST /api/upload - Accepts "file" field, processes it to memory and pushes to AWS S3
router.post("/", upload_1.upload.single("file"), uploadController_1.uploadMedia);
// Route: DELETE /api/upload - Deletes an image from S3 bucket given its public URL
router.delete("/", uploadController_1.deleteMedia);
exports.default = router;
