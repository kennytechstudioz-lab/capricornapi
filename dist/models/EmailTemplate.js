"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailTemplate = void 0;
const mongoose_1 = require("mongoose");
const EmailTemplateSchema = new mongoose_1.Schema({
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
    greeting: {
        type: String,
        default: "Hi {{username}},",
        trim: true,
    },
    content: {
        type: String,
        required: [true, "Template content is required."],
        trim: true,
    },
    banner: {
        type: String,
        default: "",
        trim: true,
    },
}, {
    timestamps: true,
});
exports.EmailTemplate = (0, mongoose_1.model)("EmailTemplate", EmailTemplateSchema);
exports.default = exports.EmailTemplate;
