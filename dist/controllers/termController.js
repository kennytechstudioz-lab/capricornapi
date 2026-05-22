"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTerms = getAllTerms;
exports.createTerm = createTerm;
exports.updateTerm = updateTerm;
exports.deleteTerm = deleteTerm;
const Term_1 = require("../models/Term");
async function getAllTerms(req, res) {
    const terms = await Term_1.Term.find().sort({ category: 1, createdAt: 1 });
    return res.json({ success: true, terms });
}
async function createTerm(req, res) {
    const { category, content } = req.body;
    if (!category || !content)
        return res.status(400).json({ error: "Category and content are required." });
    if (!["terms", "policy"].includes(category))
        return res.status(400).json({ error: "Category must be 'terms' or 'policy'." });
    const term = await Term_1.Term.create({ category: category.trim(), content: content.trim() });
    return res.status(201).json({ success: true, term });
}
async function updateTerm(req, res) {
    const { id } = req.params;
    const { category, content } = req.body;
    const term = await Term_1.Term.findById(id);
    if (!term)
        return res.status(404).json({ error: "Term not found." });
    if (category !== undefined) {
        if (!["terms", "policy"].includes(category))
            return res.status(400).json({ error: "Category must be 'terms' or 'policy'." });
        term.category = String(category).trim();
    }
    if (content !== undefined)
        term.content = String(content).trim();
    await term.save();
    return res.json({ success: true, term });
}
async function deleteTerm(req, res) {
    const { id } = req.params;
    const term = await Term_1.Term.findByIdAndDelete(id);
    if (!term)
        return res.status(404).json({ error: "Term not found." });
    return res.json({ success: true, message: "Term deleted." });
}
