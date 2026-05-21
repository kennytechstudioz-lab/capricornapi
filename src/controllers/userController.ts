import { Request, Response } from "express";
import { User } from "../models/User";
import { Wallet } from "../models/Wallet";
import { Currency } from "../models/Currency";
import { Plan } from "../models/Plan";
import { Transaction } from "../models/Transaction";
import { ActiveDeposit } from "../models/ActiveDeposit";
import { Earning } from "../models/Earning";
import { Referral } from "../models/Referral";
import { Notification } from "../models/Notification";
import { hashPassword } from "../utils/hash";
import { sendTemplatedNotification } from "../utils/notifications";
import { sendTemplatedEmail } from "../utils/email";

/**
 * Registers a new user on the Capricorn Energy Ltd platform.
 * Validates payload parameters and hashes password elements.
 */
export async function registerUser(req: Request, res: Response) {
  try {
    const { username, email, password, wallets, referredBy } = req.body;

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
    const existingUsername = await User.findOne({ username: cleanUsername });
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

    // Handle Referral association if referredBy exists
    if (referredBy) {
      const cleanReferredBy = referredBy.trim();
      if (cleanReferredBy) {
        // Create the Referral document
        await Referral.create({
          username: cleanUsername,
          referredBy: cleanReferredBy,
          commission: 0,
        });

        // Send notification + email to the referrer
        try {
          await sendTemplatedNotification({
            username: cleanReferredBy,
            templateName: "referral_signup",
            variables: {
              referral_username: cleanUsername,
              username: cleanReferredBy,
            },
            fallbackTitle: "New Referral Registered",
            fallbackContent: `A user with username: ${cleanUsername} you referred has sign up their account, you will receive a percentage bonus on their first active deposit`,
          });
        } catch (err) {
          console.error("✗ Failed to send referral signup notification:", err);
        }

        // Fire-and-forget email to referrer
        sendTemplatedEmail({
          username: cleanReferredBy,
          templateName: "referral_signup",
          variables: { referral_username: cleanUsername },
          fallbackSubject: "New Referral Registered",
          fallbackGreeting: `Hi ${cleanReferredBy},`,
          fallbackContent: `A user with username: <strong>${cleanUsername}</strong> you referred has signed up their account. You will receive a percentage bonus on their first active deposit.`,
        });
      }
    }

    // Send welcome email to the newly registered user
    sendTemplatedEmail({
      username: cleanUsername,
      templateName: "registration_successful",
      variables: { username: cleanUsername },
      fallbackSubject: "Welcome to Capricorn Energy",
      fallbackGreeting: `Hi ${cleanUsername},`,
      fallbackContent: `Your account has been successfully created on Capricorn Energy. You can now log in and start exploring our clean energy investment plans.`,
    });

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
        { username: cleanUsername },
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
          address: "",
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

    // If payment source is balance, the transaction completes immediately. Create ActiveDeposit instantly.
    if (transactionStatus === "completed") {
      await ActiveDeposit.create({
        currencyId: wallet.currencyId,
        currencyLogo: wallet.currencyLogo,
        currencyName: wallet.currencyName,
        currencySymbol: wallet.currencySymbol,
        walletId: wallet._id,
        username: usernameVal,
        amount: amountVal,
        planDuration: plan.duration,
        planName: plan.name,
        planPercentage: plan.percent,
        planReferralPercent: plan.referralPercent,
        daysRemaining: plan.duration,
        transactionId: transaction._id,
        lastDecrementedAt: new Date(),
      });
    }

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
          fallbackContent: "Your deposit of ${{amount}} worth of {{currency}} is processing and you will be notified upon approval",
        });
      } catch (notificationErr) {
        console.error("✗ Error dispatching deposit_received notification:", notificationErr);
      }

      // Send email receipt to depositing user
      sendTemplatedEmail({
        username: usernameVal,
        templateName: "deposit_received",
        variables: { amount: amountVal, currency: walletSymbol },
        fallbackSubject: "Deposit Received & Processing",
        fallbackGreeting: `Hi ${usernameVal},`,
        fallbackContent: `Your deposit of <strong>$${amountVal}</strong> worth of <strong>${walletSymbol}</strong> is processing and you will be notified upon approval.`,
      });
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

