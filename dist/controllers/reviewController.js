"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCreateReview = adminCreateReview;
exports.createReview = createReview;
exports.getApprovedReviews = getApprovedReviews;
exports.getAllReviews = getAllReviews;
exports.updateReviewApproval = updateReviewApproval;
exports.updateReview = updateReview;
exports.deleteReview = deleteReview;
const Review_1 = require("../models/Review");
const User_1 = require("../models/User");
// Helper function to resolve flag emoji from country name
function getFlagEmoji(countryName) {
    if (!countryName)
        return "🌐";
    const name = countryName.toLowerCase().trim();
    if (name.includes("united states") || name === "us" || name === "usa")
        return "🇺🇸";
    if (name.includes("united kingdom") || name === "uk" || name === "gb")
        return "🇬🇧";
    if (name.includes("canada") || name === "ca")
        return "🇨🇦";
    if (name.includes("germany") || name === "de")
        return "🇩🇪";
    if (name.includes("france") || name === "fr")
        return "🇫🇷";
    if (name.includes("australia") || name === "au")
        return "🇦🇺";
    if (name.includes("singapore") || name === "sg")
        return "🇸🇬";
    if (name.includes("nigeria") || name === "ng")
        return "🇳🇬";
    if (name.includes("south africa") || name === "za")
        return "🇿🇦";
    if (name.includes("india") || name === "in")
        return "🇮🇳";
    return "🌐";
}
// Controller: Admin direct review creation (custom reviewer data, no user lookup)
async function adminCreateReview(req, res) {
    try {
        const { fullName, content, rating, country, countryFlag, userPicture } = req.body;
        if (!fullName) {
            return res.status(400).json({ error: "Reviewer full name is required." });
        }
        if (!content) {
            return res.status(400).json({ error: "Review content is required." });
        }
        const review = new Review_1.Review({
            fullName: String(fullName).trim(),
            content: String(content).trim(),
            rating: Math.min(5, Math.max(1, Number(rating) || 5)),
            country: country || "",
            countryFlag: countryFlag || "",
            userPicture: userPicture || "",
            isApproved: true,
        });
        await review.save();
        return res.status(201).json({
            success: true,
            message: "Review created and published successfully.",
            review,
        });
    }
    catch (error) {
        console.error("✗ Error in adminCreateReview controller:", error);
        return res.status(500).json({ error: "Internal server error creating review." });
    }
}
// Controller: Create a review
async function createReview(req, res) {
    try {
        const { username, content, rating } = req.body;
        if (!username) {
            return res.status(400).json({ error: "Username is required to submit a review." });
        }
        if (!content) {
            return res.status(400).json({ error: "Review content is required." });
        }
        const user = await User_1.User.findOne({ username: String(username).toLowerCase() });
        if (!user) {
            return res.status(404).json({ error: "User profile not found." });
        }
        const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username;
        const country = user.country || "United States";
        const countryFlag = getFlagEmoji(country);
        const userPicture = user.profilePicture || "";
        const review = new Review_1.Review({
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
    }
    catch (error) {
        console.error("✗ Error in createReview controller:", error);
        return res.status(500).json({ error: "Internal server error submitting review." });
    }
}
// Controller: Get approved reviews (Public/User view)
async function getApprovedReviews(req, res) {
    try {
        const reviews = await Review_1.Review.find({ isApproved: true }).sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            reviews,
        });
    }
    catch (error) {
        console.error("✗ Error in getApprovedReviews controller:", error);
        return res.status(500).json({ error: "Internal server error retrieving reviews." });
    }
}
// Controller: Get all reviews (Admin view)
async function getAllReviews(req, res) {
    try {
        const reviews = await Review_1.Review.find({}).sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            reviews,
        });
    }
    catch (error) {
        console.error("✗ Error in getAllReviews controller:", error);
        return res.status(500).json({ error: "Internal server error retrieving all reviews." });
    }
}
// Controller: Approve/Unapprove review
async function updateReviewApproval(req, res) {
    try {
        const { id } = req.params;
        const { isApproved } = req.body;
        const review = await Review_1.Review.findById(id);
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
    }
    catch (error) {
        console.error("✗ Error in updateReviewApproval controller:", error);
        return res.status(500).json({ error: "Internal server error updating review approval status." });
    }
}
// Controller: Update review fields (Admin edit)
async function updateReview(req, res) {
    try {
        const { id } = req.params;
        const { fullName, content, rating, country, countryFlag, userPicture } = req.body;
        const review = await Review_1.Review.findById(id);
        if (!review) {
            return res.status(404).json({ error: "Review not found." });
        }
        if (fullName !== undefined)
            review.fullName = String(fullName).trim();
        if (content !== undefined)
            review.content = String(content).trim();
        if (rating !== undefined)
            review.rating = Math.min(5, Math.max(1, Number(rating)));
        if (country !== undefined)
            review.country = country;
        if (countryFlag !== undefined)
            review.countryFlag = countryFlag;
        if (userPicture !== undefined)
            review.userPicture = userPicture;
        await review.save();
        return res.status(200).json({
            success: true,
            message: "Review updated successfully.",
            review,
        });
    }
    catch (error) {
        console.error("✗ Error in updateReview controller:", error);
        return res.status(500).json({ error: "Internal server error updating review." });
    }
}
// Controller: Delete review
async function deleteReview(req, res) {
    try {
        const { id } = req.params;
        const review = await Review_1.Review.findByIdAndDelete(id);
        if (!review) {
            return res.status(404).json({ error: "Review not found." });
        }
        return res.status(200).json({
            success: true,
            message: "Review deleted successfully.",
        });
    }
    catch (error) {
        console.error("✗ Error in deleteReview controller:", error);
        return res.status(500).json({ error: "Internal server error deleting review." });
    }
}
