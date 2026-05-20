"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    username: {
        type: String,
        required: [true, "Username is required."],
        unique: true,
        trim: true,
        validate: {
            validator: function (v) {
                return !v.includes(" ");
            },
            message: "Username must not contain any spaces.",
        },
    },
    email: {
        type: String,
        required: [true, "Email address is required."],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            "Please provide a valid email address.",
        ],
    },
    password: {
        type: String,
        required: [true, "Password is required."],
    },
    role: {
        type: String,
        enum: ["user", "staff"],
        default: "user",
    },
    status: {
        type: String,
        enum: ["Active", "Suspended"],
        default: "Active",
    },
    balance: {
        type: Number,
        default: 0.0,
    },
    totalBalance: {
        type: Number,
        default: 0.0,
    },
    passKey: {
        type: String,
    },
    profilePicture: {
        type: String,
    },
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    dateOfBirth: {
        type: Date,
    },
    gender: {
        type: String,
    },
    maritalStatus: {
        type: String,
    },
    country: {
        type: String,
    },
    occupation: {
        type: String,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
exports.User = (0, mongoose_1.model)("User", UserSchema);
exports.default = exports.User;
