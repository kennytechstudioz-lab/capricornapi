import { Schema, model } from "mongoose";

const NotificationSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required."],
      lowercase: true,
      index: true,
      trim: true,
    },
    notificationName: {
      type: String,
      required: [true, "Notification system identifier name is required."],
      trim: true,
    },
    notificationTitle: {
      type: String,
      required: [true, "Notification title is required."],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Notification body content is required."],
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isAdminRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Notification = model("Notification", NotificationSchema);
export default Notification;
