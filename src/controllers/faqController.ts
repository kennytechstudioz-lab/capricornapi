import { Request, Response } from "express";
import { Faq } from "../models/Faq";

export async function getAllFaqs(req: Request, res: Response) {
  const faqs = await Faq.find().sort({ category: 1, createdAt: 1 });
  return res.json({ success: true, faqs });
}

export async function createFaq(req: Request, res: Response) {
  const { category, question, answer } = req.body;
  if (!category || !question || !answer)
    return res.status(400).json({ error: "Category, question, and answer are required." });
  const faq = await Faq.create({ category: category.trim(), question: question.trim(), answer: answer.trim() });
  return res.status(201).json({ success: true, faq });
}

export async function updateFaq(req: Request, res: Response) {
  const { id } = req.params;
  const { category, question, answer } = req.body;
  const faq = await Faq.findById(id);
  if (!faq) return res.status(404).json({ error: "FAQ not found." });
  if (category !== undefined) faq.category = String(category).trim();
  if (question !== undefined) faq.question = String(question).trim();
  if (answer !== undefined) faq.answer = String(answer).trim();
  await faq.save();
  return res.json({ success: true, faq });
}

export async function deleteFaq(req: Request, res: Response) {
  const { id } = req.params;
  const faq = await Faq.findByIdAndDelete(id);
  if (!faq) return res.status(404).json({ error: "FAQ not found." });
  return res.json({ success: true, message: "FAQ deleted." });
}
