import { Schema, model } from "mongoose";

const ReferralSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    referredBy: {
      type: String,
      required: true,
      trim: true,
    },
    commission: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Referral = model("Referral", ReferralSchema);
export default Referral;
