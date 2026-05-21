import { Router } from "express";
import {
  createReview,
  adminCreateReview,
  getApprovedReviews,
  getAllReviews,
  updateReviewApproval,
  updateReview,
  deleteReview,
} from "../controllers/reviewController";

const router = Router();

// Route: POST /api/reviews (Submit a new review)
router.post("/", createReview);

// Route: GET /api/reviews (Get approved reviews - Public/Users)
router.get("/", getApprovedReviews);

// Route: GET /api/reviews/admin (Get all reviews - Admins)
router.get("/admin", getAllReviews);

// Route: POST /api/reviews/admin (Admin creates a review with custom data)
router.post("/admin", adminCreateReview);

// Route: PATCH /api/reviews/:id/approve (Approve or unapprove a review)
router.patch("/:id/approve", updateReviewApproval);

// Route: PUT /api/reviews/:id (Edit review fields)
router.put("/:id", updateReview);

// Route: DELETE /api/reviews/:id (Delete a review)
router.delete("/:id", deleteReview);

export default router;
