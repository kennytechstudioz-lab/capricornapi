"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
const mongoose_1 = require("mongoose");
const TransactionSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
});
exports.Transaction = (0, mongoose_1.model)("Transaction", TransactionSchema);
exports.default = exports.Transaction;
