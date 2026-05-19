import { Schema, model } from "mongoose";

const NotificationTemplateSchema = new Schema(
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
    content: {
      type: String,
      required: [true, "Template content is required."],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const NotificationTemplate = model("NotificationTemplate", NotificationTemplateSchema);
export default NotificationTemplate;
