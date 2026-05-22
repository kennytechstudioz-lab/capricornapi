import { Router } from "express";
import { getAllTerms, createTerm, updateTerm, deleteTerm } from "../controllers/termController";

const router = Router();

router.get("/", getAllTerms);
router.post("/", createTerm);
router.put("/:id", updateTerm);
router.delete("/:id", deleteTerm);

export default router;
