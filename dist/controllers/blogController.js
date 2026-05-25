"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBlogs = getAllBlogs;
exports.getBlogById = getBlogById;
exports.createBlog = createBlog;
exports.updateBlog = updateBlog;
exports.deleteBlog = deleteBlog;
const Blog_1 = require("../models/Blog");
function getAbbreviation(title) {
    const cleanTitle = title.trim();
    if (cleanTitle.toLowerCase().includes("caspian sea"))
        return "Caspian Pipeline";
    if (cleanTitle.toLowerCase().includes("niger delta"))
        return "Niger Delta Refinery";
    if (cleanTitle.toLowerCase().includes("persian gulf"))
        return "Persian Gulf LNG";
    if (cleanTitle.toLowerCase().includes("alberta"))
        return "Alberta Carbon";
    if (cleanTitle.toLowerCase().includes("permian basin"))
        return "Permian Basin EOR";
    const words = cleanTitle.split(/\s+/);
    if (words.length <= 3)
        return cleanTitle;
    return words.slice(0, 3).join(" ");
}
async function getAllBlogs(req, res) {
    const blogs = await Blog_1.Blog.find().sort({ createdAt: -1 });
    let mutated = false;
    for (const blog of blogs) {
        if (blog.category === "Project" && !blog.get("abbreviation")) {
            blog.set("abbreviation", getAbbreviation(blog.title));
            await blog.save();
            mutated = true;
        }
    }
    const finalBlogs = mutated ? await Blog_1.Blog.find().sort({ createdAt: -1 }) : blogs;
    return res.json({ success: true, blogs: finalBlogs });
}
async function getBlogById(req, res) {
    const blog = await Blog_1.Blog.findById(req.params.id);
    if (!blog)
        return res.status(404).json({ error: "Blog post not found." });
    if (blog.category === "Project" && !blog.get("abbreviation")) {
        blog.set("abbreviation", getAbbreviation(blog.title));
        await blog.save();
    }
    return res.json({ success: true, blog });
}
async function createBlog(req, res) {
    const { category, title, subtitle, picture, author, date, content, shortName, abbreviation } = req.body;
    if (!category || !title || !author || !date || !content)
        return res.status(400).json({ error: "Category, title, author, date, and content are required." });
    let finalAbbreviation = abbreviation || "";
    if (category === "Project" && !finalAbbreviation) {
        finalAbbreviation = getAbbreviation(title);
    }
    const blog = await Blog_1.Blog.create({
        category,
        title,
        subtitle: subtitle || "",
        picture: picture || "",
        author,
        date,
        content,
        shortName: shortName || "",
        abbreviation: finalAbbreviation,
    });
    return res.status(201).json({ success: true, blog });
}
async function updateBlog(req, res) {
    const { id } = req.params;
    const { category, title, subtitle, picture, author, date, content, shortName, abbreviation } = req.body;
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
    if (shortName !== undefined)
        blog.shortName = String(shortName).trim();
    if (abbreviation !== undefined) {
        blog.set("abbreviation", String(abbreviation).trim());
    }
    else if (title !== undefined && blog.category === "Project" && !blog.get("abbreviation")) {
        blog.set("abbreviation", getAbbreviation(title));
    }
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
