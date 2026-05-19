import { Schema, model } from "mongoose";

const CurrencySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Currency name is required."],
      unique: true,
      trim: true,
    },
    symbol: {
      type: String,
      required: [true, "Currency symbol is required."],
      uppercase: true,
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      required: [true, "Currency wallet address is required."],
      trim: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Currency = model("Currency", CurrencySchema);
export default Currency;
