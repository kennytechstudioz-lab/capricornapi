import { Schema, model } from "mongoose";

const StaffSchema = new Schema(
  {
    name: { type: String, required: [true, "Name is required."], trim: true },
    position: { type: String, required: [true, "Position is required."], trim: true },
    description: { type: String, required: [true, "Description is required."], trim: true },
    picture: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Staff = model("Staff", StaffSchema);
export default Staff;
