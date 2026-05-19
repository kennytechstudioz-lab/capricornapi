"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const planController_1 = require("../controllers/planController");
const router = (0, express_1.Router)();
// Route: POST /api/plans (Create an investment plan)
router.post("/", planController_1.createPlan);
// Route: GET /api/plans (Retrieve all active plans)
router.get("/", planController_1.getPlans);
// Route: PATCH /api/plans/:id (Update an existing investment plan)
router.patch("/:id", planController_1.updatePlan);
exports.default = router;
