"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reviewController_1 = require("../controllers/reviewController");
const router = (0, express_1.Router)();
// Route: POST /api/reviews (Submit a new review)
router.post("/", reviewController_1.createReview);
// Route: GET /api/reviews (Get approved reviews - Public/Users)
router.get("/", reviewController_1.getApprovedReviews);
// Route: GET /api/reviews/admin (Get all reviews - Admins)
router.get("/admin", reviewController_1.getAllReviews);
// Route: PATCH /api/reviews/:id/approve (Approve or unapprove a review)
router.patch("/:id/approve", reviewController_1.updateReviewApproval);
// Route: DELETE /api/reviews/:id (Delete a review)
router.delete("/:id", reviewController_1.deleteReview);
exports.default = router;
