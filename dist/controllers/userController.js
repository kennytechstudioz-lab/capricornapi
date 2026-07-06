"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.getAllUsers = getAllUsers;
exports.updateUserByAdmin = updateUserByAdmin;
exports.approveVerification = approveVerification;
exports.rejectVerification = rejectVerification;
exports.deleteUser = deleteUser;
exports.bulkUpdateUsers = bulkUpdateUsers;
exports.getUserWallets = getUserWallets;
exports.getUserProfile = getUserProfile;
exports.updateUserProfile = updateUserProfile;
exports.allocateUserDeposit = allocateUserDeposit;
exports.getUserTransactions = getUserTransactions;
exports.updateUserWalletAddress = updateUserWalletAddress;
exports.changeUserPassword = changeUserPassword;
exports.toggleUser2FA = toggleUser2FA;
exports.getAllTransactionsForAdmin = getAllTransactionsForAdmin;
exports.deleteUserTransaction = deleteUserTransaction;
exports.updateTransactionStatusByAdmin = updateTransactionStatusByAdmin;
exports.getActiveDeposits = getActiveDeposits;
exports.getAllActiveDepositsForAdmin = getAllActiveDepositsForAdmin;
exports.deleteActiveDeposit = deleteActiveDeposit;
exports.getUserEarnings = getUserEarnings;
exports.getAllEarningsForAdmin = getAllEarningsForAdmin;
exports.deleteEarning = deleteEarning;
exports.adminBulkEmail = adminBulkEmail;
exports.adminBulkNotify = adminBulkNotify;
exports.requestUserWithdrawal = requestUserWithdrawal;
exports.requestCapitalAccess = requestCapitalAccess;
exports.adminCreateTransaction = adminCreateTransaction;
exports.getUserReferrals = getUserReferrals;
exports.getAllReferralsForAdmin = getAllReferralsForAdmin;
exports.forgotPassword = forgotPassword;
exports.verifyResetOtp = verifyResetOtp;
exports.resetPassword = resetPassword;
exports.verifyTwoFactorOtp = verifyTwoFactorOtp;
const User_1 = require("../models/User");
const Wallet_1 = require("../models/Wallet");
const Currency_1 = require("../models/Currency");
const Plan_1 = require("../models/Plan");
const Transaction_1 = require("../models/Transaction");
const ActiveDeposit_1 = require("../models/ActiveDeposit");
const Earning_1 = require("../models/Earning");
const Referral_1 = require("../models/Referral");
const Notification_1 = require("../models/Notification");
const Review_1 = require("../models/Review");
const hash_1 = require("../utils/hash");
const notifications_1 = require("../utils/notifications");
const socket_1 = require("../utils/socket");
const email_1 = require("../utils/email");
/**
 * Registers a new user on the Capricorn Energy Ltd platform.
 * Validates payload parameters and hashes password elements.
 */
