import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/settingController";

const router = Router();

// Routes mapping for System Settings resource
router.get("/", getSettings);
router.put("/", updateSettings);

export default router;
