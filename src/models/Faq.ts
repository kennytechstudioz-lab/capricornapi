import { Schema, model } from "mongoose";

const FaqSchema = new Schema(
  {
    category: { type: String, required: [true, "Category is required."], trim: true },
    question: { type: String, required: [true, "Question is required."], trim: true },
    answer: { type: String, required: [true, "Answer is required."], trim: true },
  },
  { timestamps: true }
);

export const Faq = model("Faq", FaqSchema);
export default Faq;
