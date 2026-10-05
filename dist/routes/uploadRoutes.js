"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_1 = require("../middlewares/upload");
const uploadController_1 = require("../controllers/uploadController");
const router = (0, express_1.Router)();
// Route: POST /api/upload - Accepts "file" field, processes it and stores in the API upload folder
router.post("/", upload_1.upload.single("file"), uploadController_1.uploadMedia);
// Route: DELETE /api/upload - Deletes an image from the API upload folder given its public URL or filename
router.delete("/", uploadController_1.deleteMedia);
exports.default = router;
