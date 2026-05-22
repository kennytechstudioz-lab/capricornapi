import { Schema, model } from "mongoose";

const TermSchema = new Schema(
  {
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
  },
  { timestamps: true }
);

export const Term = model("Term", TermSchema);
export default Term;
