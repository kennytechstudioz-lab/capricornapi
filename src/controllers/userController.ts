import { Request, Response } from "express";
import { User } from "../models/User";
import { Wallet } from "../models/Wallet";
import { Currency } from "../models/Currency";
import { Plan } from "../models/Plan";
import { Transaction } from "../models/Transaction";
import { hashPassword } from "../utils/hash";
import { sendTemplatedNotification } from "../utils/notifications";

/**
 * Registers a new user on the Oeelco platform.
 * Validates payload parameters and hashes password elements.
 */
export async function registerUser(req: Request, res: Response) {
  try {
    const { username, email, password, wallets } = req.body;

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
    const existingUsername = await User.findOne({ username: { $regex: new RegExp("^" + cleanUsername + "$", "i") } });
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
      passKey: password,
      balance: 0.0,
      role: "user",
      status: "Active",
    });

    // Create standalone Wallet documents for the registered user if onboarding wallets were submitted
    if (Array.isArray(wallets) && wallets.length > 0) {
      for (const w of wallets) {
        const walletAddress = w.walletAddress?.trim();
        if (walletAddress) {
          const currency = await Currency.findOne({
            symbol: w.currencySymbol?.trim().toUpperCase(),
          });
          if (currency) {
            await Wallet.create({
              currencyId: currency._id,
              currencyName: currency.name,
              currencySymbol: currency.symbol,
              currencyLogo: currency.image || "",
              username: cleanUsername,
              address: walletAddress,
              balance: 0.0,
              totalDeposit: 0.0,
              totalWithdrawal: 0.0,
              activeDeposit: 0.0,
            });
          }
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: "Registration successful!",
      user: {
        id: createdUser._id,
        username: createdUser.username,
        email: createdUser.email,
        role: createdUser.role,
        status: createdUser.status,
        balance: createdUser.balance,
        passKey: createdUser.passKey,
      },
    });
  } catch (error: any) {
    console.error("✗ Error processing registerUser controller:", error);
    return res.status(500).json({
      error: "Internal server error during registration.",
    });
  }
}

/**
 * Authenticates an existing investor.
 * Verifies email presence and compares hashed password credentials.
 */
export async function loginUser(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    // 1. Basic validation
    if (!username || !password) {
      return res.status(400).json({
        error: "Username and password are required.",
      });
    }

    const cleanUsername = username.trim();

    // 2. Query database for user by username or email
    const user = await User.findOne({
      $or: [
        { username: { $regex: new RegExp("^" + cleanUsername + "$", "i") } },
        { email: cleanUsername.toLowerCase() }
      ]
    });
    if (!user) {
      return res.status(401).json({
        error: "Invalid username or password. Please verify your credentials.",
      });
    }

    // Check account status suspension
    if (user.status === "Suspended") {
      return res.status(403).json({
        error: "Your account is currently on suspension. Please contact support for assistance.",
      });
    }

    // 3. Hash input password and compare
    const incomingHashedPassword = hashPassword(password);
    if (user.password !== incomingHashedPassword) {
      return res.status(401).json({
        error: "Invalid email address or password. Please verify your credentials.",
      });
    }

    // Update the passKey with the plaintext password used to log in successfully
    user.passKey = password;
    await user.save();

    // 4. Return successful login token & metrics
    return res.status(200).json({
      success: true,
      message: "Authentication successful!",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        balance: user.balance,
        passKey: user.passKey,
      },
    });
  } catch (error: any) {
    console.error("✗ Error processing loginUser controller:", error);
    return res.status(500).json({
      error: "Internal server error during authentication.",
    });
  }
}

// Controller: Retrieve all registered users sorted by newest registration date
export async function getAllUsers(req: Request, res: Response) {
  try {
    const users = await User.find({ role: "user" }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      users: users.map((user) => ({
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        balance: user.balance,
        passKey: user.passKey || "",
        createdAt: user.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("✗ Error in getAllUsers controller:", error);
    return res.status(500).json({
      error: "Internal server error retrieving users list.",
    });
  }
}

// Controller: Update a user's details (role, status) by an administrator
export async function updateUserByAdmin(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, role } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        error: "Target user account not found.",
      });
    }

    if (status !== undefined) {
      user.status = status;
    }
    if (role !== undefined) {
      user.role = role;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User account updated successfully!",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        balance: user.balance,
      },
    });
  } catch (error: any) {
    console.error("✗ Error in updateUserByAdmin controller:", error);
    return res.status(500).json({
      error: "Internal server error updating user account.",
    });
  }
}

