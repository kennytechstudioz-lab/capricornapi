import { Schema, model } from "mongoose";

const PlanSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Plan name is required."],
      unique: true,
      trim: true,
    },
    percent: {
      type: Number,
      required: [true, "Investment percentage yield is required."],
    },
    duration: {
      type: Number,
      required: [true, "Investment duration (days) is required."],
    },
    min: {
      type: Number,
      required: [true, "Minimum investment amount is required."],
    },
    max: {
      type: Number,
      required: [true, "Maximum investment amount is required."],
    },
    referralPercent: {
      type: Number,
      required: [true, "Referral percentage reward is required."],
    },
    picture: {
      type: String,
      default: "",
    },
    benefits: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      required: [true, "Plan description is required."],
    },
  },
  {
    timestamps: true,
  }
);

export const Plan = model("Plan", PlanSchema);
export default Plan;
