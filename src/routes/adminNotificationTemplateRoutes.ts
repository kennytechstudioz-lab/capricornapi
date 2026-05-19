import { Router } from "express";
import {
  createNotificationTemplate,
  getNotificationTemplates,
  updateNotificationTemplate,
  deleteNotificationTemplate,
} from "../controllers/templateController";

const router = Router();

// Routes mapping for Notification Templates resource
router.post("/", createNotificationTemplate);
router.get("/", getNotificationTemplates);
router.patch("/:id", updateNotificationTemplate);
router.delete("/:id", deleteNotificationTemplate);

export default router;