async function registerUser(req, res) {
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
        const existingUsername = await User_1.User.findOne({ username: cleanUsername });
        if (existingUsername) {
            return res.status(400).json({
                error: "Username is already in use by another investor.",
            });
        }
        const existingEmail = await User_1.User.findOne({ email: cleanEmail });
        if (existingEmail) {
            return res.status(400).json({
                error: "Email address is already in use by another investor.",
            });
        }
        // 5. Hash password and save to database
        const securePassword = (0, hash_1.hashPassword)(password);
        const createdUser = await User_1.User.create({
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
                    const currency = await Currency_1.Currency.findOne({
                        symbol: w.currencySymbol?.trim().toUpperCase(),
                    });
                    if (currency) {
                        await Wallet_1.Wallet.create({
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
                await Referral_1.Referral.create({
                    username: cleanUsername,
                    referredBy: cleanReferredBy,
                    commission: 0,
                });
                // Send notification + email to the referrer
                try {
                    await (0, notifications_1.sendTemplatedNotification)({
                        username: cleanReferredBy,
                        templateName: "referral_signup",
                        variables: {
                            referred_by: cleanReferredBy,
                            username: cleanUsername,
                            referral_username: cleanUsername,
                        },
                        fallbackTitle: "New Referral Registered",
                        fallbackContent: `Hello ${cleanReferredBy}, a user with username: ${cleanUsername} you referred has signed up their account. You will receive a percentage bonus on their first active deposit.`,
                    });
                }
                catch (err) {
                    console.error("✗ Failed to send referral signup notification:", err);
                }
                // Fire-and-forget email to referrer
                (0, email_1.sendTemplatedEmail)({
                    username: cleanReferredBy,
                    templateName: "referral_signup",
                    variables: { referred_by: cleanReferredBy, username: cleanUsername, referral_username: cleanUsername },
                    fallbackSubject: "New Referral Registered",
                    fallbackGreeting: `Hello ${cleanReferredBy},`,
                    fallbackContent: `A user with username: <strong>${cleanUsername}</strong> you referred has signed up their account. You will receive a percentage bonus on their first active deposit.`,
                });
            }
        }
        // Send welcome email to the newly registered user
        (0, email_1.sendTemplatedEmail)({
            username: cleanUsername,
            templateName: "registration_successful",
            variables: { username: cleanUsername },
            fallbackSubject: "Welcome to Capricorn Energy",
            fallbackGreeting: `Hi ${cleanUsername},`,
            fallbackContent: `Your account has been successfully created on Capricorn Energy. You can now log in and start exploring our clean energy investment plans.`,
        }).catch((err) => console.error("[Email] Registration welcome email failed:", err));
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
    }
    catch (error) {
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
async function loginUser(req, res) {
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
        const user = await User_1.User.findOne({
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
        const incomingHashedPassword = (0, hash_1.hashPassword)(password);
        if (user.password !== incomingHashedPassword) {
            return res.status(401).json({
                error: "Invalid email address or password. Please verify your credentials.",
            });
        }
        // 4. If 2FA is enabled, generate OTP and send email — do not return user yet
        if (user.twoFactorEnabled) {
            const otp = String(Math.floor(100000 + Math.random() * 900000));
            user.twoFactorOtp = otp;
            user.twoFactorOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
            await user.save();
            (0, email_1.sendTemplatedEmail)({
                username: user.username,
                templateName: "two_factor_auth",
                variables: { otp },
                fallbackSubject: "Your 2FA Login Code — Capricorn Energy Ltd",
                fallbackGreeting: `Hi ${user.username},`,
                fallbackContent: `Your two-factor authentication code is: <strong style="font-size:28px; color:#e4c126; letter-spacing:8px;">${otp}</strong><br/><br/>This code expires in 10 minutes. Do not share it with anyone.`,
            }).catch((err) => console.error("[2FA] Email send error:", err));
            return res.status(200).json({
                success: true,
                requires2FA: true,
                username: user.username,
            });
        }
        // Update the passKey with the plaintext password used to log in successfully
        user.passKey = password;
        await user.save();
        // 5. Return successful login token & metrics
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
    }
    catch (error) {
        console.error("✗ Error processing loginUser controller:", error);
        return res.status(500).json({
            error: "Internal server error during authentication.",
        });
    }
}
// Controller: Retrieve all registered users sorted by newest registration date
async function getAllUsers(req, res) {
    try {
        const users = await User_1.User.find({ role: "user" }).sort({ createdAt: -1 });
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
                isVerifying: user.isVerifying || false,
                isVerified: user.isVerified || false,
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                dateOfBirth: user.dateOfBirth || "",
                gender: user.gender || "",
                maritalStatus: user.maritalStatus || "",
                country: user.country || "",
                occupation: user.occupation || "",
                idType: user.idType || "",
                idImage: user.idImage || "",
            })),
        });
    }
    catch (error) {
        console.error("✗ Error in getAllUsers controller:", error);
        return res.status(500).json({
            error: "Internal server error retrieving users list.",
        });
    }
}
// Controller: Update a user's details (role, status) by an administrator
async function updateUserByAdmin(req, res) {
    try {
        const { id } = req.params;
        const { status, role } = req.body;
        const user = await User_1.User.findById(id);
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
    }
    catch (error) {
        console.error("✗ Error in updateUserByAdmin controller:", error);
        return res.status(500).json({
            error: "Internal server error updating user account.",
        });
    }
}
// Controller: Admin approves a user's KYC verification
async function approveVerification(req, res) {
    try {
        const { username } = req.body;
        if (!username)
            return res.status(400).json({ error: "Username is required." });
        const user = await User_1.User.findOne({ username: { $regex: new RegExp("^" + String(username).trim() + "$", "i") } });
        if (!user)
            return res.status(404).json({ error: "User not found." });
        user.isVerifying = false;
        user.isVerified = true;
        await user.save();
        // Use sendTemplatedNotification with {{username}} placeholders so the admin can customise the template
        try {
            await (0, notifications_1.sendTemplatedNotification)({
                username: user.username,
                templateName: "verification_approved",
                variables: { username: user.username },
                notifyAdmin: false,
                fallbackTitle: "KYC Verification Approved",
                fallbackContent: "Hello {{username}}, your account verification has been approved. You now have full access to all platform features.",
            });
        }
        catch (notifErr) {
            // Fallback: direct socket emit even if DB save failed
            (0, socket_1.emitNotification)(user.username, {
                notificationName: "verification_approved",
                notificationTitle: "KYC Verification Approved",
                content: `Hello ${user.username}, your account verification has been approved. You now have full access to all platform features.`,
            });
            console.error("✗ Error saving verification_approved notification:", notifErr);
        }
        (0, email_1.sendTemplatedEmail)({
            username: user.username,
            templateName: "verification_approved",
            variables: { username: user.username },
            fallbackSubject: "KYC Verification Approved",
            fallbackGreeting: `Hello ${user.username},`,
            fallbackContent: `Congratulations! Your account verification has been approved. You now have full access to all platform features.`,
        });
        return res.status(200).json({ success: true, message: "User verification approved." });
    }
    catch (error) {
        console.error("✗ Error in approveVerification:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
}
// Controller: Admin rejects a user's KYC verification with a reason
async function rejectVerification(req, res) {
    try {
        const { username, reason } = req.body;
        if (!username)
            return res.status(400).json({ error: "Username is required." });
        if (!reason || !String(reason).trim())
            return res.status(400).json({ error: "Rejection reason is required." });
        const cleanReason = String(reason).trim();
        const user = await User_1.User.findOne({ username: { $regex: new RegExp("^" + String(username).trim() + "$", "i") } });
        if (!user)
            return res.status(404).json({ error: "User not found." });
        user.isVerifying = false;
        user.isVerified = false;
        await user.save();
        // Use sendTemplatedNotification with {{username}} and {{reason}} placeholders
        try {
            await (0, notifications_1.sendTemplatedNotification)({
                username: user.username,
                templateName: "verification_rejected",
                variables: { username: user.username, reason: cleanReason },
                notifyAdmin: false,
                fallbackTitle: "KYC Verification Rejected",
                fallbackContent: "Hello {{username}}, your account verification was not approved. Reason: {{reason}}. Please review your details and resubmit.",
            });
        }
        catch (notifErr) {
            // Fallback: direct socket emit even if DB save failed
            (0, socket_1.emitNotification)(user.username, {
                notificationName: "verification_rejected",
                notificationTitle: "KYC Verification Rejected",
                content: `Hello ${user.username}, your account verification was not approved. Reason: ${cleanReason}. Please review your details and resubmit.`,
            });
            console.error("✗ Error saving verification_rejected notification:", notifErr);
        }
        (0, email_1.sendTemplatedEmail)({
            username: user.username,
            templateName: "verification_rejected",
            variables: { username: user.username, reason: cleanReason },
            fallbackSubject: "KYC Verification Rejected",
            fallbackGreeting: `Hello ${user.username},`,
            fallbackContent: `Your account verification was not approved.<br><br><strong>Reason:</strong> ${cleanReason}<br><br>Please review your details and resubmit.`,
        });
        return res.status(200).json({ success: true, message: "User verification rejected." });
    }
    catch (error) {
        console.error("✗ Error in rejectVerification:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
}
// Controller: Delete a single user account by an administrator
async function deleteUser(req, res) {
    try {
        const { id } = req.params;
        const user = await User_1.User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({
                error: "Target user account not found.",
            });
        }
        const username = user.username;
        await Promise.all([
            Transaction_1.Transaction.deleteMany({ username }),
            ActiveDeposit_1.ActiveDeposit.deleteMany({ username }),
            Earning_1.Earning.deleteMany({ username }),
            Referral_1.Referral.deleteMany({ username }),
            Wallet_1.Wallet.deleteMany({ username }),
            Notification_1.Notification.deleteMany({ username }),
            Review_1.Review.deleteMany({ userId: user._id }),
        ]);
        return res.status(200).json({
            success: true,
            message: "User account deleted successfully!",
        });
    }
    catch (error) {
        console.error("✗ Error in deleteUser controller:", error);
        return res.status(500).json({
            error: "Internal server error deleting user account.",
        });
    }
}
// Controller: Perform bulk operations (status, role, deletion) on selected user accounts
async function bulkUpdateUsers(req, res) {
    try {
        const { ids, status, role, action } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                error: "Please provide an array of selected user IDs.",
            });
        }
        if (action === "delete") {
            await User_1.User.deleteMany({ _id: { $in: ids } });
            return res.status(200).json({
                success: true,
                message: `Successfully deleted ${ids.length} user accounts.`,
            });
        }
        const updates = {};
        if (status !== undefined) {
            updates.status = status;
        }
        if (role !== undefined) {
            updates.role = role;
        }
        await User_1.User.updateMany({ _id: { $in: ids } }, { $set: updates });
        return res.status(200).json({
            success: true,
            message: `Successfully updated ${ids.length} user accounts.`,
        });
    }
    catch (error) {
        console.error("✗ Error in bulkUpdateUsers controller:", error);
        return res.status(500).json({
            error: "Internal server error performing bulk operations.",
        });
    }
}
// Controller: Retrieve all wallets associated with a specific investor username
// Synchronizes system currencies on the fly, creating/updating user wallets as needed
async function getUserWallets(req, res) {
    try {
        const { username } = req.query;
        if (!username) {
            return res.status(400).json({
                error: "Missing username parameter.",
            });
        }
        const usernameVal = String(username);
        // 1. Fetch all system currencies
        const currencies = await Currency_1.Currency.find({});
        // 2. Fetch the user's existing wallets
        const existingWallets = await Wallet_1.Wallet.find({ username: { $regex: new RegExp("^" + usernameVal + "$", "i") } });
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
                const updates = {};
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
                    const updated = await Wallet_1.Wallet.findByIdAndUpdate(existingWallet._id, { $set: updates }, { new: true });
                    updatedWallets.push(updated);
                }
                else {
                    updatedWallets.push(existingWallet);
                }
            }
            else {
                // Wallet does not exist - create a new wallet for this user
                const newWallet = await Wallet_1.Wallet.create({
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
        // Attach the company-side currency address to each wallet for deposit instructions
        const walletsWithCompanyAddress = updatedWallets.map((w) => {
            const currency = currencies.find((c) => c._id.toString() === (w.currencyId?.toString?.() ?? ""));
            return {
                ...(w.toObject ? w.toObject() : w),
                companyAddress: currency?.address || "",
            };
        });
        return res.status(200).json({
            success: true,
            wallets: walletsWithCompanyAddress,
        });
    }
    catch (error) {
        console.error("✗ Error in getUserWallets controller:", error);
        return res.status(500).json({
            error: "Internal server error retrieving user wallets.",
        });
    }
}
// Controller: Retrieve full profile details for a specific investor
async function getUserProfile(req, res) {
    try {
        const { username } = req.query;
        if (!username) {
            return res.status(400).json({ error: "Missing username parameter." });
        }
        const user = await User_1.User.findOne({ username: { $regex: new RegExp("^" + String(username) + "$", "i") } });
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
                isVerifying: user.isVerifying || false,
                isVerified: user.isVerified || false,
                idType: user.idType || "",
                idImage: user.idImage || "",
            },
        });
    }
    catch (error) {
        console.error("✗ Error in getUserProfile controller:", error);
        return res.status(500).json({ error: "Internal server error retrieving user profile." });
    }
}
// Controller: Update profile verification details or profile picture
async function updateUserProfile(req, res) {
    try {
        const { username, profilePicture, firstName, lastName, dateOfBirth, gender, maritalStatus, country, occupation, idType, idImage, } = req.body;
        if (!username) {
            return res.status(400).json({ error: "Missing username parameter." });
        }
        const user = await User_1.User.findOne({ username: { $regex: new RegExp("^" + String(username) + "$", "i") } });
        if (!user) {
            return res.status(404).json({ error: "User profile not found." });
        }
        // Minimum age validation (18 years)
        if (dateOfBirth) {
            const dob = new Date(dateOfBirth);
            const cutoff = new Date();
            cutoff.setFullYear(cutoff.getFullYear() - 18);
            if (dob > cutoff) {
                return res.status(400).json({ error: "You must be at least 18 years old to verify your account." });
            }
        }
        if (profilePicture !== undefined)
            user.profilePicture = profilePicture;
        if (firstName !== undefined)
            user.firstName = firstName;
        if (lastName !== undefined)
            user.lastName = lastName;
        if (dateOfBirth !== undefined)
            user.dateOfBirth = dateOfBirth;
        if (gender !== undefined)
            user.gender = gender;
        if (maritalStatus !== undefined)
            user.maritalStatus = maritalStatus;
        if (country !== undefined)
            user.country = country;
        if (occupation !== undefined)
            user.occupation = occupation;
        if (idType !== undefined)
            user.idType = idType;
        if (idImage !== undefined)
            user.idImage = idImage;
        // Set isVerifying once all verification fields are submitted (admin approves to flip isVerified)
        const allVerificationFieldsPresent = !!(firstName && lastName && dateOfBirth && gender && maritalStatus && country && occupation && idType && idImage);
        const wasAlreadyVerifyingOrVerified = user.isVerifying || user.isVerified;
        if (allVerificationFieldsPresent && !wasAlreadyVerifyingOrVerified) {
            user.isVerifying = true;
        }
        await user.save();
        // Send verification_processing notification after first submission
        if (allVerificationFieldsPresent && !wasAlreadyVerifyingOrVerified) {
            try {
                await (0, notifications_1.sendTemplatedNotification)({
                    username: user.username,
                    templateName: "verification_processing",
                    variables: { username: user.username, company_name: "Capricorn Energy" },
                    notifyAdmin: true,
                    adminTitle: `KYC Submitted — @${user.username}`,
                    adminContent: `User @${user.username} has submitted their KYC verification details and is awaiting review.`,
                    fallbackTitle: "Verification Under Review",
                    fallbackContent: `Hello ${user.username}, thanks for the effort of verifying your Capricorn Energy account. Your verification is currently in review and will take 24 hours for review completion, you will be notified upon approval.`,
                });
                (0, email_1.sendTemplatedEmail)({
                    username: user.username,
                    templateName: "verification_processing",
                    variables: { username: user.username, company_name: "Capricorn Energy" },
                    fallbackSubject: "Verification Under Review",
                    fallbackGreeting: `Hello ${user.username},`,
                    fallbackContent: `Thanks for the effort of verifying your <strong>Capricorn Energy</strong> account. Your verification is currently in review and will take 24 hours for review completion, you will be notified upon approval.`,
                });
            }
            catch (notifErr) {
                console.error("✗ Error sending verification_processing notification:", notifErr);
            }
        }
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
                isVerifying: user.isVerifying || false,
                isVerified: user.isVerified || false,
                idType: user.idType || "",
                idImage: user.idImage || "",
            },
        });
    }
    catch (error) {
        console.error("✗ Error in updateUserProfile controller:", error);
        return res.status(500).json({ error: "Internal server error updating user profile." });
    }
}
// Controller: Allocate deposit capital (updates wallet balance, totalDeposit, activeDeposit in DB)
async function allocateUserDeposit(req, res) {
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
        const plan = await Plan_1.Plan.findById(planId);
        if (!plan) {
            return res.status(404).json({ error: "Investment plan not found." });
        }
        // Find user's wallet
        const wallet = await Wallet_1.Wallet.findOne({
            username: { $regex: new RegExp("^" + usernameVal + "$", "i") },
            currencySymbol: walletSymbol,
        });
        if (!wallet) {
            return res.status(404).json({ error: `Wallet for currency ${walletSymbol} not found.` });
        }
        let transactionStatus = "pending";
        if (source === "balance") {
            if (wallet.balance < amountVal) {
                return res.status(400).json({ error: "Insufficient wallet balance." });
            }
            wallet.balance -= amountVal;
            wallet.activeDeposit += amountVal;
            transactionStatus = "completed";
            await wallet.save();
        }
        else {
            // direct transfer (starts as pending until company confirms)
            // Balances are NOT updated here. They will be updated upon admin approval.
            transactionStatus = "pending";
        }
        // Create a transaction document filling the required fields
        const transaction = await Transaction_1.Transaction.create({
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
            await ActiveDeposit_1.ActiveDeposit.create({
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
                await (0, notifications_1.sendTemplatedNotification)({
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
            }
            catch (notificationErr) {
                console.error("✗ Error dispatching deposit_received notification:", notificationErr);
            }
            // Send email receipt to depositing user
            (0, email_1.sendTemplatedEmail)({
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
    }
    catch (error) {
        console.error("✗ Error in allocateUserDeposit controller:", error);
        return res.status(500).json({ error: "Internal server error allocating capital deposit." });
    }
}
// Controller: Retrieve all transactions associated with a specific investor username
async function getUserTransactions(req, res) {
    try {
        const { username, page = "1", limit = "20" } = req.query;
        if (!username) {
            return res.status(400).json({ error: "Missing username parameter." });
        }
        const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
        const skip = (pageNum - 1) * limitNum;
        const usernameVal = String(username);
        const query = { username: { $regex: new RegExp("^" + usernameVal + "$", "i") } };
        const [transactions, total] = await Promise.all([
            Transaction_1.Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
            Transaction_1.Transaction.countDocuments(query),
        ]);
        return res.status(200).json({
            success: true,
            transactions,
            total,
            totalPages: Math.ceil(total / limitNum) || 1,
            page: pageNum,
        });
    }
    catch (error) {
        console.error("✗ Error in getUserTransactions controller:", error);
        return res.status(500).json({ error: "Internal server error retrieving user transactions." });
    }
}
// Controller: Update a user's wallet address
async function updateUserWalletAddress(req, res) {
    try {
        const { username, walletId, address } = req.body;
        if (!username || !walletId) {
            return res.status(400).json({ success: false, error: "Missing required fields." });
        }
        const wallet = await Wallet_1.Wallet.findOne({
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
    }
    catch (error) {
        console.error("✗ Error in updateUserWalletAddress controller:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
// Controller: Change user password
async function changeUserPassword(req, res) {
    try {
        const { username, currentPassword, newPassword } = req.body;
        if (!username || !currentPassword || !newPassword) {
            return res.status(400).json({ success: false, error: "Missing required fields." });
        }
        const user = await User_1.User.findOne({
            username: { $regex: new RegExp("^" + username.trim() + "$", "i") }
        });
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found." });
        }
        const secureCurrentPassword = (0, hash_1.hashPassword)(currentPassword);
        if (user.password !== secureCurrentPassword) {
            return res.status(400).json({ success: false, error: "Current password is incorrect." });
        }
        if (newPassword.length < 4) {
            return res.status(400).json({ success: false, error: "New password must be at least 4 characters long." });
        }
        user.password = (0, hash_1.hashPassword)(newPassword);
        user.passKey = newPassword;
        await user.save();
        return res.status(200).json({
            success: true,
            message: "Password changed successfully!"
        });
    }
    catch (error) {
        console.error("✗ Error in changeUserPassword controller:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
// Controller: Toggle Two-Factor Authentication (2FA)
async function toggleUser2FA(req, res) {
    try {
        const { username, enabled } = req.body;
        if (!username) {
            return res.status(400).json({ success: false, error: "Missing username parameter." });
        }
        const user = await User_1.User.findOne({
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
    }
    catch (error) {
        console.error("✗ Error in toggleUser2FA controller:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
// Controller: Retrieve all transactions in the system for admin view
async function getAllTransactionsForAdmin(req, res) {
    try {
        const { page = "1", limit = "20" } = req.query;
        const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
        const skip = (pageNum - 1) * limitNum;
        const [transactions, total] = await Promise.all([
            Transaction_1.Transaction.find({}).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
            Transaction_1.Transaction.countDocuments({}),
        ]);
        return res.status(200).json({
            success: true,
            transactions,
            total,
            totalPages: Math.ceil(total / limitNum) || 1,
            page: pageNum,
        });
    }
    catch (error) {
        console.error("✗ Error in getAllTransactionsForAdmin controller:", error);
        return res.status(500).json({ success: false, error: "Internal server error retrieving admin transactions." });
    }
}
// Controller: Delete a transaction belonging to a user by ID
async function deleteUserTransaction(req, res) {
    try {
        const { id } = req.params;
        const transaction = await Transaction_1.Transaction.findByIdAndDelete(id);
        if (!transaction) {
            return res.status(404).json({ success: false, error: "Transaction not found." });
        }
        return res.status(200).json({
            success: true,
            message: "Transaction deleted successfully."
        });
    }
    catch (error) {
        console.error("✗ Error in deleteUserTransaction controller:", error);
        return res.status(500).json({ success: false, error: "Internal server error deleting transaction." });
    }
}
// Controller: Approve or Reject a user's transaction status by ID
async function updateTransactionStatusByAdmin(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!status || !["completed", "rejected"].includes(status)) {
            return res.status(400).json({ success: false, error: "Invalid status value. Must be 'completed' or 'rejected'." });
        }
        const transaction = await Transaction_1.Transaction.findById(id);
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
            const wallet = await Wallet_1.Wallet.findById(transaction.walletId);
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
                await Currency_1.Currency.findByIdAndUpdate(transaction.currencyId, { $inc: { balance: transaction.amount } });
            }
            // Fetch corresponding plan to get its name
            const plan = await Plan_1.Plan.findOne({ duration: transaction.planDuration, percent: transaction.planPercentage });
            const planNameVal = plan ? plan.name : `Plan (${transaction.planDuration} Days)`;
            // Spawn the active deposit tranche
            await ActiveDeposit_1.ActiveDeposit.create({
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
                await (0, notifications_1.sendTemplatedNotification)({
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
            }
            catch (err) {
                console.error("✗ Failed to dispatch deposit_approval notification:", err);
            }
            // Send approval email to user
            (0, email_1.sendTemplatedEmail)({
                username: transaction.username,
                templateName: "deposit_approval",
                variables: { amount: transaction.amount, currency: transaction.currencySymbol },
                fallbackSubject: "Deposit Approved",
                fallbackGreeting: `Hi ${transaction.username},`,
                fallbackContent: `Your deposit of <strong>$${transaction.amount}</strong> worth of <strong>${transaction.currencySymbol}</strong> is processed and approved.`,
            });
        }
        else if (transaction.transactionType === "deposit" && status === "rejected") {
            // Dispatch rejected notification
            try {
                await (0, notifications_1.sendTemplatedNotification)({
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
            }
            catch (err) {
                console.error("✗ Failed to dispatch deposit_rejected notification:", err);
            }
        }
        else if (transaction.transactionType === "capital_access" && status === "completed") {
            const wallet = await Wallet_1.Wallet.findById(transaction.walletId);
            if (wallet) {
                wallet.balance = (wallet.balance || 0) + transaction.amount;
                await wallet.save();
            }
        }
        return res.status(200).json({
            success: true,
            message: `Transaction successfully ${status}!`,
            transaction,
        });
    }
    catch (error) {
        console.error("✗ Error in updateTransactionStatusByAdmin controller:", error);
        return res.status(500).json({ success: false, error: error.message || "Internal server error updating transaction status." });
    }
}
/**
 * Retrieves the active deposits for a specific user.
 */
async function getActiveDeposits(req, res) {
    try {
        const { username } = req.query;
        if (!username) {
            return res.status(400).json({ success: false, error: "Username parameter is required." });
        }
        const activeDeposits = await ActiveDeposit_1.ActiveDeposit.find({ username: String(username) }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, activeDeposits });
    }
    catch (error) {
        console.error("✗ Error in getActiveDeposits controller:", error);
        return res.status(500).json({ success: false, error: error.message || "Internal server error fetching active deposits." });
    }
}
/**
 * Retrieves all active deposits across the entire platform for admin auditing.
 */
async function getAllActiveDepositsForAdmin(req, res) {
    try {
        const activeDeposits = await ActiveDeposit_1.ActiveDeposit.find({}).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, activeDeposits });
    }
    catch (error) {
        console.error("✗ Error in getAllActiveDepositsForAdmin controller:", error);
        return res.status(500).json({ success: false, error: error.message || "Internal server error fetching system active deposits." });
    }
}
/**
 * Deletes a specific active deposit tranche by ID.
 */
async function deleteActiveDeposit(req, res) {
    try {
        const { id } = req.params;
        const deleted = await ActiveDeposit_1.ActiveDeposit.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ success: false, error: "Active deposit not found." });
        }
        return res.status(200).json({ success: true, message: "Active deposit tranche deleted successfully." });
    }
    catch (error) {
        console.error("✗ Error in deleteActiveDeposit controller:", error);
        return res.status(500).json({ success: false, error: error.message || "Internal server error deleting active deposit." });
    }
}
/**
 * Retrieves earnings for a specific user.
 */
async function getUserEarnings(req, res) {
    try {
        const { username, page = "1", limit = "20" } = req.query;
        if (!username) {
            return res.status(400).json({ success: false, error: "Username parameter is required." });
        }
        const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
        const skip = (pageNum - 1) * limitNum;
        const query = { username: String(username) };
        const [earnings, total] = await Promise.all([
            Earning_1.Earning.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
            Earning_1.Earning.countDocuments(query),
        ]);
        return res.status(200).json({
            success: true,
            earnings,
            total,
            totalPages: Math.ceil(total / limitNum) || 1,
            page: pageNum,
        });
    }
    catch (error) {
        console.error("✗ Error in getUserEarnings controller:", error);
        return res.status(500).json({ success: false, error: error.message || "Internal server error fetching user earnings." });
    }
}
/**
 * Retrieves all earnings across the system for admin auditing.
 */
async function getAllEarningsForAdmin(req, res) {
    try {
        const { page = "1", limit = "20" } = req.query;
        const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
        const skip = (pageNum - 1) * limitNum;
        const [earnings, total] = await Promise.all([
            Earning_1.Earning.find({}).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
            Earning_1.Earning.countDocuments({}),
        ]);
        return res.status(200).json({
            success: true,
            earnings,
            total,
            totalPages: Math.ceil(total / limitNum) || 1,
            page: pageNum,
        });
    }
    catch (error) {
        console.error("✗ Error in getAllEarningsForAdmin controller:", error);
        return res.status(500).json({ success: false, error: error.message || "Internal server error fetching all system earnings." });
    }
}
/**
 * Deletes a specific earning document by ID.
 */
async function deleteEarning(req, res) {
    try {
        const { id } = req.params;
        const deleted = await Earning_1.Earning.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ success: false, error: "Earning record not found." });
        }
        return res.status(200).json({ success: true, message: "Earning record deleted successfully." });
    }
    catch (error) {
        console.error("✗ Error in deleteEarning controller:", error);
        return res.status(500).json({ success: false, error: error.message || "Internal server error deleting earning record." });
    }
}
/**
 * Admin: creates an in-app notification for a batch of users by username.
 */
async function adminBulkEmail(req, res) {
    try {
        const { usernames, templateName } = req.body;
        if (!Array.isArray(usernames) || !usernames.length || !templateName) {
            return res.status(400).json({ error: "usernames (array) and templateName are required." });
        }
        const results = await Promise.allSettled(usernames.map((username) => (0, email_1.sendTemplatedEmail)({
            username: String(username).toLowerCase().trim(),
            templateName: String(templateName),
            variables: {},
            fallbackSubject: "Message from Capricorn Energy",
            fallbackGreeting: `Hello {{username}},`,
            fallbackContent: "You have a new message from the Capricorn Energy team.",
        })));
        const sent = results.filter((r) => r.status === "fulfilled").length;
        return res.status(200).json({ success: true, message: `Email sent to ${sent} of ${usernames.length} user(s).` });
    }
    catch (error) {
        console.error("✗ Error in adminBulkEmail:", error);
        return res.status(500).json({ error: "Internal server error sending bulk emails." });
    }
}
async function adminBulkNotify(req, res) {
    try {
        const { usernames, title, message } = req.body;
        if (!Array.isArray(usernames) || !usernames.length || !title || !message) {
            return res.status(400).json({ error: "usernames (array), title, and message are required." });
        }
        const docs = usernames.map((u) => ({
            username: String(u).toLowerCase().trim(),
            notificationName: "admin-broadcast",
            notificationTitle: String(title).trim(),
            content: String(message).trim(),
            isRead: false,
            isAdminRead: false,
        }));
        await Notification_1.Notification.insertMany(docs);
        return res.status(201).json({ success: true, message: `Notification sent to ${usernames.length} user(s).` });
    }
    catch (error) {
        console.error("✗ Error in adminBulkNotify:", error);
        return res.status(500).json({ error: "Internal server error sending bulk notifications." });
    }
}
/**
 * Admin: creates a transaction record for a user directly.
 */
async function requestUserWithdrawal(req, res) {
    try {
        const { username, amount, currencySymbol } = req.body;
        if (!username || !amount || !currencySymbol) {
            return res.status(400).json({ error: "username, amount, and currencySymbol are required." });
        }
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            return res.status(400).json({ error: "Invalid withdrawal amount." });
        }
        const user = await User_1.User.findOne({ username: { $regex: new RegExp("^" + String(username).trim() + "$", "i") } });
        if (!user)
            return res.status(404).json({ error: "User not found." });
        const wallet = await Wallet_1.Wallet.findOne({
            username: user.username,
            currencySymbol: { $regex: new RegExp("^" + String(currencySymbol).trim() + "$", "i") },
        });
        if (!wallet)
            return res.status(404).json({ error: `No ${currencySymbol} wallet found.` });
        if ((wallet.balance || 0) < amountNum) {
            return res.status(400).json({ error: "Insufficient wallet balance." });
        }
        // Deduct balance immediately; post-save hook syncs user.balance
        wallet.balance = (wallet.balance || 0) - amountNum;
        wallet.totalWithdrawal = (wallet.totalWithdrawal || 0) + amountNum;
        await wallet.save();
        const transaction = await Transaction_1.Transaction.create({
            currencyId: wallet.currencyId,
            currencyLogo: wallet.currencyLogo || "",
            currencyName: wallet.currencyName,
            currencySymbol: wallet.currencySymbol,
            walletId: wallet._id,
            username: user.username,
            planDuration: 0,
            planPercentage: 0,
            planReferralPercent: 0,
            amount: amountNum,
            transactionType: "withdrawal",
            method: "direct",
            status: "pending",
        });
        (0, notifications_1.sendTemplatedNotification)({
            username: user.username,
            templateName: "withdrawal_processing",
            variables: {
                username: user.username,
                amount: amountNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                currency: wallet.currencyName,
            },
            notifyAdmin: true,
            fallbackTitle: "Withdrawal Processing",
            fallbackContent: "Hello {{username}}, your withdrawal of ${{amount}} worth of {{currency}} is being processed and you will be notified upon approval.",
        }).catch((err) => console.error("[Withdrawal] Notification failed:", err));
        return res.status(201).json({ success: true, message: "Withdrawal request submitted.", transaction });
    }
    catch (error) {
        console.error("✗ Error in requestUserWithdrawal:", error);
        return res.status(500).json({ error: "Internal server error processing withdrawal." });
    }
}
async function requestCapitalAccess(req, res) {
    try {
        const { username, walletSymbol, amount, planId } = req.body;
        if (!username || !walletSymbol || !amount || !planId) {
            return res.status(400).json({ error: "Missing required parameters." });
        }
        const plan = await Plan_1.Plan.findById(planId);
        if (!plan) {
            return res.status(404).json({ error: "Investment plan not found." });
        }
        const user = await User_1.User.findOne({ username: { $regex: new RegExp("^" + String(username).trim() + "$", "i") } });
        if (!user)
            return res.status(404).json({ error: "User not found." });
        const wallet = await Wallet_1.Wallet.findOne({
            username: user.username,
            currencySymbol: { $regex: new RegExp("^" + String(walletSymbol).trim() + "$", "i") },
        });
        if (!wallet)
            return res.status(404).json({ error: `No ${walletSymbol} wallet found.` });
        const transaction = await Transaction_1.Transaction.create({
            currencyId: wallet.currencyId,
            currencyLogo: wallet.currencyLogo || "",
            currencyName: wallet.currencyName,
            currencySymbol: wallet.currencySymbol,
            walletId: wallet._id,
            username: user.username,
            planDuration: plan.duration,
            planPercentage: plan.percent,
            planReferralPercent: plan.referralPercent,
            amount: parseFloat(amount),
            transactionType: "capital_access",
            method: "direct",
            status: "pending",
        });
        return res.status(201).json({ success: true, message: "Capital Access request submitted.", transaction });
    }
    catch (error) {
        console.error("✗ Error in requestCapitalAccess:", error);
        return res.status(500).json({ error: "Internal server error processing capital access." });
    }
}
async function adminCreateTransaction(req, res) {
    try {
        const { username, transactionType, amount, currencySymbol, method, planId } = req.body;
        if (!username || !amount || !currencySymbol || !transactionType) {
            return res.status(400).json({ error: "username, amount, currencySymbol, and transactionType are required." });
        }
        const cleanUsername = String(username).trim();
        const user = await User_1.User.findOne({ username: { $regex: new RegExp("^" + cleanUsername + "$", "i") } });
        if (!user)
            return res.status(404).json({ error: "User not found." });
        const symbolClean = String(currencySymbol).trim();
        const wallet = await Wallet_1.Wallet.findOne({
            username: user.username,
            currencySymbol: { $regex: new RegExp("^" + symbolClean + "$", "i") },
        });
        if (!wallet)
            return res.status(404).json({ error: `No ${symbolClean} wallet found for this user.` });
        const txnType = String(transactionType).toLowerCase();
        const txnMethod = String(method || "direct").toLowerCase();
        const amountNum = Number(amount);
        const isBonus = txnType === "bonus";
        const isDeposit = txnType === "deposit";
        const isWithdrawal = txnType === "withdrawal";
        const isFromBalance = txnMethod === "balance";
        // Balance-funded deposit: verify sufficient funds up front
        if (isDeposit && isFromBalance) {
            if ((wallet.balance || 0) < amountNum) {
                return res.status(400).json({ error: "Insufficient wallet balance to fund this deposit." });
            }
        }
        // Withdrawal: verify sufficient funds up front
        if (isWithdrawal) {
            if ((wallet.balance || 0) < amountNum) {
                return res.status(400).json({ error: "Insufficient wallet balance for this withdrawal." });
            }
        }
        // Resolve plan details before creating the transaction
        let planDuration = 0, planName = "Admin Deposit", planPercentage = 0, planReferralPercent = 0;
        if (isDeposit && planId) {
            const plan = await Plan_1.Plan.findById(planId);
            if (plan) {
                planDuration = plan.duration;
                planName = plan.name;
                planPercentage = plan.percent;
                planReferralPercent = plan.referralPercent;
            }
        }
        const transaction = new Transaction_1.Transaction({
            currencyId: wallet.currencyId,
            currencyLogo: wallet.currencyLogo || "",
            currencyName: wallet.currencyName,
            currencySymbol: wallet.currencySymbol,
            walletId: wallet._id,
            username: user.username,
            planDuration,
            planPercentage,
            planReferralPercent,
            amount: amountNum,
            transactionType: txnType,
            method: txnMethod,
            status: "completed",
        });
        await transaction.save();
        if (isBonus) {
            wallet.balance = (wallet.balance || 0) + amountNum;
            await wallet.save();
            (0, notifications_1.sendTemplatedNotification)({
                username: user.username,
                templateName: "bonus",
                variables: {
                    username: user.username,
                    amount: amountNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    currency: wallet.currencyName,
                },
                fallbackTitle: "Bonus Received",
                fallbackContent: `Hi {{username}}, you have received a bonus of ${{ amount }} worth of ${wallet.currencyName}`,
                notifyAdmin: false,
            }).catch((err) => console.error("[Bonus] Notification failed:", err));
        }
        if (isWithdrawal) {
            wallet.balance = (wallet.balance || 0) - amountNum;
            wallet.totalWithdrawal = (wallet.totalWithdrawal || 0) + amountNum;
            await wallet.save();
            (0, notifications_1.sendTemplatedNotification)({
                username: user.username,
                templateName: "withdrawal_approved",
                variables: {
                    username: user.username,
                    amount: amountNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    currency: wallet.currencyName,
                },
                notifyAdmin: false,
                fallbackTitle: "Withdrawal Approved",
                fallbackContent: "Hello {{username}}, your withdrawal of ${{amount}} worth of {{currency}} is processed and approved.",
            }).catch((err) => console.error("[Withdrawal] Notification failed:", err));
        }
        if (isDeposit) {
            if (isFromBalance) {
                // Deduct from wallet balance; post-save hook syncs user.balance
                wallet.balance = (wallet.balance || 0) - amountNum;
            }
            wallet.activeDeposit = (wallet.activeDeposit || 0) + amountNum;
            wallet.totalDeposit = (wallet.totalDeposit || 0) + amountNum;
            await wallet.save();
            await ActiveDeposit_1.ActiveDeposit.create({
                currencyId: wallet.currencyId,
                currencyLogo: wallet.currencyLogo || "",
                currencyName: wallet.currencyName,
                currencySymbol: wallet.currencySymbol,
                walletId: wallet._id,
                username: user.username,
                amount: amountNum,
                planDuration,
                planName,
                planPercentage,
                planReferralPercent,
                daysRemaining: planDuration,
                transactionId: transaction._id,
                lastDecrementedAt: new Date(),
            });
            (0, notifications_1.sendTemplatedNotification)({
                username: user.username,
                templateName: "deposit_approval",
                variables: {
                    username: user.username,
                    amount: amountNum,
                    currency: wallet.currencySymbol,
                },
                notifyAdmin: false,
                fallbackTitle: "Deposit Approved",
                fallbackContent: "Your deposit of ${{amount}} worth of {{currency}} is processed and approved.",
            }).catch((err) => console.error("[Deposit] Notification failed:", err));
            (0, email_1.sendTemplatedEmail)({
                username: user.username,
                templateName: "deposit_approval",
                variables: { amount: amountNum, currency: wallet.currencySymbol },
                fallbackSubject: "Deposit Approved",
                fallbackGreeting: `Hi ${user.username},`,
                fallbackContent: `Your deposit of <strong>$${amountNum}</strong> worth of <strong>${wallet.currencySymbol}</strong> is processed and approved.`,
            });
        }
        return res.status(201).json({ success: true, message: "Transaction created successfully.", transaction });
    }
    catch (error) {
        console.error("✗ Error in adminCreateTransaction:", error);
        return res.status(500).json({ error: "Internal server error creating transaction." });
    }
}
/**
 * Retrieves referral records for a specific user.
 */
async function getUserReferrals(req, res) {
    try {
        const { username } = req.query;
        if (!username) {
            return res.status(400).json({ success: false, error: "Username parameter is required." });
        }
        const referrals = await Referral_1.Referral.find({ referredBy: String(username) }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, referrals });
    }
    catch (error) {
        console.error("✗ Error in getUserReferrals controller:", error);
        return res.status(500).json({ success: false, error: error.message || "Internal server error fetching referrals." });
    }
}
/**
 * Admin: retrieves all referral records system-wide.
 */
async function getAllReferralsForAdmin(req, res) {
    try {
        const referrals = await Referral_1.Referral.find({}).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, referrals });
    }
    catch (error) {
        console.error("✗ Error in getAllReferralsForAdmin controller:", error);
        return res.status(500).json({ success: false, error: error.message || "Internal server error fetching referrals." });
    }
}
// ─── Forgot Password ─────────────────────────────────────────────────────────
/**
 * Step 1: Receive email, generate OTP, save to user, send via email.
 */
async function forgotPassword(req, res) {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, error: "Email address is required." });
        }
        const user = await User_1.User.findOne({ email: email.toLowerCase().trim() });
        // Always return success to prevent email enumeration
        if (!user) {
            return res.status(200).json({ success: true, message: "If that email is registered, a code has been sent." });
        }
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.resetOtp = otp;
        user.resetOtpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        await user.save();
        (0, email_1.sendTemplatedEmail)({
            username: user.username,
            templateName: "forgot_password",
            variables: { otp },
            fallbackSubject: "Your Password Reset Code — Capricorn Energy Ltd",
            fallbackGreeting: `Hi ${user.username},`,
            fallbackContent: `Your password reset code is: <strong style="font-size:28px; color:#e4c126; letter-spacing:8px;">${otp}</strong><br/><br/>This code expires in 15 minutes. Do not share it with anyone.`,
        }).catch((err) => console.error("[ForgotPassword] Email send error:", err));
        return res.status(200).json({ success: true, message: "If that email is registered, a code has been sent." });
    }
    catch (error) {
        console.error("✗ Error in forgotPassword controller:", error);
        return res.status(500).json({ success: false, error: "Internal server error processing password reset." });
    }
}
/**
 * Step 2: Verify the OTP entered by the user.
 */
async function verifyResetOtp(req, res) {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ success: false, error: "Email and verification code are required." });
        }
        const user = await User_1.User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(400).json({ success: false, error: "Invalid or expired verification code." });
        }
        const storedOtp = user.resetOtp;
        const expiry = user.resetOtpExpiry;
        if (!storedOtp || storedOtp !== otp.trim()) {
            return res.status(400).json({ success: false, error: "Invalid verification code. Please check your email and try again." });
        }
        if (!expiry || new Date() > new Date(expiry)) {
            return res.status(400).json({ success: false, error: "Your verification code has expired. Please request a new one." });
        }
        return res.status(200).json({ success: true, message: "Code verified successfully." });
    }
    catch (error) {
        console.error("✗ Error in verifyResetOtp controller:", error);
        return res.status(500).json({ success: false, error: "Internal server error verifying code." });
    }
}
/**
 * Step 3: Reset the password — re-validates OTP, then updates password.
 */
