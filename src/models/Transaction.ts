import { Schema, model } from "mongoose";

const TransactionSchema = new Schema(
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
    planDuration: {
      type: Number,
      required: false,
    },
    planPercentage: {
      type: Number,
      required: false,
    },
    planReferralPercent: {
      type: Number,
      required: false,
    },
    amount: {
      type: Number,
      required: true,
    },
    transactionType: {
      type: String,
      required: true,
      enum: ["deposit", "withdrawal", "referral", "bonus", "capital_access", "funding"],
      default: "deposit",
    },
    method: {
      type: String,
      required: true,
      enum: ["direct", "balance"],
      default: "direct",
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "completed", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export const Transaction = model("Transaction", TransactionSchema);
export default Transaction;
