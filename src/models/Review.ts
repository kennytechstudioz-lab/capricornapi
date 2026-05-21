import { Schema, model } from "mongoose";

const ReviewSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

export const Review = model("Review", ReviewSchema);
export default Review;
