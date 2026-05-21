import { Router } from "express";
import { getAllFaqs, createFaq, updateFaq, deleteFaq } from "../controllers/faqController";

const router = Router();

router.get("/", getAllFaqs);
router.post("/", createFaq);
router.put("/:id", updateFaq);
router.delete("/:id", deleteFaq);

export default router;
