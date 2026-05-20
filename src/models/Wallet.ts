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

// Post-save hook to recalculate user's cumulative totalBalance
WalletSchema.post("save", async function (doc: any) {
  try {
    const username = doc.username;
    if (username) {
      const WalletModel = doc.constructor;
      // Get User model dynamically to avoid circular references/ordering issues
      const UserModel = WalletModel.db.model("User");
      
      const wallets = await WalletModel.find({ username });
      const total = wallets.reduce((sum: number, w: any) => sum + (w.balance || 0), 0);
      
      await UserModel.updateOne(
        { username },
        { totalBalance: total }
      );
      console.log(`[Mongoose Hook] Recalculated and updated totalBalance for user "${username}": $${total}`);
    }
  } catch (err) {
    console.error("✗ Error in Wallet post-save totalBalance sync hook:", err);
  }
});

export const Wallet = model("Wallet", WalletSchema);
export default Wallet;
