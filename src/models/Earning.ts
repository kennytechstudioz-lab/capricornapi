import { Schema, model } from "mongoose";

const EarningSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
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
    planName: {
      type: String,
      required: true,
      trim: true,
    },
    planPercent: {
      type: Number,
      required: true,
    },
    earning: {
      type: Number,
      required: true,
    },
    activeDepositId: {
      type: Schema.Types.ObjectId,
      ref: "ActiveDeposit",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Earning = model("Earning", EarningSchema);
export default Earning;