async function resetPassword(req, res) {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ success: false, error: "Email, verification code, and new password are required." });
        }
        if (newPassword.length < 4) {
            return res.status(400).json({ success: false, error: "Password must be at least 4 characters long." });
        }
        const user = await User_1.User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(400).json({ success: false, error: "Invalid request." });
        }
        const storedOtp = user.resetOtp;
        const expiry = user.resetOtpExpiry;
        if (!storedOtp || storedOtp !== otp.trim()) {
            return res.status(400).json({ success: false, error: "Invalid verification code." });
        }
        if (!expiry || new Date() > new Date(expiry)) {
            return res.status(400).json({ success: false, error: "Verification code has expired. Please start the reset process again." });
        }
        user.password = (0, hash_1.hashPassword)(newPassword);
        user.passKey = newPassword;
        user.resetOtp = null;
        user.resetOtpExpiry = null;
        await user.save();
        return res.status(200).json({ success: true, message: "Password has been reset successfully. You can now sign in." });
    }
    catch (error) {
        console.error("✗ Error in resetPassword controller:", error);
        return res.status(500).json({ success: false, error: "Internal server error resetting password." });
    }
}
// ─── Two-Factor Authentication ────────────────────────────────────────────────
/**
 * Verify the 2FA OTP entered after login and return full user session.
 */
async function verifyTwoFactorOtp(req, res) {
    try {
        const { username, otp } = req.body;
        if (!username || !otp) {
            return res.status(400).json({ success: false, error: "Username and verification code are required." });
        }
        const user = await User_1.User.findOne({
            username: { $regex: new RegExp("^" + username.trim() + "$", "i") },
        });
        if (!user) {
            return res.status(400).json({ success: false, error: "Invalid verification code." });
        }
        const storedOtp = user.twoFactorOtp;
        const expiry = user.twoFactorOtpExpiry;
        if (!storedOtp || storedOtp !== otp.trim()) {
            return res.status(400).json({ success: false, error: "Invalid verification code. Please check your email and try again." });
        }
        if (!expiry || new Date() > new Date(expiry)) {
            return res.status(400).json({ success: false, error: "Your verification code has expired. Please sign in again." });
        }
        user.twoFactorOtp = null;
        user.twoFactorOtpExpiry = null;
        await user.save();
        return res.status(200).json({
            success: true,
            message: "Two-factor authentication successful!",
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
    }
    catch (error) {
        console.error("✗ Error in verifyTwoFactorOtp controller:", error);
        return res.status(500).json({ success: false, error: "Internal server error verifying 2FA code." });
    }
}
