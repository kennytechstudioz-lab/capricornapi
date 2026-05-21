"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllFaqs = getAllFaqs;
exports.createFaq = createFaq;
exports.updateFaq = updateFaq;
exports.deleteFaq = deleteFaq;
const Faq_1 = require("../models/Faq");
async function getAllFaqs(req, res) {
    const faqs = await Faq_1.Faq.find().sort({ category: 1, createdAt: 1 });
    return res.json({ success: true, faqs });
}
async function createFaq(req, res) {
    const { category, question, answer } = req.body;
    if (!category || !question || !answer)
        return res.status(400).json({ error: "Category, question, and answer are required." });
    const faq = await Faq_1.Faq.create({ category: category.trim(), question: question.trim(), answer: answer.trim() });
    return res.status(201).json({ success: true, faq });
}
async function updateFaq(req, res) {
    const { id } = req.params;
    const { category, question, answer } = req.body;
    const faq = await Faq_1.Faq.findById(id);
    if (!faq)
        return res.status(404).json({ error: "FAQ not found." });
    if (category !== undefined)
        faq.category = String(category).trim();
    if (question !== undefined)
        faq.question = String(question).trim();
    if (answer !== undefined)
        faq.answer = String(answer).trim();
    await faq.save();
    return res.json({ success: true, faq });
}
async function deleteFaq(req, res) {
    const { id } = req.params;
    const faq = await Faq_1.Faq.findByIdAndDelete(id);
    if (!faq)
        return res.status(404).json({ error: "FAQ not found." });
    return res.json({ success: true, message: "FAQ deleted." });
}
