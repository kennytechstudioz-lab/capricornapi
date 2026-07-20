import { Schema, model } from "mongoose";

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required."],
      unique: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          return !v.includes(" ");
        },
        message: "Username must not contain any spaces.",
      },
    },
    email: {
      type: String,
      required: [true, "Email address is required."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address.",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required."],
    },
    role: {
      type: String,
      enum: ["user", "staff"],
      default: "user",
    },
    status: {
      type: String,
      enum: ["Active", "Suspended"],
      default: "Active",
    },
    balance: {
      type: Number,
      default: 0.0,
    },
    totalBalance: {
      type: Number,
      default: 0.0,
    },
    passKey: {
      type: String,
    },
    profilePicture: {
      type: String,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
    },
    maritalStatus: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    country: {
      type: String,
    },
    occupation: {
      type: String,
    },
    isVerifying: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    idType: {
      type: String,
      enum: ["International Passport", "Voters Card", "Driving License"],
    },
    idImage: {
      type: String,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    resetOtp: { type: String, default: null },
    resetOtpExpiry: { type: Date, default: null },
    twoFactorOtp: { type: String, default: null },
    twoFactorOtpExpiry: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

export const User = model("User", UserSchema);
export default User;
