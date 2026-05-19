"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Currency = void 0;
const mongoose_1 = require("mongoose");
const CurrencySchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
});
exports.Currency = (0, mongoose_1.model)("Currency", CurrencySchema);
exports.default = exports.Currency;
