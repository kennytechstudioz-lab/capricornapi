"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBlogs = getAllBlogs;
exports.createBlog = createBlog;
exports.updateBlog = updateBlog;
exports.deleteBlog = deleteBlog;
const Blog_1 = require("../models/Blog");
async function getAllBlogs(req, res) {
    const blogs = await Blog_1.Blog.find().sort({ createdAt: -1 });
    return res.json({ success: true, blogs });
}
async function createBlog(req, res) {
    const { category, title, subtitle, picture, author, date, content } = req.body;
    if (!category || !title || !author || !date || !content)
        return res.status(400).json({ error: "Category, title, author, date, and content are required." });
    const blog = await Blog_1.Blog.create({ category, title, subtitle: subtitle || "", picture: picture || "", author, date, content });
    return res.status(201).json({ success: true, blog });
}
async function updateBlog(req, res) {
    const { id } = req.params;
    const { category, title, subtitle, picture, author, date, content } = req.body;
    const blog = await Blog_1.Blog.findById(id);
    if (!blog)
        return res.status(404).json({ error: "Blog post not found." });
    if (category !== undefined)
        blog.category = String(category).trim();
    if (title !== undefined)
        blog.title = String(title).trim();
    if (subtitle !== undefined)
        blog.subtitle = String(subtitle).trim();
    if (picture !== undefined)
        blog.picture = String(picture);
    if (author !== undefined)
        blog.author = String(author).trim();
    if (date !== undefined)
        blog.date = String(date).trim();
    if (content !== undefined)
        blog.content = String(content);
    await blog.save();
    return res.json({ success: true, blog });
}
async function deleteBlog(req, res) {
    const { id } = req.params;
    const blog = await Blog_1.Blog.findByIdAndDelete(id);
    if (!blog)
        return res.status(404).json({ error: "Blog post not found." });
    return res.json({ success: true, message: "Blog post deleted." });
}
