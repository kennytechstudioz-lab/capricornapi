import { Router } from "express";
import {
  createEmailTemplate,
  getEmailTemplates,
  updateEmailTemplate,
  deleteEmailTemplate,
} from "../controllers/templateController";

const router = Router();

// Routes mapping for Email Templates resource
router.post("/", createEmailTemplate);
router.get("/", getEmailTemplates);
router.patch("/:id", updateEmailTemplate);
router.delete("/:id", deleteEmailTemplate);

export default router;
