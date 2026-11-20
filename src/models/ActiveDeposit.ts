import { Schema, model } from "mongoose";

const ActiveDepositSchema = new Schema(
  {
    currencyId: {
      type: Schema.Types.ObjectId,
      ref: "Currency",
      required: true,
    },
    currencyLogo: {
      type: String,
      default: "",
    },
    currencyName: {
      type: String,
      required: true,
      trim: true,
    },
    currencySymbol: {
      type: String,
      required: true,
      trim: true,
    },
    walletId: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    planDuration: {
      type: Number,
      required: true,
    },
    planName: {
      type: String,
      required: true,
      trim: true,
    },
    planPercentage: {
      type: Number,
      required: true,
    },
    planReferralPercent: {
      type: Number,
      required: true,
    },
    daysRemaining: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    principalReturned: {
      type: Boolean,
      default: false,
    },
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
    },
    lastDecrementedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const ActiveDeposit = model("ActiveDeposit", ActiveDepositSchema);
export default ActiveDeposit;
