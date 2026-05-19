import { Router } from "express";
import { createPlan, getPlans, updatePlan } from "../controllers/planController";

const router = Router();

// Route: POST /api/plans (Create an investment plan)
router.post("/", createPlan);

// Route: GET /api/plans (Retrieve all active plans)
router.get("/", getPlans);

// Route: PATCH /api/plans/:id (Update an existing investment plan)
router.patch("/:id", updatePlan);

export default router;
