import { Schema, model } from "mongoose";

const BlogSchema = new Schema(
  {
    category: { type: String, required: [true, "Category is required."], trim: true },
    title: { type: String, required: [true, "Title is required."], trim: true },
    subtitle: { type: String, default: "", trim: true },
    picture: { type: String, default: "" },
    author: { type: String, required: [true, "Author is required."], trim: true },
    date: { type: String, required: [true, "Date is required."], trim: true },
    content: { type: String, required: [true, "Content is required."] },
    shortName: { type: String, default: "", trim: true },
    abbreviation: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);



export const Blog = model("Blog", BlogSchema);
export default Blog;
