import { Router } from "express";
import { submitContactForm } from "../controllers/contactController";

const router = Router();

router.post("/", submitContactForm);

export default router;
