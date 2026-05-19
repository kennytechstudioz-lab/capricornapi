"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationTemplate = void 0;
const mongoose_1 = require("mongoose");
const NotificationTemplateSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Template name is required."],
        unique: true,
        trim: true,
    },
    title: {
        type: String,
        required: [true, "Template title is required."],
        trim: true,
    },
    content: {
        type: String,
        required: [true, "Template content is required."],
        trim: true,
    },
}, {
    timestamps: true,
});
exports.NotificationTemplate = (0, mongoose_1.model)("NotificationTemplate", NotificationTemplateSchema);
exports.default = exports.NotificationTemplate;