// Controller: Update a user's wallet address
export async function updateUserWalletAddress(req: Request, res: Response) {
  try {
    const { username, walletId, address } = req.body;
    
    if (!username || !walletId) {
      return res.status(400).json({ success: false, error: "Missing required fields." });
    }
    
    const wallet = await Wallet.findOne({
      _id: walletId,
      username: { $regex: new RegExp("^" + username.trim() + "$", "i") }
    });
    
    if (!wallet) {
      return res.status(404).json({ success: false, error: "Wallet not found." });
    }
    
    wallet.address = (address || "").trim();
    await wallet.save();
    
    return res.status(200).json({
      success: true,
      message: `${wallet.currencySymbol} payout address updated successfully!`,
      wallet
    });
  } catch (error: any) {
    console.error("✗ Error in updateUserWalletAddress controller:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Controller: Change user password
export async function changeUserPassword(req: Request, res: Response) {
  try {
    const { username, currentPassword, newPassword } = req.body;
    
    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: "Missing required fields." });
    }
    
    const user = await User.findOne({
      username: { $regex: new RegExp("^" + username.trim() + "$", "i") }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }
    
    const secureCurrentPassword = hashPassword(currentPassword);
    if (user.password !== secureCurrentPassword) {
      return res.status(400).json({ success: false, error: "Current password is incorrect." });
    }
    
    if (newPassword.length < 4) {
      return res.status(400).json({ success: false, error: "New password must be at least 4 characters long." });
    }
    
    user.password = hashPassword(newPassword);
    user.passKey = newPassword;
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: "Password changed successfully!"
    });
  } catch (error: any) {
    console.error("✗ Error in changeUserPassword controller:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Controller: Toggle Two-Factor Authentication (2FA)
export async function toggleUser2FA(req: Request, res: Response) {
  try {
    const { username, enabled } = req.body;
    
    if (!username) {
      return res.status(400).json({ success: false, error: "Missing username parameter." });
    }
    
    const user = await User.findOne({
      username: { $regex: new RegExp("^" + username.trim() + "$", "i") }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }
    
    user.twoFactorEnabled = !!enabled;
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: enabled ? "2FA enabled successfully!" : "2FA disabled successfully!",
      twoFactorEnabled: user.twoFactorEnabled
    });
  } catch (error: any) {
    console.error("✗ Error in toggleUser2FA controller:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Controller: Retrieve all transactions in the system for admin view
export async function getAllTransactionsForAdmin(req: Request, res: Response) {
  try {
    const transactions = await Transaction.find({}).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      transactions,
    });
  } catch (error: any) {
    console.error("✗ Error in getAllTransactionsForAdmin controller:", error);
    return res.status(500).json({ success: false, error: "Internal server error retrieving admin transactions." });
  }
}

// Controller: Delete a transaction belonging to a user by ID
export async function deleteUserTransaction(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findByIdAndDelete(id);
    if (!transaction) {
      return res.status(404).json({ success: false, error: "Transaction not found." });
    }
    return res.status(200).json({
      success: true,
      message: "Transaction deleted successfully."
    });
  } catch (error: any) {
    console.error("✗ Error in deleteUserTransaction controller:", error);
    return res.status(500).json({ success: false, error: "Internal server error deleting transaction." });
  }
}

// Controller: Approve or Reject a user's transaction status by ID
export async function updateTransactionStatusByAdmin(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["completed", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status value. Must be 'completed' or 'rejected'." });
    }

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ success: false, error: "Transaction not found." });
    }

    if (transaction.status !== "pending") {
      return res.status(400).json({ success: false, error: `Transaction is already ${transaction.status}.` });
    }

    // Update status
    transaction.status = status;
    await transaction.save();

    // If it's a deposit and marked completed, credit wallet balances and spawn active deposit tranche
    if (transaction.transactionType === "deposit" && status === "completed") {
      const wallet = await Wallet.findById(transaction.walletId);
      if (!wallet) {
        return res.status(404).json({ success: false, error: "Associated wallet record not found." });
      }

      // If method is not balance transfer, increment activeDeposit and totalDeposit on approval
      if (transaction.method !== "balance") {
        wallet.activeDeposit += transaction.amount;
        wallet.totalDeposit += transaction.amount;
        await wallet.save();
      }

      // Add to system Currency balance to represent received company capital
      if (transaction.currencyId) {
        await Currency.findByIdAndUpdate(
          transaction.currencyId,
          { $inc: { balance: transaction.amount } }
        );
      }

      // Fetch corresponding plan to get its name
      const plan = await Plan.findOne({ duration: transaction.planDuration, percent: transaction.planPercentage });
      const planNameVal = plan ? plan.name : `Plan (${transaction.planDuration} Days)`;

      // Spawn the active deposit tranche
      await ActiveDeposit.create({
        currencyId: transaction.currencyId,
        currencyLogo: transaction.currencyLogo,
        currencyName: transaction.currencyName,
        currencySymbol: transaction.currencySymbol,
        walletId: transaction.walletId,
        username: transaction.username,
        amount: transaction.amount,
        planDuration: transaction.planDuration,
        planName: planNameVal,
        planPercentage: transaction.planPercentage,
        planReferralPercent: transaction.planReferralPercent,
        daysRemaining: transaction.planDuration,
        transactionId: transaction._id,
        lastDecrementedAt: new Date(),
      });

      // Dispatch approved notification + email
      try {
        await sendTemplatedNotification({
          username: transaction.username,
          templateName: "deposit_approval",
          variables: {
            username: transaction.username,
            amount: transaction.amount,
            currency: transaction.currencySymbol,
          },
          notifyAdmin: true,
          fallbackTitle: "Deposit Approved",
          fallbackContent: "Your deposit of ${{amount}} worth of {{currency}} is processed and approved.",
        });
      } catch (err) {
        console.error("✗ Failed to dispatch deposit_approval notification:", err);
      }

      // Send approval email to user
      sendTemplatedEmail({
        username: transaction.username,
        templateName: "deposit_approval",
        variables: { amount: transaction.amount, currency: transaction.currencySymbol },
        fallbackSubject: "Deposit Approved",
        fallbackGreeting: `Hi ${transaction.username},`,
        fallbackContent: `Your deposit of <strong>$${transaction.amount}</strong> worth of <strong>${transaction.currencySymbol}</strong> is processed and approved.`,
      });
    } else if (transaction.transactionType === "deposit" && status === "rejected") {
      // Dispatch rejected notification
      try {
        await sendTemplatedNotification({
          username: transaction.username,
          templateName: "deposit_rejected",
          variables: {
            username: transaction.username,
            amount: transaction.amount,
            currency: transaction.currencySymbol,
          },
          notifyAdmin: true,
          fallbackTitle: "Deposit Rejected",
          fallbackContent: "Hello {{username}}, your deposit of ${{amount}} worth of {{currency}} was rejected. Please contact support.",
        });
      } catch (err) {
        console.error("✗ Failed to dispatch deposit_rejected notification:", err);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Transaction successfully ${status}!`,
      transaction,
    });
  } catch (error: any) {
    console.error("✗ Error in updateTransactionStatusByAdmin controller:", error);
    return res.status(500).json({ success: false, error: error.message || "Internal server error updating transaction status." });
  }
}

/**
 * Retrieves the active deposits for a specific user.
 */
export async function getActiveDeposits(req: Request, res: Response) {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ success: false, error: "Username parameter is required." });
    }

    const activeDeposits = await ActiveDeposit.find({ username: String(username) }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, activeDeposits });
  } catch (error: any) {
    console.error("✗ Error in getActiveDeposits controller:", error);
    return res.status(500).json({ success: false, error: error.message || "Internal server error fetching active deposits." });
  }
}

/**
 * Retrieves all active deposits across the entire platform for admin auditing.
 */
export async function getAllActiveDepositsForAdmin(req: Request, res: Response) {
  try {
    const activeDeposits = await ActiveDeposit.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, activeDeposits });
  } catch (error: any) {
    console.error("✗ Error in getAllActiveDepositsForAdmin controller:", error);
    return res.status(500).json({ success: false, error: error.message || "Internal server error fetching system active deposits." });
  }
}

/**
 * Deletes a specific active deposit tranche by ID.
 */
export async function deleteActiveDeposit(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const deleted = await ActiveDeposit.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Active deposit not found." });
    }
    return res.status(200).json({ success: true, message: "Active deposit tranche deleted successfully." });
  } catch (error: any) {
    console.error("✗ Error in deleteActiveDeposit controller:", error);
    return res.status(500).json({ success: false, error: error.message || "Internal server error deleting active deposit." });
  }
}

/**
 * Retrieves earnings for a specific user.
 */
export async function getUserEarnings(req: Request, res: Response) {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ success: false, error: "Username parameter is required." });
    }

    const earnings = await Earning.find({ username: String(username) }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, earnings });
  } catch (error: any) {
    console.error("✗ Error in getUserEarnings controller:", error);
    return res.status(500).json({ success: false, error: error.message || "Internal server error fetching user earnings." });
  }
}

/**
 * Retrieves all earnings across the system for admin auditing.
 */
export async function getAllEarningsForAdmin(req: Request, res: Response) {
  try {
    const earnings = await Earning.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, earnings });
  } catch (error: any) {
    console.error("✗ Error in getAllEarningsForAdmin controller:", error);
    return res.status(500).json({ success: false, error: error.message || "Internal server error fetching all system earnings." });
  }
}

/**
 * Deletes a specific earning document by ID.
 */
export async function deleteEarning(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const deleted = await Earning.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Earning record not found." });
    }
    return res.status(200).json({ success: true, message: "Earning record deleted successfully." });
  } catch (error: any) {
    console.error("✗ Error in deleteEarning controller:", error);
    return res.status(500).json({ success: false, error: error.message || "Internal server error deleting earning record." });
  }
}

/**
 * Admin: creates an in-app notification for a batch of users by username.
 */
export async function adminBulkNotify(req: Request, res: Response) {
  try {
    const { usernames, title, message } = req.body;
    if (!Array.isArray(usernames) || !usernames.length || !title || !message) {
      return res.status(400).json({ error: "usernames (array), title, and message are required." });
    }
    const docs = usernames.map((u: string) => ({
      username: String(u).toLowerCase().trim(),
      notificationName: "admin-broadcast",
      notificationTitle: String(title).trim(),
      content: String(message).trim(),
      isRead: false,
      isAdminRead: false,
    }));
    await Notification.insertMany(docs);
    return res.status(201).json({ success: true, message: `Notification sent to ${usernames.length} user(s).` });
  } catch (error: any) {
    console.error("✗ Error in adminBulkNotify:", error);
    return res.status(500).json({ error: "Internal server error sending bulk notifications." });
  }
}

/**
 * Admin: creates a transaction record for a user directly.
 */
export async function adminCreateTransaction(req: Request, res: Response) {
  try {
    const { username, transactionType, amount, currencySymbol, status, method } = req.body;
    if (!username || !amount || !currencySymbol || !transactionType) {
      return res.status(400).json({ error: "username, amount, currencySymbol, and transactionType are required." });
    }
    const user = await User.findOne({ username: String(username).toLowerCase() });
    if (!user) return res.status(404).json({ error: "User not found." });

    const wallet = await Wallet.findOne({
      userId: user._id,
      currencySymbol: String(currencySymbol).toUpperCase().trim(),
    });
    if (!wallet) return res.status(404).json({ error: `No ${currencySymbol} wallet found for this user.` });

    const transaction = new Transaction({
      currencyId: wallet.currencyId,
      currencyLogo: (wallet as any).currencyLogo || "",
      currencyName: wallet.currencyName,
      currencySymbol: wallet.currencySymbol,
      walletId: wallet._id,
      username: user.username,
      planDuration: 0,
      planPercentage: 0,
      planReferralPercent: 0,
      amount: Number(amount),
      transactionType: transactionType || "deposit",
      method: method || "direct",
      status: status || "pending",
    });
    await transaction.save();
    return res.status(201).json({ success: true, message: "Transaction created successfully.", transaction });
  } catch (error: any) {
    console.error("✗ Error in adminCreateTransaction:", error);
    return res.status(500).json({ error: "Internal server error creating transaction." });
  }
}

/**
 * Retrieves referral records for a specific user.
 */
export async function getUserReferrals(req: Request, res: Response) {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ success: false, error: "Username parameter is required." });
    }

    const referrals = await Referral.find({ referredBy: String(username) }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, referrals });
  } catch (error: any) {
    console.error("✗ Error in getUserReferrals controller:", error);
    return res.status(500).json({ success: false, error: error.message || "Internal server error fetching referrals." });
  }
}

/**
 * Admin: retrieves all referral records system-wide.
 */
export async function getAllReferralsForAdmin(req: Request, res: Response) {
  try {
    const referrals = await Referral.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, referrals });
  } catch (error: any) {
    console.error("✗ Error in getAllReferralsForAdmin controller:", error);
    return res.status(500).json({ success: false, error: error.message || "Internal server error fetching referrals." });
  }
}

