"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActiveDeposit = void 0;
const mongoose_1 = require("mongoose");
const ActiveDepositSchema = new mongoose_1.Schema({
    currencyId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
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
    transactionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Transaction",
        required: true,
    },
    lastDecrementedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});
exports.ActiveDeposit = (0, mongoose_1.model)("ActiveDeposit", ActiveDepositSchema);
exports.default = exports.ActiveDeposit;
