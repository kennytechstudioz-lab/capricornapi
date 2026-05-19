"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const mongoose_1 = require("mongoose");
const NotificationSchema = new mongoose_1.Schema({
    username: {
        type: String,
        required: [true, "Username is required."],
        lowercase: true,
        index: true,
        trim: true,
    },
    notificationName: {
        type: String,
        required: [true, "Notification system identifier name is required."],
        trim: true,
    },
    notificationTitle: {
        type: String,
        required: [true, "Notification title is required."],
        trim: true,
    },
    content: {
        type: String,
        required: [true, "Notification body content is required."],
        trim: true,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    isAdminRead: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
exports.Notification = (0, mongoose_1.model)("Notification", NotificationSchema);
exports.default = exports.Notification;
