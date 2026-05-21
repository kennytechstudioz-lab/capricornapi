import { Router } from "express";
import { createPlan, getPlans, updatePlan, deletePlan } from "../controllers/planController";

const router = Router();

// Route: POST /api/plans (Create an investment plan)
router.post("/", createPlan);

// Route: GET /api/plans (Retrieve all active plans)
router.get("/", getPlans);

// Route: PATCH /api/plans/:id (Update an existing investment plan)
router.patch("/:id", updatePlan);

// Route: DELETE /api/plans/:id (Delete an existing investment plan)
router.delete("/:id", deletePlan);

export default router;
