import { Schema, model } from "mongoose";

const EmailTemplateSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Template name is required."],
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Template title is required."],
      trim: true,
    },
    greeting: {
      type: String,
      default: "Hi {{username}},",
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Template content is required."],
      trim: true,
    },
    banner: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const EmailTemplate = model("EmailTemplate", EmailTemplateSchema);
export default EmailTemplate;
