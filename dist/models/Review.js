"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Review = void 0;
const mongoose_1 = require("mongoose");
const ReviewSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: false,
    },
    fullName: {
        type: String,
        required: [true, "Full name is required."],
    },
    content: {
        type: String,
        required: [true, "Review content is required."],
    },
    rating: {
        type: Number,
        required: [true, "Rating is required."],
        min: 1,
        max: 5,
        default: 5,
    },
    country: {
        type: String,
    },
    countryFlag: {
        type: String,
    },
    userPicture: {
        type: String,
    },
    isApproved: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
exports.Review = (0, mongoose_1.model)("Review", ReviewSchema);
exports.default = exports.Review;
