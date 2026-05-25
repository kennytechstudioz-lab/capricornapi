"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Blog = void 0;
const mongoose_1 = require("mongoose");
const BlogSchema = new mongoose_1.Schema({
    category: { type: String, required: [true, "Category is required."], trim: true },
    title: { type: String, required: [true, "Title is required."], trim: true },
    subtitle: { type: String, default: "", trim: true },
    picture: { type: String, default: "" },
    author: { type: String, required: [true, "Author is required."], trim: true },
    date: { type: String, required: [true, "Date is required."], trim: true },
    content: { type: String, required: [true, "Content is required."] },
    shortName: { type: String, default: "", trim: true },
    abbreviation: { type: String, default: "", trim: true },
}, { timestamps: true });
exports.Blog = (0, mongoose_1.model)("Blog", BlogSchema);
exports.default = exports.Blog;
