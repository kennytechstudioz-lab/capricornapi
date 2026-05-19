"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Wallet = void 0;
const mongoose_1 = require("mongoose");
const WalletSchema = new mongoose_1.Schema({
    currencyId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        lowercase: true,
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
}, {
    timestamps: true,
});
exports.Wallet = (0, mongoose_1.model)("Wallet", WalletSchema);
exports.default = exports.Wallet;