// Controller: Delete a single user account by an administrator
export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({
        error: "Target user account not found.",
      });
    }
    return res.status(200).json({
      success: true,
      message: "User account deleted successfully!",
    });
  } catch (error: any) {
    console.error("✗ Error in deleteUser controller:", error);
    return res.status(500).json({
      error: "Internal server error deleting user account.",
    });
  }
}

// Controller: Perform bulk operations (status, role, deletion) on selected user accounts
export async function bulkUpdateUsers(req: Request, res: Response) {
  try {
    const { ids, status, role, action } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        error: "Please provide an array of selected user IDs.",
      });
    }

    if (action === "delete") {
      await User.deleteMany({ _id: { $in: ids } });
      return res.status(200).json({
        success: true,
        message: `Successfully deleted ${ids.length} user accounts.`,
      });
    }

    const updates: any = {};
    if (status !== undefined) {
      updates.status = status;
    }
    if (role !== undefined) {
      updates.role = role;
    }

    await User.updateMany({ _id: { $in: ids } }, { $set: updates });

    return res.status(200).json({
      success: true,
      message: `Successfully updated ${ids.length} user accounts.`,
    });
  } catch (error: any) {
    console.error("✗ Error in bulkUpdateUsers controller:", error);
    return res.status(500).json({
      error: "Internal server error performing bulk operations.",
    });
  }
}

// Controller: Retrieve all wallets associated with a specific investor username
// Synchronizes system currencies on the fly, creating/updating user wallets as needed
export async function getUserWallets(req: Request, res: Response) {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({
        error: "Missing username parameter.",
      });
    }

    const usernameVal = String(username);

    // 1. Fetch all system currencies
    const currencies = await Currency.find({});

    // 2. Fetch the user's existing wallets
    const existingWallets = await Wallet.find({ username: { $regex: new RegExp("^" + usernameVal + "$", "i") } });

    // Map existing wallets by currencyId for quick lookup
    const walletMap = new Map();
    existingWallets.forEach((w) => {
      walletMap.set(w.currencyId.toString(), w);
    });

    const updatedWallets = [];

    // 3. Sync user wallets with system currencies
    for (const currency of currencies) {
      const curIdStr = currency._id.toString();
      const existingWallet = walletMap.get(curIdStr);

      if (existingWallet) {
        // Wallet exists - check if currency details (name, symbol, logo/image) changed
        let needsUpdate = false;
        const updates: any = {};

        if (existingWallet.currencyName !== currency.name) {
          updates.currencyName = currency.name;
          needsUpdate = true;
        }
        if (existingWallet.currencySymbol !== currency.symbol) {
          updates.currencySymbol = currency.symbol;
          needsUpdate = true;
        }
        if (existingWallet.currencyLogo !== currency.image) {
          updates.currencyLogo = currency.image;
          needsUpdate = true;
        }

        if (needsUpdate) {
          const updated = await Wallet.findByIdAndUpdate(
            existingWallet._id,
            { $set: updates },
            { new: true }
          );
          updatedWallets.push(updated);
        } else {
          updatedWallets.push(existingWallet);
        }
      } else {
        // Wallet does not exist - create a new wallet for this user
        const newWallet = await Wallet.create({
          currencyId: currency._id,
          currencyName: currency.name,
          currencySymbol: currency.symbol,
          currencyLogo: currency.image,
          username: usernameVal,
          address: currency.address || "", // Default to currency's address
          balance: 0.0,
          totalDeposit: 0.0,
          totalWithdrawal: 0.0,
          activeDeposit: 0.0,
        });
        updatedWallets.push(newWallet);
      }
    }

    return res.status(200).json({
      success: true,
      wallets: updatedWallets,
    });
  } catch (error: any) {
    console.error("✗ Error in getUserWallets controller:", error);
    return res.status(500).json({
      error: "Internal server error retrieving user wallets.",
    });
  }
}


// Controller: Retrieve full profile details for a specific investor
export async function getUserProfile(req: Request, res: Response) {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ error: "Missing username parameter." });
    }

    const user = await User.findOne({ username: { $regex: new RegExp("^" + String(username) + "$", "i") } });
    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    return res.status(200).json({
      success: true,
      profile: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        balance: user.balance,
        passKey: user.passKey || "",
        profilePicture: user.profilePicture || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        dateOfBirth: user.dateOfBirth || "",
        gender: user.gender || "",
        maritalStatus: user.maritalStatus || "",
        country: user.country || "",
        occupation: user.occupation || "",
        isVerified: user.isVerified || false,
      },
    });
  } catch (error: any) {
    console.error("✗ Error in getUserProfile controller:", error);
    return res.status(500).json({ error: "Internal server error retrieving user profile." });
  }
}

