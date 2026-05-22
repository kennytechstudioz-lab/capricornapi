"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Term = void 0;
const mongoose_1 = require("mongoose");
const TermSchema = new mongoose_1.Schema({
    category: {
        type: String,
        required: [true, "Category is required."],
        enum: ["terms", "policy"],
        trim: true,
    },
    content: {
        type: String,
        required: [true, "Content is required."],
        trim: true,
    },
}, { timestamps: true });
exports.Term = (0, mongoose_1.model)("Term", TermSchema);
exports.default = exports.Term;
