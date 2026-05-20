"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Earning = void 0;
const mongoose_1 = require("mongoose");
const EarningSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "ActiveDeposit",
        required: true,
    },
}, {
    timestamps: true,
});
exports.Earning = (0, mongoose_1.model)("Earning", EarningSchema);
exports.default = exports.Earning;
