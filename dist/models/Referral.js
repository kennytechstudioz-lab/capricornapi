"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Referral = void 0;
const mongoose_1 = require("mongoose");
const ReferralSchema = new mongoose_1.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
    },
    referredBy: {
        type: String,
        required: true,
        trim: true,
    },
    commission: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});
exports.Referral = (0, mongoose_1.model)("Referral", ReferralSchema);
exports.default = exports.Referral;
