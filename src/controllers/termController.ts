import { Request, Response } from "express";
import { Term } from "../models/Term";

export async function getAllTerms(req: Request, res: Response) {
  const terms = await Term.find().sort({ category: 1, createdAt: 1 });
  return res.json({ success: true, terms });
}

export async function createTerm(req: Request, res: Response) {
  const { category, content } = req.body;
  if (!category || !content)
    return res.status(400).json({ error: "Category and content are required." });
  if (!["terms", "policy"].includes(category))
    return res.status(400).json({ error: "Category must be 'terms' or 'policy'." });
  const term = await Term.create({ category: category.trim(), content: content.trim() });
  return res.status(201).json({ success: true, term });
}

export async function updateTerm(req: Request, res: Response) {
  const { id } = req.params;
  const { category, content } = req.body;
  const term = await Term.findById(id);
  if (!term) return res.status(404).json({ error: "Term not found." });
  if (category !== undefined) {
    if (!["terms", "policy"].includes(category))
      return res.status(400).json({ error: "Category must be 'terms' or 'policy'." });
    term.category = String(category).trim() as "terms" | "policy";
  }
  if (content !== undefined) term.content = String(content).trim();
  await term.save();
  return res.json({ success: true, term });
}

export async function deleteTerm(req: Request, res: Response) {
  const { id } = req.params;
  const term = await Term.findByIdAndDelete(id);
  if (!term) return res.status(404).json({ error: "Term not found." });
  return res.json({ success: true, message: "Term deleted." });
}
