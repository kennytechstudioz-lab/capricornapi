import { Schema, model } from "mongoose";

const WalletSchema = new Schema(
  {
    currencyId: {
      type: Schema.Types.ObjectId,
      ref: "Currency",
      required: true,
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
    currencyLogo: {
      type: String,
      default: "",
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    balance: {
      type: Number,
      default: 0.0,
    },
    totalDeposit: {
      type: Number,
      default: 0.0,
    },
    totalWithdrawal: {
      type: Number,
      default: 0.0,
    },
    activeDeposit: {
      type: Number,
      default: 0.0,
    },
  },
  {
    timestamps: true,
  }
);

export const Wallet = model("Wallet", WalletSchema);
export default Wallet;
