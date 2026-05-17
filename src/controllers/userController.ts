import { Request, Response } from "express";
import { User } from "../models/User";
import { hashPassword } from "../utils/hash";

/**
 * Registers a new user on the Oeelco platform.
 * Validates payload parameters and hashes password elements.
 */
export async function registerUser(req: Request, res: Response) {
  try {
    const { username, email, password } = req.body;

    // 1. Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({
        error: "All fields (username, email, password) are required.",
      });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    // 2. Custom validation: Username must not contain spaces
    if (cleanUsername.includes(" ")) {
      return res.status(400).json({
        error: "Username must not contain any spaces.",
      });
    }

    // 3. Custom validation: Password must be at least 4 characters long
    if (password.length < 4) {
      return res.status(400).json({
        error: "Password must be at least 4 characters long.",
      });
    }

    // 4. Duplicate checks
    const existingUsername = await User.findOne({ username: cleanUsername.toLowerCase() });
    if (existingUsername) {
      return res.status(400).json({
        error: "Username is already in use by another investor.",
      });
    }

    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(400).json({
        error: "Email address is already in use by another investor.",
      });
    }

    // 5. Hash password and save to database
    const securePassword = hashPassword(password);
    const createdUser = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      password: securePassword,
      balance: 0.0,
      role: "user",
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful!",
      user: {
        id: createdUser._id,
        username: createdUser.username,
        email: createdUser.email,
        role: createdUser.role,
        balance: createdUser.balance,
      },
    });
  } catch (error: any) {
    console.error("✗ Error processing registerUser controller:", error);
    return res.status(500).json({
      error: "Internal server error during registration.",
    });
  }
}
