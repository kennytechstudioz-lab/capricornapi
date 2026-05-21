"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Faq = void 0;
const mongoose_1 = require("mongoose");
const FaqSchema = new mongoose_1.Schema({
    category: { type: String, required: [true, "Category is required."], trim: true },
    question: { type: String, required: [true, "Question is required."], trim: true },
    answer: { type: String, required: [true, "Answer is required."], trim: true },
}, { timestamps: true });
exports.Faq = (0, mongoose_1.model)("Faq", FaqSchema);
exports.default = exports.Faq;
