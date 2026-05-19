"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Plan = void 0;
const mongoose_1 = require("mongoose");
const PlanSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Plan name is required."],
        unique: true,
        trim: true,
    },
    percent: {
        type: Number,
        required: [true, "Investment percentage yield is required."],
    },
    duration: {
        type: Number,
        required: [true, "Investment duration (days) is required."],
    },
    min: {
        type: Number,
        required: [true, "Minimum investment amount is required."],
    },
    max: {
        type: Number,
        required: [true, "Maximum investment amount is required."],
    },
    referralPercent: {
        type: Number,
        required: [true, "Referral percentage reward is required."],
    },
    picture: {
        type: String,
        default: "",
    },
    benefits: {
        type: [String],
        default: [],
    },
    description: {
        type: String,
        required: [true, "Plan description is required."],
    },
}, {
    timestamps: true,
});
exports.Plan = (0, mongoose_1.model)("Plan", PlanSchema);
exports.default = exports.Plan;