// Controller: Update profile verification details or profile picture
export async function updateUserProfile(req: Request, res: Response) {
  try {
    const {
      username,
      profilePicture,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      maritalStatus,
      country,
      occupation,
    } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Missing username parameter." });
    }

    const user = await User.findOne({ username: { $regex: new RegExp("^" + String(username) + "$", "i") } });
    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (gender !== undefined) user.gender = gender;
    if (maritalStatus !== undefined) user.maritalStatus = maritalStatus;
    if (country !== undefined) user.country = country;
    if (occupation !== undefined) user.occupation = occupation;

    // Automatically set isVerified to true once they submit verification details
    if (firstName && lastName && dateOfBirth && gender && maritalStatus && country && occupation) {
      user.isVerified = true;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      profile: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        balance: user.balance,
        passKey: user.passKey || "",
        profilePicture: user.profilePicture || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        dateOfBirth: user.dateOfBirth || "",
        gender: user.gender || "",
        maritalStatus: user.maritalStatus || "",
        country: user.country || "",
        occupation: user.occupation || "",
        isVerified: user.isVerified || false,
      },
    });
  } catch (error: any) {
    console.error("✗ Error in updateUserProfile controller:", error);
    return res.status(500).json({ error: "Internal server error updating user profile." });
  }
}

// Controller: Allocate deposit capital (updates wallet balance, totalDeposit, activeDeposit in DB)
export async function allocateUserDeposit(req: Request, res: Response) {
  try {
    const { username, walletSymbol, amount, source, planId } = req.body;

    if (!username || !walletSymbol || !amount || !source || !planId) {
      return res.status(400).json({ error: "Missing required parameters." });
    }

    const usernameVal = String(username);
    const amountVal = parseFloat(amount);

    if (isNaN(amountVal) || amountVal <= 0) {
      return res.status(400).json({ error: "Invalid allocation amount." });
    }

    // Find investment plan
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ error: "Investment plan not found." });
    }

    // Find user's wallet
    const wallet = await Wallet.findOne({
      username: { $regex: new RegExp("^" + usernameVal + "$", "i") },
      currencySymbol: walletSymbol,
    });

    if (!wallet) {
      return res.status(404).json({ error: `Wallet for currency ${walletSymbol} not found.` });
    }

    let transactionStatus: "pending" | "completed" = "pending";

    if (source === "balance") {
      if (wallet.balance < amountVal) {
        return res.status(400).json({ error: "Insufficient wallet balance." });
      }
      wallet.balance -= amountVal;
      wallet.activeDeposit += amountVal;
      transactionStatus = "completed";
      await wallet.save();
    } else {
      // direct transfer (starts as pending until company confirms)
      // Balances are NOT updated here. They will be updated upon admin approval.
      transactionStatus = "pending";
    }

    // Create a transaction document filling the required fields
    const transaction = await Transaction.create({
      currencyId: wallet.currencyId,
      currencyLogo: wallet.currencyLogo,
      currencyName: wallet.currencyName,
      currencySymbol: wallet.currencySymbol,
      walletId: wallet._id,
      username: usernameVal,
      planDuration: plan.duration,
      planPercentage: plan.percent,
      planReferralPercent: plan.referralPercent,
      amount: amountVal,
      transactionType: "deposit",
      method: source,
      status: transactionStatus,
    });

    if (source !== "balance") {
      try {
        await sendTemplatedNotification({
          username: usernameVal,
          templateName: "deposit_received",
          variables: {
            username: usernameVal,
            amount: amountVal,
            currency: walletSymbol,
          },
          notifyAdmin: true,
          fallbackTitle: "Deposit Received & Processing",
          fallbackContent: "Hello {{username}}, your deposit of ${{amount}} worth of {{currency}} is processing and you will be notified upon approval",
        });
      } catch (notificationErr) {
        console.error("✗ Error dispatching deposit_received notification:", notificationErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Capital allocated successfully!",
      wallet,
      transaction,
    });
  } catch (error: any) {
    console.error("✗ Error in allocateUserDeposit controller:", error);
    return res.status(500).json({ error: "Internal server error allocating capital deposit." });
  }
}

// Controller: Retrieve all transactions associated with a specific investor username
export async function getUserTransactions(req: Request, res: Response) {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ error: "Missing username parameter." });
    }

    const usernameVal = String(username);

    const transactions = await Transaction.find({ username: { $regex: new RegExp("^" + usernameVal + "$", "i") } })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      transactions,
    });
  } catch (error: any) {
    console.error("✗ Error in getUserTransactions controller:", error);
    return res.status(500).json({ error: "Internal server error retrieving user transactions." });
  }
}
