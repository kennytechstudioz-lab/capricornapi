import { Request, Response } from "express";
import { Review } from "../models/Review";
import { User } from "../models/User";

// Helper function to resolve flag emoji from country name
function getFlagEmoji(countryName: string): string {
  if (!countryName) return "🌐";
  const name = countryName.toLowerCase().trim();
  if (name.includes("united states") || name === "us" || name === "usa") return "🇺🇸";
  if (name.includes("united kingdom") || name === "uk" || name === "gb") return "🇬🇧";
  if (name.includes("canada") || name === "ca") return "🇨🇦";
  if (name.includes("germany") || name === "de") return "🇩🇪";
  if (name.includes("france") || name === "fr") return "🇫🇷";
  if (name.includes("australia") || name === "au") return "🇦🇺";
  if (name.includes("singapore") || name === "sg") return "🇸🇬";
  if (name.includes("nigeria") || name === "ng") return "🇳🇬";
  if (name.includes("south africa") || name === "za") return "🇿🇦";
  if (name.includes("india") || name === "in") return "🇮🇳";
  return "🌐";
}

// Controller: Create a review
export async function createReview(req: Request, res: Response) {
  try {
    const { username, content, rating } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username is required to submit a review." });
    }
    if (!content) {
      return res.status(400).json({ error: "Review content is required." });
    }

    const user = await User.findOne({ username: String(username).toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username;
    const country = user.country || "United States";
    const countryFlag = getFlagEmoji(country);
    const userPicture = user.profilePicture || "";

    const review = new Review({
      userId: user._id,
      fullName,
      content,
      rating: Number(rating) || 5,
      country,
      countryFlag,
      userPicture,
      isApproved: false, // Must be approved by Admin first
    });

    await review.save();

    return res.status(201).json({
      success: true,
      message: "Thank you! Your review has been submitted and is pending admin approval.",
      review,
    });
  } catch (error: any) {
    console.error("✗ Error in createReview controller:", error);
    return res.status(500).json({ error: "Internal server error submitting review." });
  }
}

// Controller: Get approved reviews (Public/User view)
export async function getApprovedReviews(req: Request, res: Response) {
  try {
    const reviews = await Review.find({ isApproved: true }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      reviews,
    });
  } catch (error: any) {
    console.error("✗ Error in getApprovedReviews controller:", error);
    return res.status(500).json({ error: "Internal server error retrieving reviews." });
  }
}

// Controller: Get all reviews (Admin view)
export async function getAllReviews(req: Request, res: Response) {
  try {
    const reviews = await Review.find({}).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      reviews,
    });
  } catch (error: any) {
    console.error("✗ Error in getAllReviews controller:", error);
    return res.status(500).json({ error: "Internal server error retrieving all reviews." });
  }
}

// Controller: Approve/Unapprove review
export async function updateReviewApproval(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ error: "Review not found." });
    }

    review.isApproved = Boolean(isApproved);
    await review.save();

    return res.status(200).json({
      success: true,
      message: `Review ${review.isApproved ? "approved" : "unapproved"} successfully.`,
      review,
    });
  } catch (error: any) {
    console.error("✗ Error in updateReviewApproval controller:", error);
    return res.status(500).json({ error: "Internal server error updating review approval status." });
  }
}

// Controller: Delete review
export async function deleteReview(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const review = await Review.findByIdAndDelete(id);
    if (!review) {
      return res.status(404).json({ error: "Review not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully.",
    });
  } catch (error: any) {
    console.error("✗ Error in deleteReview controller:", error);
    return res.status(500).json({ error: "Internal server error deleting review." });
  }
}
